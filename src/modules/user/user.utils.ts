import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import ApiError from '../../utils/errorHandlers/apiError';
import { mealCost } from './user.constant';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { errorMessage as errorMsg } from './user.constant';
import { formatLocalTime } from '../../utils/helpers/timeZone';
const prisma = new PrismaClient();

dayjs.extend(utc);
dayjs.extend(timezone);

// export const isValidOrderDate = (date: string): boolean => {
//   const todayDate = formatLocalTime(new Date());
//   const deliveryDate = formatLocalTime(date);
//   if (todayDate.localDate > deliveryDate.localDate) {
//     return false;
//   }
//   return true;
// };

export const isValidOrderDate = (date: string): boolean => {
  const todayDate = formatLocalTime(new Date()).localDate;
  const deliveryDate = formatLocalTime(date).localDate;
  return todayDate <= deliveryDate;
};

export const isValidOrderForToday = (date: string): boolean => {
  const getDateAndTime = formatLocalTime(
    new Date(),
    'YYYY-MM-DD[T]06:30:00.000Z'
  );
  const formatDeliveryDate = formatLocalTime(date);
  // date and time for now
  const formatOrderDate = getDateAndTime.localTimeAndDate;

  const todayDate = getDateAndTime.localDate;
  const deliveryDate = formatDeliveryDate.localDate;

  const formatDate = getDateAndTime.formatWithHourDateAndTime;
  if (todayDate == deliveryDate && formatOrderDate > formatDate) {
    //check the time if the order is for today
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

export const isClaimedUser = async (id: number) => {
  const userInfo = await prisma.userInfo.findFirst({
    where: {
      user_id: id,
      is_claimed: true,
      is_in_team: true,
    },
  });
  if (!userInfo) {
    throw new ApiError(404, errorMsg.unclaimedUser);
  }
  return userInfo;
};

// export const updateOrderStatus = async (
//   id: number,
//   userId: number,
//   currentStatus: 'pending' | 'canceled',
//   status: 'pending' | 'canceled',
//   errorMessage: string,
//   successMessage: string
// ) => {
//   const getOrder = await prisma.order.findUnique({
//     where: {
//       id,
//       user_id: userId,
//       status: currentStatus,
//     },
//   });

//   const userInfo = await getUserInfo(userId);
//   let Balance: number;
//   if (status === 'canceled') {
//     Balance = userInfo.Balance + Number(getOrder?.price);
//   } else {
//     Balance = userInfo.Balance - mealCost;
//   }
//   if (!getOrder) {
//     throw new ApiError(404, errorMsg.orderNotFound);
//   }
//   const deliveryDate = formatLocalTime(getOrder.delivery_date);
//   const getDateAndTime = formatLocalTime(
//     new Date(),
//     'YYYY-MM-DD[T]06:30:00.000Z'
//   );
//   const formatTodayDate = getDateAndTime.formatDefaultDateAndTime;
//   if (formatTodayDate > deliveryDate.formatDefaultDateAndTime) {
//     throw new ApiError(409, errorMsg.orderDatePassed);
//   }
//   const formatCancelDate = getDateAndTime.localTimeAndDate;
//   const cancelDate = getDateAndTime.localDate;
//   const formatDeliveryDate = deliveryDate.localDate;
//   const formatDate = getDateAndTime.formatWithHourDateAndTime;
//   if (cancelDate == formatDeliveryDate && formatCancelDate > formatDate) {
//     //check the time if the order is for today
//     throw new ApiError(409, errorMsg.todayOrderDatePassed);
//   }

//   const result = await prisma.$transaction(async tx => {
//     const cancelOrder = await tx.order.update({
//       where: {
//         id,
//       },
//       data: {
//         status,
//       },
//     });
//     if (!cancelOrder.id) {
//       throw new ApiError(500, errorMessage);
//     }
//     const updateBalance = await tx.userInfo.update({
//       where: {
//         user_id: userId,
//       },
//       data: {
//         Balance,
//       },
//     });
//     if (!updateBalance.id) {
//       throw new ApiError(500, errorMessage);
//     }
//     return successMessage; //return from prisma transaction
//   });

//   return result;
// };

export const updateOrderStatus = async (
  id: number,
  userId: number,
  currentStatus: 'pending' | 'canceled',
  newStatus: 'pending' | 'canceled',
  errorMessage: string,
  successMessage: string
): Promise<string> => {
  const getOrder = await prisma.order.findUnique({
    where: {
      id,
      user_id: userId,
      status: currentStatus,
    },
  });

  if (!getOrder) {
    throw new ApiError(404, errorMsg.orderNotFound);
  }

  const userInfo = await getUserInfo(userId);
  const mealPrice = getOrder.price;

  let updatedBalance: number;
  if (newStatus === 'canceled') {
    updatedBalance = userInfo.Balance + mealPrice;
  } else {
    updatedBalance = userInfo.Balance - mealCost;
  }

  const currentDate = new Date();
  const orderDeliveryDate = new Date(getOrder.delivery_date);

  if (currentDate > orderDeliveryDate) {
    throw new ApiError(409, errorMsg.orderDatePassed);
  }

  if (currentDate.getDate() === orderDeliveryDate.getDate()) {
    const orderTime = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      6,
      30
    );

    if (currentDate >= orderTime) {
      throw new ApiError(409, errorMsg.todayOrderDatePassed);
    }
  }

  await prisma.order.updateMany({
    where: {
      id,
      user_id: userId,
      status: currentStatus,
    },
    data: {
      status: newStatus,
    },
  });

  await prisma.userInfo.update({
    where: {
      user_id: userId,
    },
    data: {
      Balance: updatedBalance,
    },
  });

  return successMessage;
};
