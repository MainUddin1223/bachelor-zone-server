import { PrismaClient } from '@prisma/client';
import { mealCost } from './user.constant';

const prisma = new PrismaClient();

const placeOrder = async (date: string, userId: number) => {
  const userInfo: any = await prisma.auth.findUnique({
    where: {
      id: userId,
    },
    include: {
      UserInfo: true,
    },
  });
  if (userInfo?.UserInfo) {
    const balance = userInfo.UserInfo.Balance;
    if (mealCost > balance) {
      return {
        message: 'Insufficient Balance',
      };
    } else {
      const isOrderExist = await prisma.order.findFirst({
        where: {
          delivery_date: date,
        },
      });
      if (isOrderExist) {
        return { message: 'Order already exist' };
      } else {
        const createOrder = await prisma.order.create({
          data: {
            user_id: userId,
            team_id: userInfo.UserInfo.team_id,
            delivery_date: date,
          },
        });
        return createOrder;
      }
    }
  } else {
    return {
      message: 'Unclaimed profile',
    };
  }
};

export const userService = {
  placeOrder,
};
