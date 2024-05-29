import { PrismaClient } from '@prisma/client';
import { errorMessage, mealCost, successMessage } from './user.constant';
import ApiError from '../../utils/errorHandlers/apiError';
import {
  getUserInfo,
  isClaimedUser,
  isValidOrderDate,
  isValidOrderForToday,
  updateOrderStatus,
} from './user.utils';
import { pagination } from '../../utils/helpers/pagination';
import { formatLocalTime } from '../../utils/helpers/timeZone';

const prisma = new PrismaClient();

const placeOrder = async (date: string, userId: number) => {
  const isValidDeliveryDate = isValidOrderDate(date);
  await isClaimedUser(userId);

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
  const formatDate = formatLocalTime(date);
  const isOrderExist = await prisma.order.findFirst({
    where: {
      delivery_date: `${formatDate.formatDefaultDateAndTime}`,
      user_id: userId,
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
        delivery_date: formatDate.formatDefaultDateAndTime,
        price: mealCost,
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
    return { delivery_date: formatDate.formatDefaultDateAndTime };
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
  await isClaimedUser(userId);
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
  const todayDate = formatLocalTime(new Date());
  const upcomingOrders = await prisma.order.findMany({
    where: {
      user_id: id,
      delivery_date: {
        gte: `${todayDate.formatDefaultDateAndTime}`,
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
  const { skip, take, page } = meta;
  const todayDate = formatLocalTime(new Date());
  const orderHistory = await prisma.order.findMany({
    skip,
    take,
    where: {
      user_id: id,
      delivery_date: {
        lt: todayDate.formatDefaultDateAndTime,
      },
    },
    orderBy: {
      delivery_date: 'desc',
    },
  });
  const totalOrderHistory = await prisma.order.findMany({
    where: {
      delivery_date: {
        lt: todayDate.formatDefaultDateAndTime,
      },
    },
  });
  const initialOrderData = {
    totalCount: totalOrderHistory.length,
    deliveredOrder: 0,
    notReceived: 0,
    canceledOrder: 0,
  };

  const orderData = totalOrderHistory.reduce((acc, order) => {
    if (order.status === 'pending') {
      acc.notReceived += 1;
    } else if (order.status === 'received') {
      acc.deliveredOrder += 1;
    } else {
      acc.canceledOrder += 1;
    }
    return acc;
  }, initialOrderData);

  const totalPage =
    initialOrderData.totalCount > take
      ? Math.ceil(initialOrderData.totalCount / Number(take))
      : 1;
  return {
    data: { orderHistory, orderData },
    meta: {
      size: take,
      total: initialOrderData.totalCount,
      totalPage,
      currentPage: page,
    },
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
  let teamInfo = {};
  const getTeamInfo = await prisma.team.findUnique({
    where: {
      leader_id: id,
    },
  });
  if (getTeamInfo) {
    const todayDate = formatLocalTime(new Date());
    const getTodayOrder = await prisma.order.findMany({
      where: {
        team_id: getTeamInfo.id,
        status: {
          not: 'canceled',
        },
        delivery_date: todayDate.formatDefaultDateAndTime,
      },
    });
    const status = getTodayOrder.find(order => order.status === 'pending');
    teamInfo = { ...getTeamInfo, order: getTodayOrder.length, status };
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
    teamInfo,
  };
  return formatInfo;
};

const getTransaction = async (id: number, pageNumber: number) => {
  const meta = pagination({ page: pageNumber });
  const { skip, take, page } = meta;
  const result = await prisma.transaction.findMany({
    skip,
    take,
    where: {
      user_id: id,
    },
    orderBy: {
      date: 'desc',
    },
    select: {
      amount: true,
      date: true,
      transaction_type: true,
      description: true,
      id: true,
    },
  });
  const totalCount = await prisma.transaction.count();
  const totalPage =
    totalCount > take ? Math.ceil(totalCount / Number(take)) : 1;
  return {
    data: result,
    meta: { size: take, total: totalCount, totalPage, currentPage: page },
  };
};

export const userService = {
  placeOrder,
  cancelOrder,
  updateOrder,
  getUpcomingOrder,
  getOrderHistory,
  userInfo,
  getTransaction,
};
