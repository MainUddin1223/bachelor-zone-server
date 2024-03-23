import { QuesType } from '@prisma/client';

export interface ICategory {
  category: string;
  adminId: number;
}

export interface IAddQuiz {
  adminId: number;
  categoryId: number;
  question: string;
  answer: string[];
  options: string[];
  questionType: QuesType;
}
