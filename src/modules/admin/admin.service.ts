import { PrismaClient } from '@prisma/client';
import { IAddQuiz, ICategory } from './admin.interface';
import ApiError from '../../utils/errorHandlers/apiError';
import { StatusCodes } from 'http-status-codes';

const prisma = new PrismaClient();

const addCategory = async (categoryPayload: ICategory) => {
  const isExist = await prisma.category.findFirst({
    where: {
      category: {
        equals: categoryPayload.category,
        mode: 'insensitive',
      },
    },
  });

  if (isExist) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Category already exist');
  }
  const result = await prisma.category.create({
    data: categoryPayload,
  });
  return result;
};

const addQuiz = async (data: IAddQuiz) => {
  const isCategoryExist = await prisma.category.findUnique({
    where: {
      id: data.categoryId,
    },
  });
  if (!isCategoryExist) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Category dose not exist');
  }
  const result = await prisma.quiz.create({
    data,
  });
  return result;
};

const getStatics = async () => {
  const performers = await prisma.auth.count({
    where: {
      role: 'performer',
    },
  });
  const categories = await prisma.category.count({});
  const totalQuiz = await prisma.quiz.count({});
  const totalCompletedTest = await prisma.test.count({
    where: {
      isCompleted: true,
    },
  });
  const totalPending = await prisma.test.count({
    where: {
      isCompleted: false,
    },
  });
  return {
    result: {
      performers,
      categories,
      totalQuiz,
      totalCompletedTest,
      totalPending,
    },
  };
};

export const adminService = {
  addCategory,
  addQuiz,
  getStatics,
};
