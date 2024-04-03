import { PrismaClient } from '@prisma/client';
import { errorMessage, mealCost, successMessage } from './user.constant';
import ApiError from '../../utils/errorHandlers/apiError';
import {
  getUserInfo,
  isValidOrderDate,
  isValidOrderForToday,
  updateOrderStatus,
} from './user.utils';
import dayjs from 'dayjs';
import { pagination } from '../../utils/helpers/pagination';

const prisma = new PrismaClient();

const placeOrder = async (date: string, userId: number) => {
  const isValidDeliveryDate = isValidOrderDate(date);
  if (!isValidDeliveryDate) {
    throw new ApiError(409, errorMessage.invalidDeliveryDate);
  }
  const isValidDeliveryDateForToday = isValidOrderForToday(date);
  if (!isValidDeliveryDateForToday) {
    throw new ApiError(409, errorMessage.invalidDeliveryForToday);
  }
  const userInfo = await getUserInfo(userId);

  const balance = userInfo.Balance;
  if (mealCost > balance) {
    throw new ApiError(403, errorMessage.insufficientBalance);
  }
  const orderSortOfDate = date.split('T')[0];
  const delivery_date = `${orderSortOfDate}T00:00:00.000Z`;
  const isOrderExist = await prisma.order.findFirst({
    where: {
      delivery_date,
    },
  });
  if (isOrderExist) {
    throw new ApiError(409, errorMessage.orderExist);
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
      throw new ApiError(500, errorMessage.placeOrderFail);
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
      throw new ApiError(500, errorMessage.placeOrderFail);
    }
    return delivery_date;
  });
  return placeOrder;
};

const cancelOrder = async (id: number, userId: number) => {
  const result = updateOrderStatus(
    id,
    userId,
    'pending',
    'canceled',
    errorMessage.failToCancel,
    successMessage.successToCancel
  );
  return result;
};

const updateOrder = async (id: number, userId: number) => {
  const result = updateOrderStatus(
    id,
    userId,
    'canceled',
    'pending',
    errorMessage.failToUpdate,
    successMessage.successToUpdate
  );
  return result;
};

const getUpcomingOrder = async (id: number) => {
  const todayDate = dayjs(new Date()).startOf('hour');
  const formatTodayDate = todayDate.format('YYYY-MM-DD');
  const upcomingOrders = await prisma.order.findMany({
    where: {
      user_id: id,
      delivery_date: {
        gte: `${formatTodayDate}T00:00:00.000Z`,
      },
    },
    orderBy: {
      delivery_date: 'asc',
    },
  });
  return upcomingOrders;
};

const getOrderHistory = async (id: number, pageNumber: number) => {
  const meta = pagination({ page: pageNumber });
  const { skip, take } = meta;
  const todayDate = dayjs(new Date()).startOf('hour');
  const formatTodayDate = todayDate.format('YYYY-MM-DD');
  const upcomingOrders = await prisma.order.findMany({
    skip,
    take,
    where: {
      user_id: id,
      delivery_date: {
        lt: `${formatTodayDate}T00:00:00.000Z`,
      },
    },
    orderBy: {
      delivery_date: 'desc',
    },
  });
  const totalCount = await prisma.order.count({
    where: {
      delivery_date: {
        lt: `${formatTodayDate}T00:00:00.000Z`,
      },
    },
  });

  const totalPage =
    totalCount > take ? Math.ceil(totalCount / Number(take)) : 1;
  return {
    data: upcomingOrders,
    meta: { size: take, total: totalCount, totalPage },
  };
};

const userInfo = async (id: number) => {
  const result = await prisma.userInfo.findFirst({
    where: {
      user_id: id,
    },
    select: {
      address: true,
      team_member: {
        select: {
          leader: {
            select: {
              name: true,
              phone: true,
            },
          },
          name: true,
        },
      },
      id: true,
      Balance: true,
      virtual_id: true,
      is_claimed: true,
      user: {
        select: {
          phone: true,
          name: true,
        },
      },
    },
  });
  if (!result?.id) {
    throw new ApiError(404, errorMessage.unclaimedUser);
  }
  const formatInfo = {
    balance: result?.Balance,
    address: result?.address.address,
    team: result?.team_member.name,
    teamLeader: result?.team_member.leader.name,
    leaderPhone: result?.team_member.leader.phone,
    name: result.user.name,
    phone: result.user.phone,
    virtual_id: result?.virtual_id,
    is_claimed: result?.is_claimed,
  };
  return formatInfo;
};

export const userService = {
  placeOrder,
  cancelOrder,
  updateOrder,
  getUpcomingOrder,
  getOrderHistory,
  userInfo,
};
