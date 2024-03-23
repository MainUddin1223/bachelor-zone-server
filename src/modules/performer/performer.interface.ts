import { QuesType } from '@prisma/client';

export interface ICreateTest {
  userId: number;
  categoryId: number;
}
export interface ITestQuestions {
  quizId: number;
  userId: number;
  options: string[];
  testId: number;
  questionType: QuesType;
}
export interface ICurrentStatics {
  name: string;
  email: string;
  score: number;
  wrongAnswer: number;
  rightAnswer: number;
  category: string;
  isCompleted: boolean;
}
export interface IStaticsAcc {
  totalScore: number;
  totalRightAnswer: number;
  totalWrongAnswer: number;
  name: string;
  email: string;
  category: string[];
  totalTest: number;
  totalCompletedTest: number;
  totalPendingTest: number;
}
export interface IMyTests {
  score: number;
  wrongAnswer: number;
  rightAnswer: number;
  category: {
    category: string;
  };
  isCompleted: boolean;
  question: {
    quiz?: {
      answer: string[];
    };
    quizId: number;
    answered: boolean;
    options: string[];
  };
}

export interface ICheckAnswer {
  questionId: number;
  userId: number;
  selectedAnswer: string[];
}
