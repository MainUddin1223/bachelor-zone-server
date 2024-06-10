import { PrismaClient } from '@prisma/client';
import { formatLocalTime } from '../../utils/helpers/timeZone';
import ApiError from '../../utils/errorHandlers/apiError';

const prisma = new PrismaClient();

export const getSupplierStatics = async (id: number) => {
  const getDate = formatLocalTime(Date.now());
  const supplierInfo = await prisma.supplierInfo.findFirst({
    where: {
      user_id: id,
    },
    select: {
      contact_no: true,
      name: true,
      address: {
        select: {
          address: true,
          id: true,
          Team: {
            select: {
              name: true,
            },
          },
          UserInfo: true,
        },
      },
      Order: {
        where: {
          delivery_date: getDate.formatDefaultDateAndTime,
        },
      },
    },
  });

  // Calculate the sum of pending transactions
  const transactionSum = await prisma.transaction.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      receiver_id: id,
      status: 'pending',
    },
  });
  // Calculate the sum of pending transactions
  const todayTransactionSum = await prisma.transaction.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      receiver_id: id,
      status: 'pending',
      date: {
        gte: getDate.formatDefaultDateAndTime,
      },
    },
  });

  // Initialize the result object with the required structure
  const result = {
    name: supplierInfo?.name,
    phone: supplierInfo?.contact_no,
    totalTeam: 0,
    totalAddress: 0,
    totalOrder: 0,
    pendingOrder: 0,
    received: 0,
    readyToPickUp: 0,
    totalUser: 0,
    totalPickedOrder: 0,
    transactionSum: transactionSum._sum.amount || 0,
    todayTransactionSum: todayTransactionSum._sum.amount || 0,
  };
  // Aggregate the data
  if (supplierInfo) {
    const addresses = supplierInfo.address;
    const orders = supplierInfo.Order;

    // Count total teams, users, and calculate due balance
    addresses.forEach(address => {
      result.totalAddress += 1;
      result.totalTeam += address.Team.length;
      result.totalUser = address.UserInfo.length;
    });

    // Count total orders and specific statuses
    orders.forEach(order => {
      result.totalOrder += 1;
      if (order.status === 'pending') {
        result.pendingOrder += 1;
      }
      if (order.status === 'received') {
        result.received += 1;
      }
      if (order.pickup_status === 'enable') {
        result.readyToPickUp += 1;
      }
      if (order.pickup_status === 'received') {
        result.totalPickedOrder += 1;
      }
    });
  }

  return result;
};

export const getSupplierId = async (id: number): Promise<number> => {
  const result = await prisma.supplierInfo.findFirst({
    where: {
      user_id: id,
    },
  });
  if (!result) {
    throw new ApiError(404, 'Supplier not found');
  }
  return Number(result.id);
};
