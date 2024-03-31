import { PrismaClient } from '@prisma/client';
import { mealCost } from './user.constant';
import ApiError from '../../utils/errorHandlers/apiError';
import { isValidOrderDate, isValidOrderForToday } from './user.utils';

const prisma = new PrismaClient();

const placeOrder = async (date: string, userId: number) => {
  const isValidDeliveryDate = isValidOrderDate(date);
  if (!isValidDeliveryDate) {
    throw new ApiError(409, 'Invalid delivery date');
  }
  const isValidDeliveryDateForToday = isValidOrderForToday(date);
  if (!isValidDeliveryDateForToday) {
    throw new ApiError(409, 'You must order lunch for today before 6:30');
  }
  const userInfo: any = await prisma.userInfo.findUnique({
    where: {
      user_id: userId,
    },
  });

  if (!userInfo) {
    throw new ApiError(404, 'Unclaimed user');
  }
  const balance = userInfo.Balance;
  if (mealCost > balance) {
    throw new ApiError(403, 'Insufficient Balance');
  }
  const orderSortOfDate = date.split('T')[0];
  const delivery_date = `${orderSortOfDate}T00:00:00.000Z`;
  const isOrderExist = await prisma.order.findFirst({
    where: {
      delivery_date,
    },
  });
  if (isOrderExist) {
    throw new ApiError(409, 'Order already exist');
  }
  const placeOrder = await prisma.$transaction(async tx => {
    const createOrder = await tx.order.create({
      data: {
        user_id: userId,
        team_id: userInfo.team_id,
        delivery_date,
      },
    });
    if (!createOrder.id) {
      throw new ApiError(500, 'Failed to place order');
    }
    const updateBalance = await tx.userInfo.update({
      where: {
        user_id: userId,
      },
      data: {
        Balance: balance - mealCost,
      },
    });
    if (!updateBalance.id) {
      throw new ApiError(500, 'Failed to place order');
    }
    return 'Order placed successfully';
  });
  return placeOrder;
};

export const userService = {
  placeOrder,
};
