import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import ApiError from '../../utils/errorHandlers/apiError';
import { mealCost } from './user.constant';
import { errorMessage as errorMsg } from './user.constant';
const prisma = new PrismaClient();

export const isValidOrderDate = (date: string): boolean => {
  const todayDate = dayjs(new Date()).startOf('hour');
  const deliveryDate = dayjs(date).startOf('hour');
  if (todayDate > deliveryDate) {
    return false;
  }
  return true;
};

export const isValidOrderForToday = (date: string): boolean => {
  const todayDate = dayjs(new Date()).startOf('hour');
  const deliveryDate = todayDate
    .format('YYYY-MM-DD[T]00:00:00.000Z')
    .split('T')[0];
  const formatDeliveryDate = date.split('T')[0];
  const formatDate = todayDate.format('YYYY-MM-DD[T]06:30:00.000Z');
  if (deliveryDate == formatDeliveryDate && date > formatDate) {
    return false;
  }
  return true;
};
export const getUserInfo = async (id: number) => {
  const userInfo = await prisma.userInfo.findFirst({
    where: {
      user_id: id,
    },
  });
  if (!userInfo) {
    throw new ApiError(404, errorMsg.unclaimedUser);
  }
  return userInfo;
};

export const updateOrderStatus = async (
  id: number,
  userId: number,
  currentStatus: 'pending' | 'canceled',
  status: 'pending' | 'canceled',
  errorMessage: string,
  successMessage: string
) => {
  const getOrder = await prisma.order.findUnique({
    where: {
      id,
      user_id: userId,
      status: currentStatus,
    },
  });

  const userInfo = await getUserInfo(userId);
  let Balance: number;
  if (status === 'canceled') {
    Balance = userInfo.Balance + mealCost;
  } else {
    Balance = userInfo.Balance - mealCost;
  }
  if (!getOrder) {
    throw new ApiError(404, errorMsg.orderNotFound);
  }
  const deliveryDate = dayjs(getOrder.delivery_date).format(
    'YYYY-MM-DD[T]00:00.000Z'
  );
  const todayDate = dayjs(new Date()).startOf('hour');
  const formatTodayDate = todayDate.format('YYYY-MM-DD[T]00:00.000Z');
  if (formatTodayDate > deliveryDate) {
    throw new ApiError(409, errorMsg.orderDatePassed);
  }
  const formatCancelDate = todayDate.format('YYYY-MM-DD[T]hh:mm:ss.sssZ');
  const cancelDate = formatCancelDate.split('T')[0];
  const formatDeliveryDate = deliveryDate.split('T')[0];
  const formatDate = todayDate.format('YYYY-MM-DD[T]06:30:00.000Z');

  if (cancelDate == formatDeliveryDate && formatCancelDate > formatDate) {
    //check the time if the order is for today
    throw new ApiError(409, errorMsg.orderDatePassed);
  }

  const result = await prisma.$transaction(async tx => {
    const cancelOrder = await tx.order.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
    if (!cancelOrder.id) {
      throw new ApiError(500, errorMessage);
    }
    const updateBalance = await tx.userInfo.update({
      where: {
        user_id: userId,
      },
      data: {
        Balance,
      },
    });
    if (!updateBalance.id) {
      throw new ApiError(500, errorMessage);
    }
    return successMessage; //return from prisma transaction
  });

  return result;
};
