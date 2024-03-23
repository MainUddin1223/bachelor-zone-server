import { PrismaClient, QuesType } from '@prisma/client';

const prisma = new PrismaClient();

export const getRandomValues = (arr: any[], num: number) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
};

export const getAnswerVerified = async (
  quesType: QuesType,
  options: string[],
  answer: string[],
  selectedAnswer: string[],
  quesId: number,
  testId: number
) => {
  const getTestData = await prisma.test.findUnique({
    where: {
      id: testId,
    },
  });
  if (quesType == 'single') {
    const verifyAnswer =
      selectedAnswer[0].toLowerCase() == answer[0].toLowerCase();
    const quesData = {
      answered: true,
      selectedAnswer,
      correctAnswer: answer,
      isCorrectAnswer: verifyAnswer,
    };
    if (verifyAnswer) {
      const testData = {
        score: Number(getTestData?.score) + 1,
        rightAnswer: Number(getTestData?.rightAnswer) + 1,
      };
      const result = await updateStatics(quesId, testId, quesData, testData);
      return { result, message: 'Correct answer !!' };
    } else {
      const testData = {
        wrongAnswer: Number(getTestData?.wrongAnswer) + 1,
      };
      const result = await updateStatics(quesId, testId, quesData, testData);
      return { result, message: 'Wrong answer !' };
    }
  } else {
    const filterAnswer = options.filter(option => answer.includes(option));
    const convertToLowerCase = (arr: string[]) =>
      arr.map(element => element.toLowerCase());
    const verifyAnswer =
      JSON.stringify(convertToLowerCase(filterAnswer).sort()) ===
      JSON.stringify(convertToLowerCase(selectedAnswer).sort());
    const quesData = {
      answered: true,
      selectedAnswer,
      correctAnswer: filterAnswer,
      isCorrectAnswer: verifyAnswer,
    };
    if (verifyAnswer) {
      const testData = {
        score: Number(getTestData?.score) + 1,
        rightAnswer: Number(getTestData?.rightAnswer) + 1,
      };
      const result = await updateStatics(quesId, testId, quesData, testData);
      return { result, message: 'Correct answer !!' };
    } else {
      const testData = {
        wrongAnswer: Number(getTestData?.wrongAnswer) + 1,
      };
      const result = await updateStatics(quesId, testId, quesData, testData);
      return { result, message: 'Wrong answer !' };
    }
  }
};

const updateStatics = async (
  quesId: number,
  testId: number,
  quesData: any,
  testData: any
) => {
  const result = await prisma.$transaction(async prisma => {
    const updateQuestion = await prisma.question.update({
      where: {
        id: quesId,
      },
      data: {
        ...quesData,
      },
    });
    await prisma.test.update({
      where: {
        id: testId,
      },
      data: {
        ...testData,
      },
    });
    return updateQuestion;
  });
  return result;
};
