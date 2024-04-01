import { PrismaClient } from '@prisma/client';
import { mealCost } from './user.constant';
import ApiError from '../../utils/errorHandlers/apiError';
import {
  getFormatDate,
  getFormatDateAndTime,
  isValidOrderDate,
  isValidOrderForToday,
} from './user.utils';
import dayjs from 'dayjs';

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
  const delivery_date = getFormatDate(orderSortOfDate);
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

const cancelOrder = async (id: number, userId: number) => {
  const getOrder = await prisma.order.findUnique({
    where: {
      id,
      user_id: userId,
      status: 'pending',
    },
  });
  const userInfo = await prisma.userInfo.findFirst({
    where: {
      user_id: userId,
    },
  });
  if (!userInfo) {
    throw new ApiError(404, 'Unclaimed user');
  }
  if (!getOrder) {
    throw new ApiError(404, 'Order not found');
  }
  const deliveryDate = getFormatDate(dayjs(getOrder.delivery_date));
  const todayDate = dayjs(new Date()).startOf('hour');
  const formatTodayDate = getFormatDate(todayDate);
  if (formatTodayDate > deliveryDate) {
    throw new ApiError(409, 'Order date has passed');
  }
  const formatCancelDate = todayDate.format('YYYY-MM-DD[T]hh:mm:ss.sssZ');
  const cancelDate = formatCancelDate.split('T')[0];
  const formatDeliveryDate = deliveryDate.split('T')[0];
  const formatDate = getFormatDateAndTime(todayDate);
  if (cancelDate == formatDeliveryDate && formatCancelDate > formatDate) {
    throw new ApiError(409, 'Order date has passed');
  }
  const result = await prisma.$transaction(async tx => {
    const cancelOrder = await tx.order.update({
      where: {
        id,
      },
      data: {
        status: 'canceled',
      },
    });
    if (!cancelOrder.id) {
      throw new ApiError(500, 'Failed to cancel the order');
    }
    const updateBalance = await tx.userInfo.update({
      where: {
        user_id: userId,
      },
      data: {
        Balance: userInfo.Balance + mealCost,
      },
    });
    if (!updateBalance.id) {
      throw new ApiError(500, 'Failed to cancel order');
    }
    return 'Order canceled successfully';
  });
  return result;
};

const updateOrder = async (id: number, userId: number) => {
  const getOrder = await prisma.order.findUnique({
    where: {
      id,
      user_id: userId,
      status: 'canceled',
    },
  });
  const userInfo = await prisma.userInfo.findFirst({
    where: {
      user_id: userId,
    },
  });
  if (!userInfo) {
    throw new ApiError(404, 'Unclaimed user');
  }
  if (!getOrder) {
    throw new ApiError(404, 'Order not found');
  }
  const deliveryDate = dayjs(getOrder.delivery_date).format(
    'YYYY-MM-DD[T]00:00.000Z'
  );
  const todayDate = dayjs(new Date()).startOf('hour');
  const formatTodayDate = todayDate.format('YYYY-MM-DD[T]00:00.000Z');
  if (formatTodayDate > deliveryDate) {
    throw new ApiError(409, 'Order date has passed');
  }
  const formatCancelDate = todayDate.format('YYYY-MM-DD[T]hh:mm:ss.sssZ');
  const cancelDate = formatCancelDate.split('T')[0];
  const formatDeliveryDate = deliveryDate.split('T')[0];
  const formatDate = todayDate.format('YYYY-MM-DD[T]06:30:00.000Z');
  if (cancelDate == formatDeliveryDate && formatCancelDate > formatDate) {
    throw new ApiError(409, 'Order date has passed');
  }
  const result = await prisma.$transaction(async tx => {
    const cancelOrder = await tx.order.update({
      where: {
        id,
      },
      data: {
        status: 'pending',
      },
    });
    if (!cancelOrder.id) {
      throw new ApiError(500, 'Failed to reorder the order');
    }
    const updateBalance = await tx.userInfo.update({
      where: {
        user_id: userId,
      },
      data: {
        Balance: userInfo.Balance - mealCost,
      },
    });
    if (!updateBalance.id) {
      throw new ApiError(500, 'Failed to reorder the order');
    }
    return 'Order updated successfully';
  });
  return result;
};

export const userService = {
  placeOrder,
  cancelOrder,
  updateOrder,
};
