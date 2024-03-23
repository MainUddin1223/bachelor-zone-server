import { PrismaClient } from '@prisma/client';
import {
  ICheckAnswer,
  ICreateTest,
  ICurrentStatics,
  IStaticsAcc,
  ITestQuestions,
} from './performer.interface';
import ApiError from '../../utils/errorHandlers/apiError';
import { StatusCodes } from 'http-status-codes';
import { getAnswerVerified, getRandomValues } from './performer.utils';
const prisma = new PrismaClient();

const createQuizTest = async (payload: ICreateTest) => {
  const isCategoryExist = await prisma.category.findUnique({
    where: {
      id: payload.categoryId,
    },
    include: {
      quiz: true,
    },
  });
  if (!isCategoryExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Category Not Found');
  }
  const randomQuestions = getRandomValues(isCategoryExist.quiz, 10);
  const result = await prisma.$transaction(async prisma => {
    const quizTest = await prisma.test.create({
      data: {
        userId: payload.userId,
        categoryId: payload.categoryId,
      },
    });
    const testQuestions: ITestQuestions[] = [];
    randomQuestions.forEach(question => {
      const randomOptions = getRandomValues(question.options, 3);
      const optionsWithAnswers = [...question.answer, ...randomOptions];
      const options = getRandomValues(optionsWithAnswers, 4);
      testQuestions.push({
        quizId: question.id,
        userId: payload.userId,
        options,
        testId: quizTest.id,
        questionType: question.questionType,
      });
    });
    await prisma.question.createMany({
      data: testQuestions,
    });
    return quizTest;
  });
  const getQuizTestQuestions = await prisma.test.findUnique({
    where: {
      id: result.id,
    },
    select: {
      id: true,
      score: true,
      wrongAnswer: true,
      rightAnswer: true,

      question: {
        select: {
          id: true,
          options: true,
          answered: true,
          questionType: true,
        },
      },
    },
  });
  return getQuizTestQuestions;
};

const getCategories = async () => {
  const result = await prisma.category.findMany({
    select: {
      id: true,
      category: true,
    },
  });
  return { result };
};

const getMyTestById = async (id: number, userId: number) => {
  const result = await prisma.test.findUnique({
    where: {
      id,
      userId,
    },
    include: {
      category: {
        select: {
          category: true,
        },
      },
      question: {
        orderBy: {
          id: 'asc',
        },
        select: {
          answered: true,
          correctAnswer: true,
          id: true,
          isCorrectAnswer: true,
          options: true,
          questionType: true,
          selectedAnswer: true,
          quiz: {
            select: {
              question: true,
            },
          },
        },
      },
    },
  });
  return result;
};

const checkAnswer = async (payload: ICheckAnswer) => {
  const { selectedAnswer } = payload;
  const isQuesExist = await prisma.question.findFirst({
    where: {
      id: payload.questionId,
      userId: payload.userId,
    },
    include: {
      quiz: true,
    },
  });
  if (!isQuesExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Question not found');
  }
  if (isQuesExist.answered === true) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'You have already answered the question'
    );
  }
  const verifyAnswer = getAnswerVerified(
    isQuesExist.questionType,
    isQuesExist.options,
    isQuesExist.quiz.answer,
    selectedAnswer,
    isQuesExist.id,
    isQuesExist.testId
  );
  return verifyAnswer;
};

const getMyQuizTests = async (id: number) => {
  const result = await prisma.test.findMany({
    where: {
      userId: id,
    },
    include: {
      category: {
        select: {
          category: true,
        },
      },
    },
  });
  return { result };
};

const getStatics = async (id: number) => {
  const myStatics: any = await prisma.$queryRaw`
    SELECT pro.name, pro.email,ts."isCompleted", ts.score, ts."wrongAnswer", ts."rightAnswer", ct.category
    FROM auth as pro
    LEFT JOIN test as ts ON pro.id = ts."userId"
    RIGHT JOIN category as ct ON ts."categoryId" = ct.id
    WHERE pro.id = ${id}
    `;
  const statics = myStatics.reduce(
    (acc: IStaticsAcc, current: ICurrentStatics) => {
      const {
        name,
        email,
        score,
        wrongAnswer,
        rightAnswer,
        category,
        isCompleted,
      } = current;
      if (!acc['category'].includes(category)) {
        acc['category'].push(category);
      }
      acc['totalScore'] += Number(score);
      acc['name'] = name;
      acc['email'] = email;
      acc['totalRightAnswer'] += Number(rightAnswer);
      acc['totalWrongAnswer'] += Number(wrongAnswer);
      acc['totalTest'] += 1;
      if (isCompleted) {
        acc['totalCompletedTest'] += 1;
      } else {
        acc['totalPendingTest'] += 1;
      }
      return acc;
    },
    {
      totalScore: 0,
      totalRightAnswer: 0,
      totalWrongAnswer: 0,
      name: '',
      email: '',
      category: [],
      totalTest: 0,
      totalCompletedTest: 0,
      totalPendingTest: 0,
    }
  );
  const leaderBoard = await prisma.leaderBoard.findMany({
    orderBy: {
      score: 'desc',
    },
  });
  const getPosition = leaderBoard.findIndex(position => position.userId === id);
  const myPosition = getPosition == -1 ? 0 : getPosition + 1;
  return { statics: { ...statics, myPosition } };
};

const completeTest = async (id: number, userId: number) => {
  const isCompleted = await prisma.test.findUnique({
    where: {
      id,
      userId,
      isCompleted: false,
    },
  });
  if (!isCompleted) {
    throw new ApiError(404, 'Test not found');
  }
  await prisma.$transaction(async prisma => {
    const updateTest = await prisma.test.update({
      where: {
        id,
      },
      data: {
        isCompleted: true,
      },
    });
    const isExist = await prisma.leaderBoard.findFirst({
      where: {
        userId,
      },
    });

    if (isExist) {
      await prisma.leaderBoard.update({
        where: {
          id: isExist.id,
        },
        data: {
          score: Number(isExist.score) + Number(updateTest.score),
          testCompleted: Number(isExist.testCompleted) + 1,
        },
      });
    } else {
      await prisma.leaderBoard.create({
        data: {
          userId,
          score: Number(updateTest.score),
          testCompleted: 1,
        },
      });
    }
  });
  return { message: 'Test completed successfully' };
};

const getLeaderBoard = async () => {
  const result = await prisma.leaderBoard.findMany({
    orderBy: {
      score: 'desc',
    },
    select: {
      score: true,
      testCompleted: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });
  return { data: result };
};

export const performerService = {
  createQuizTest,
  getMyQuizTests,
  getStatics,
  checkAnswer,
  getCategories,
  getMyTestById,
  completeTest,
  getLeaderBoard,
};
