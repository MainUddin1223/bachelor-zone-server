import { PrismaClient } from '@prisma/client';
import { formatLocalTime } from '../../utils/helpers/timeZone';

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

  // Initialize the result object with the required structure
  const result = {
    totalTeam: 0,
    totalAddress: 0,
    totalOrder: 0,
    pendingOrder: 0,
    received: 0,
    readyToPickUp: 0,
    totalUser: 0,
    dueBalance: 0,
    transactionSum: transactionSum._sum.amount || 0,
  };
  // Aggregate the data
  if (supplierInfo) {
    const addresses = supplierInfo.address;
    const orders = supplierInfo.Order;

    // Count total teams, users, and calculate due balance
    addresses.forEach(address => {
      result.totalAddress += 1;
      result.totalTeam += address.Team.length;
      address.UserInfo.forEach(user => {
        result.totalUser += 1;
        result.dueBalance += user.Balance;
      });
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
    });
  }

  return result;
};
