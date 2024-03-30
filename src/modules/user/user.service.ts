import { PrismaClient } from '@prisma/client';
import { mealCost } from './user.constant';
import ApiError from '../../utils/errorHandlers/apiError';

const prisma = new PrismaClient();

const placeOrder = async (date: string, userId: number) => {
  const userInfo: any = await prisma.userInfo.findUnique({
    where: {
      user_id: userId,
    },
  });
  if (!userInfo) {
    throw new ApiError(404, 'Unclaimed user');
  }
  console.log(userInfo);
  const balance = userInfo.Balance;
  if (mealCost > balance) {
    throw new ApiError(403, 'Insufficient Balance');
  }
  const isOrderExist = await prisma.order.findFirst({
    where: {
      delivery_date: date,
    },
  });
  if (isOrderExist) {
    throw new ApiError(409, 'Order already exist');
  }
  const createOrder = await prisma.order.create({
    data: {
      user_id: userId,
      team_id: userInfo.team_id,
      delivery_date: date,
    },
  });
  return createOrder;
};

export const userService = {
  placeOrder,
};
