import { PrismaClient } from '@prisma/client';
import ApiError from '../../../utils/errorHandlers/apiError';
import { AggregatedOrder } from '../admin.interface';
import { lunchCost } from '../admin.constant';
import dayjs from 'dayjs';
import { IFilterOption } from '../../../utils/helpers/interface';
import { adminUserService } from './admin.user.service';
import { adminTeamService } from './admin.team.service';
import { adminTransactionService } from './admin.transaction.service';
import { adminSupplierService } from './admin.supplier.service';
// import ApiError from '../../utils/errorHandlers/apiError';
// import { StatusCodes } from 'http-status-codes';

const prisma = new PrismaClient();

const addAddress = async (address: string, supplierId: number) => {
  const isAddressExist = await prisma.address.findFirst({
    where: {
      address: {
        equals: address,
        mode: 'insensitive',
      },
    },
  });
  if (isAddressExist) {
    throw new ApiError(403, 'Address already exist');
  }
  const result = await prisma.address.create({
    data: { address, supplier_id: supplierId },
  });
  return result;
};

const updateAddress = async (id: number, address: string) => {
  const result = await prisma.address.update({
    where: {
      id,
    },
    data: { address },
  });
  return result;
};

const getOrders = async (
  date: any,
  filterOptions: IFilterOption,
  status: any
) => {
  const todayStartOfDay = dayjs(date).startOf('hour');

  const startDate = todayStartOfDay.format('YYYY-MM-DD[T]00:00:00.000Z');
  const endDate = todayStartOfDay.format('YYYY-MM-DD[T]23:59:59.000Z');

  const queryOption: { [key: string]: any } = {};
  if (Object.keys(filterOptions).length) {
    const { search, ...restOptions } = filterOptions;

    if (search) {
      queryOption['OR'] = [
        {
          user: {
            phone: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          team: {
            address: {
              address: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          team: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    Object.entries(restOptions).forEach(([field, value]) => {
      queryOption[field] = value;
    });
  }
  if (status) {
    queryOption['status'] = status;
  }

  const orders = await prisma.order.findMany({
    where: {
      ...queryOption,
      AND: [
        {
          delivery_date: {
            gte: startDate,
          },
        },
        {
          delivery_date: {
            lte: endDate,
          },
        },
      ],
    },
    include: {
      team: {
        select: {
          address: true,
          address_id: true,
          due_boxes: true,
          leader: {
            select: {
              name: true,
              phone: true,
            },
          },
          leader_id: true,
          name: true,
        },
      },
      user: {
        select: {
          name: true,
          id: true,
          phone: true,
        },
      },
    },
  });

  // Create an object to store aggregated data
  const aggregatedData: Record<number, AggregatedOrder> = {};

  // Iterate through each item in the data
  orders.forEach(item => {
    const {
      team_id,
      status,
      delivery_date,
      team: {
        name: team_name,
        leader: { name: leaderName, phone: leaderPhoneNumber },
        address,
        due_boxes,
      },
    } = item;

    // Check if the team_id exists in the aggregatedData
    if (!aggregatedData[team_id]) {
      // If not, initialize an object for the team_id
      aggregatedData[team_id] = {
        team_id,
        team_name,
        delivery_date,
        leaderName,
        leaderPhoneNumber,
        status,
        due_boxes,
        address: address?.address,
        order_count: 1,
        orderList: [
          {
            status: item.status,
            delivery_date: item.delivery_date,
            user_name: item.user.name,
            user_id: item.user.id,
            user_phone: item.user.phone,
          },
        ], // Initialize order count to 1
      };
    } else {
      // If it exists, increment the order count
      aggregatedData[team_id].order_count++;
      aggregatedData[team_id].orderList.push({
        status: item.status,
        delivery_date: item.delivery_date,
        user_name: item.user.name,
        user_id: item.user.id,
        user_phone: item.user.phone,
      });
    }
  });

  // Convert the aggregatedData object into an array
  const result = Object.values(aggregatedData);

  return { result, orders };
};

const getTotalStatics = async () => {
  const date = new Date();
  const todayStartOfDay = dayjs(date).startOf('hour');

  const startDate = todayStartOfDay.format('YYYY-MM-DD[T]00:00:00.000Z');
  const endDate = todayStartOfDay.format('YYYY-MM-DD[T]23:59:59.000Z');
  const startOfMonth = dayjs().startOf('month').toISOString();
  const endOfMonth = dayjs().endOf('month').toISOString();

  const totalEarning = await prisma.order.count({
    where: {
      status: 'received',
    },
  });
  const totalExpenses = await prisma.expenses.aggregate({
    _sum: {
      amount: true,
    },
  });
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
  const totalEarningOfTheMonth = await prisma.order.count({
    where: {
      status: 'received',
      delivery_date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  //Todays total order , delivered,canceled,pending
  const getOrders = await prisma.order.findMany({
    where: {
      AND: [
        {
          delivery_date: {
            gte: startDate,
          },
        },
        {
          delivery_date: {
            lte: endDate,
          },
        },
      ],
    },
  });

  // Total Delivered orders
  const totalCompletedOrderSoFar = await prisma.order.count({
    where: {
      status: {
        equals: 'received',
      },
    },
  });

  const initialOrderData = {
    totalOrder: getOrders.length,
    deliveredOrder: 0,
    remainingOrder: 0,
    canceledOrder: 0,
  };

  const orderData = getOrders.reduce((acc, order) => {
    if (order.status === 'pending') {
      acc.remainingOrder += 1;
    } else if (order.status === 'received') {
      acc.deliveredOrder += 1;
    } else {
      acc.canceledOrder += 1;
    }
    return acc;
  }, initialOrderData);

  //cost of the day
  const costOfTheDay = await prisma.expenses.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      AND: [
        {
          createdAt: {
            gte: startDate,
          },
        },
        {
          createdAt: {
            lte: endDate,
          },
        },
      ],
    },
  });
  // today's total deposit
  const depositOfTheDay = await prisma.transaction.aggregate({
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
    where: {
      AND: [
        {
          date: {
            gte: startDate,
          },
        },
        {
          date: {
            lte: endDate,
          },
        },
      ],
    },
  });

  //total users
  const totalUsers = await prisma.userInfo.count({
    where: {
      is_claimed: true,
    },
  });
  // due boxes and total team
  const teamData = await prisma.team.aggregate({
    _sum: {
      due_boxes: true,
    },
    _count: {
      id: true,
    },
  });
  //total remaining balance
  const totalRemainingBalance = await prisma.userInfo.aggregate({
    _sum: {
      Balance: true,
    },
  });
  //total transaction
  const totalTransaction = await prisma.transaction.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      transaction_type: 'deposit',
    },
  });
  //tiffin and service fee
  const serviceAndBoxFee = await prisma.transaction.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      description: {
        in: ['Service fee', 'Tiffin box cost'], // Filter by types 'deposit' and 'due'
      },
    },
  });
  const boxAndServiceFee = serviceAndBoxFee?._sum?.amount || 0;
  return {
    result: {
      ...orderData,
      totalCompletedOrderSoFar,
      costOfTheDay: costOfTheDay?._sum?.amount || 0,
      depositOfTheDay: depositOfTheDay?._sum?.amount || 0,
      totalUsers,
      totalTeam: teamData?._count?.id,
      totalDueBoxes: teamData?._sum?.due_boxes || 0,
      totalRemainingBalance: totalRemainingBalance?._sum?.Balance || 0,
      totalTransaction: totalTransaction?._sum?.amount || 0,
      serviceAndBoxFee: boxAndServiceFee,
      totalExpensesOfTheMonth: totalExpensesOfTheMonth?._sum?.amount || 0,
      totalEarningOfTheMonth: totalEarningOfTheMonth * lunchCost || 0,
      totalExpenses: totalExpenses?._sum?.amount || 0,
      totalEarning: totalEarning * lunchCost + boxAndServiceFee,
    },
  };
};

export const adminService = {
  ...adminUserService,
  ...adminTeamService,
  ...adminTransactionService,
  ...adminSupplierService,
  addAddress,
  updateAddress,
  getOrders,
  getTotalStatics,
};
