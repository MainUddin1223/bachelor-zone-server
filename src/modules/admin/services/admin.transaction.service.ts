import { PrismaClient, TransactionType } from '@prisma/client';
import ApiError from '../../../utils/errorHandlers/apiError';
import { IListedExpenses } from '../admin.interface';
import { pagination } from '../../../utils/helpers/pagination';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

const rechargeBalance = async (
  id: number,
  balance: number,
  receiverId: number
) => {
  const transaction_type: TransactionType = 'deposit';

  const result = await prisma.$transaction(async tx => {
    const getUser = await prisma.userInfo.findFirst({
      where: {
        user_id: id,
      },
    });
    if (!getUser) {
      throw new ApiError(404, 'User info not found');
    }
    const recharge = await tx.userInfo.update({
      where: {
        id: getUser.id,
      },
      data: {
        Balance: balance + Number(getUser.Balance),
      },
    });
    if (!recharge.Balance) {
      throw new ApiError(500, 'Recharge failed');
    }
    await tx.transaction.create({
      data: {
        transaction_type,
        description: 'Balance recharge',
        amount: balance,
        user_id: id,
        receiver_id: receiverId,
      },
    });
    return { message: 'Recharge successful' };
  });

  return result;
};

const refundBalance = async (
  id: number,
  balance: number,
  description: string,
  receiverId: number
) => {
  const transaction_type: TransactionType = 'refund';

  const result = await prisma.$transaction(async tx => {
    const getUser = await prisma.userInfo.findFirst({
      where: {
        user_id: id,
      },
    });
    if (!getUser) {
      throw new ApiError(404, 'User info not found');
    }

    const currentBalance = Number(getUser.Balance);

    if (balance > currentBalance) {
      throw new ApiError(409, 'Refund balance is getter than current balance');
    }

    const refund = await tx.userInfo.update({
      where: {
        id: getUser.id,
      },
      data: {
        Balance: currentBalance - balance,
      },
    });
    if (!refund.Balance) {
      throw new ApiError(500, 'Recharge failed');
    }
    await tx.transaction.create({
      data: {
        transaction_type,
        description,
        amount: balance,
        user_id: id,
        receiver_id: receiverId,
      },
    });
    return { message: 'Refund successful' };
  });

  return result;
};

const listExpenses = async (data: IListedExpenses) => {
  const result = await prisma.expenses.create({
    data,
  });
  if (!result.id) {
    throw new ApiError(500, 'Failed to list the expenses');
  }
  return { message: 'Expenses listed successfully' };
};

const getExpenses = async (pageNumber: number, date: any) => {
  const meta = pagination({ page: pageNumber, limit: 15 });
  const { skip, take, orderBy, page } = meta;
  const startOfMonth = dayjs(date).startOf('month').toISOString();
  const endOfMonth = dayjs().endOf('month').toISOString();

  const totalExpensesOfTheMonth = await prisma.expenses.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });
  const totalEarningOfTheMonth = await prisma.transaction.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      transaction_type: 'deposit',
      description: {
        notIn: ['Service fee', 'Tiffin box cost'],
      },
    },
  });
  const expenses = await prisma.expenses.findMany({
    skip,
    orderBy,
    select: {
      amount: true,
      date: true,
      product_name: true,
      quantity: true,
    },
  });
  const totalCount = await prisma.expenses.count({});
  const totalPage = totalCount > take ? totalCount / Number(take) : 1;
  return {
    result: {
      expenses,
      totalExpensesOfTheMonth: totalExpensesOfTheMonth?._sum?.amount || 0,
      totalEarningOfTheMonth: totalEarningOfTheMonth?._sum?.amount || 0,
    },
    meta: { page: page, size: take, total: totalCount, totalPage },
  };
};
export const adminTransactionService = {
  rechargeBalance,
  refundBalance,
  listExpenses,
  getExpenses,
};
