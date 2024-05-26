import { PrismaClient, TransactionType } from '@prisma/client';
import ApiError from '../../utils/errorHandlers/apiError';
import {
  AggregatedOrder,
  IClaimUser,
  ICreateTeam,
  IListedExpenses,
} from './admin.interface';
import { lunchCost, registrationFee, tiffinBoxCost } from './admin.constant';
import { generateRandomID } from '../../utils/helpers/helpers';
import dayjs from 'dayjs';
import { pagination } from '../../utils/helpers/pagination';
import { IFilterOption } from '../../utils/helpers/interface';
import { adminUserService } from './admin.user.service';
// import ApiError from '../../utils/errorHandlers/apiError';
// import { StatusCodes } from 'http-status-codes';

const prisma = new PrismaClient();

const addAddress = async (address: string) => {
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
    data: { address },
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

const createTeam = async (data: ICreateTeam) => {
  const isUserExist = await prisma.auth.findFirst({
    where: {
      id: data.leader_id,
    },
    include: {
      UserInfo: true,
    },
  });
  if (!isUserExist) {
    throw new ApiError(404, 'Leader dose not exist');
  }
  const isAlreadyLeadingTeam = await prisma.team.findFirst({
    where: {
      leader_id: data.leader_id,
    },
  });
  if (isAlreadyLeadingTeam) {
    throw new ApiError(409, 'The user already leading a team');
  }
  const isAddressExist = await prisma.address.findFirst({
    where: {
      id: data.address_id,
    },
  });
  if (!isAddressExist) {
    throw new ApiError(404, 'Address dose not exist');
  }
  const isTeamExist = await prisma.team.findFirst({
    where: {
      OR: [
        {
          name: {
            equals: data.name,
            mode: 'insensitive',
          },
        },
      ],
    },
  });
  if (isTeamExist) {
    throw new ApiError(409, 'Team with this name already exists');
  }

  const isAccountClaimed = await prisma.userInfo.findFirst({
    where: {
      user_id: data.leader_id,
    },
  });
  if (isAccountClaimed?.id) {
    if (isAccountClaimed.address_id !== data.address_id) {
      throw new ApiError(409, 'User Address and team address must be same');
    }
    const result = await prisma.$transaction(async tx => {
      const createTeam = await tx.team.create({
        data: {
          ...data,
          member: 1,
        },
      });
      const findTeam = await tx.team.findFirst({
        where: {
          id: isAccountClaimed.team_id,
        },
      });
      const updateTeamMember = await tx.team.update({
        where: {
          id: isAccountClaimed.team_id,
        },
        data: {
          member: Number(findTeam?.member) - 1,
        },
      });
      if (!createTeam.id || !updateTeamMember.id) {
        throw new ApiError(500, 'Failed to create team');
      }
      const updateUserInfo = await tx.userInfo.updateMany({
        where: {
          user_id: data.leader_id,
        },
        data: {
          team_id: createTeam.id,
        },
      });
      if (!updateUserInfo.count) {
        throw new ApiError(500, 'Failed to create team');
      }
      return { message: 'Team created successfully' };
    });
    return result;
  } else {
    const result = await prisma.$transaction(async tx => {
      const createTeam = await tx.team.create({
        data: {
          ...data,
          member: 1,
        },
      });
      if (!createTeam.id) {
        throw new ApiError(500, 'Failed to create team');
      }
      const generateId = generateRandomID(5, data.leader_id);
      const updateUserInfo = await tx.userInfo.create({
        data: {
          address_id: data.address_id,
          virtual_id: generateId,
          user_id: data.leader_id,
          team_id: createTeam.id,
          is_in_team: true,
        },
      });
      if (!updateUserInfo) {
        throw new ApiError(500, 'Failed to create team');
      }
      return { message: 'Team created successfully' };
    });
    return result;
  }
};

const claimUser = async (data: IClaimUser) => {
  const isClaimed = await prisma.userInfo.findFirst({
    where: {
      user_id: data.id,
    },
  });

  const getTeam = await prisma.team.findUnique({
    where: {
      id: data.teamId,
    },
  });

  const getAddress = await prisma.address.findUnique({
    where: {
      id: data.addressId,
    },
  });

  if (!getAddress || !getTeam) {
    throw new ApiError(404, 'Team or Address not found');
  }
  if (getAddress.id !== getTeam.address_id) {
    throw new ApiError(409, 'User Address and team address must be same');
  }

  const includeMember = Number(getTeam.member) + 1;

  const calculateBalance = data.balance - (tiffinBoxCost + registrationFee);
  const transaction_type: TransactionType = 'deposit';

  const transactions = [
    {
      transaction_type,
      amount: tiffinBoxCost,
      description: 'Tiffin box cost',
      user_id: data.id,
    },
    {
      transaction_type,
      amount: registrationFee,
      description: 'Registration fee',
      user_id: data.id,
    },
    {
      transaction_type,
      amount: calculateBalance,
      description: 'Balance recharge',
      user_id: data.id,
    },
  ];

  if (isClaimed) {
    if (isClaimed.is_claimed) {
      throw new ApiError(409, 'Account already claimed');
    } else {
      await prisma.$transaction(async tx => {
        const claimUser = await tx.userInfo.update({
          where: {
            id: isClaimed.id,
          },
          data: {
            is_claimed: true,
            Balance: Number(isClaimed.Balance) + data.balance,
          },
        });
        if (claimUser.is_claimed) {
          await tx.transaction.create({
            data: {
              transaction_type,
              amount: data.balance,
              description: 'Balance recharge',
              user_id: data.id,
            },
          });

          await tx.team.update({
            where: {
              id: data.teamId,
            },
            data: {
              member: includeMember,
            },
          });
        }
        return {
          message: 'Account claimed successfully',
        };
      });
    }
  } else {
    await prisma.$transaction(async tx => {
      const virtual_id = generateRandomID(5, data.id);
      const updateUser = await tx.userInfo.create({
        data: {
          virtual_id,
          address_id: data.addressId,
          is_in_team: true,
          is_claimed: true,
          user_id: data.id,
          Balance: calculateBalance,
          team_id: data.teamId,
        },
      });
      if (!updateUser.id) {
        throw new ApiError(500, 'Failed to claimed user');
      } else {
        await tx.transaction.createMany({
          data: transactions,
        });
        await tx.team.update({
          where: {
            id: data.teamId,
          },
          data: {
            member: includeMember,
          },
        });
      }
      return {
        message: 'Account updated successfully',
      };
    });
  }
};

const changeTeam = async (teamId: number, userId: number) => {
  const findUserInfo = await prisma.userInfo.findFirst({
    where: {
      user_id: userId,
    },
    include: {
      team_member: true,
    },
  });

  if (!findUserInfo) {
    throw new ApiError(404, 'User info not found');
  }
  const findTeamInfo = await prisma.team.findUnique({
    where: {
      id: teamId,
    },
  });
  if (!findTeamInfo) {
    throw new ApiError(404, 'Team info not found');
  }
  if (findTeamInfo.address_id !== findUserInfo.address_id) {
    throw new ApiError(409, 'Address must be same for user and team');
  }

  const isLeader = await prisma.team.findFirst({
    where: {
      leader_id: userId,
    },
  });

  if (isLeader) {
    throw new ApiError(
      409,
      'The user is leading a team. To change team user has to give leadership to another team member'
    );
  }
  await prisma.$transaction(async tx => {
    await tx.team.update({
      where: {
        id: findUserInfo.team_id,
      },
      data: {
        member: Number(findUserInfo.team_member.member) - 1,
      },
    });
    await tx.team.update({
      where: {
        id: findTeamInfo.id,
      },
      data: {
        member: Number(findTeamInfo.member) + 1,
      },
    });
    await tx.userInfo.update({
      where: {
        id: findUserInfo.id,
      },
      data: {
        team_id: teamId,
      },
    });
  });

  return { message: 'Successfully change the team' };
};

const rechargeBalance = async (id: number, balance: number) => {
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
      },
    });
    return { message: 'Recharge successful' };
  });

  return result;
};

const refundBalance = async (
  id: number,
  balance: number,
  description: string
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

const changeLeader = async (leaderId: number, team_id: number) => {
  const result = await prisma.userInfo.findFirst({
    where: {
      user_id: leaderId,
    },
  });
  if (!result?.id) {
    throw new ApiError(404, 'User not found');
  }
  if (team_id !== result.team_id) {
    throw new ApiError(400, 'User is not in the same team .');
  }
  await prisma.team.update({
    where: {
      id: team_id,
    },
    data: {
      leader_id: leaderId,
    },
  });
  return { message: `Successfully changed the leader` };
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

  const orders = await prisma.order.findMany({
    where: {
      ...queryOption,
      status,
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

const getTeams = async (pageNumber: number, filterOptions: IFilterOption) => {
  const meta = pagination({ page: pageNumber, limit: 10 });
  const { skip, take, orderBy, page } = meta;
  const queryOption: { [key: string]: any } = {};
  if (Object.keys(filterOptions).length) {
    const { search, ...restOptions } = filterOptions;

    if (search) {
      queryOption['OR'] = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          address: {
            address: {
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
  const result = await prisma.team.findMany({
    skip,
    take,
    orderBy,
    where: {
      ...queryOption,
      is_deleted: false,
    },
    select: {
      address_id: true,
      name: true,
      due_boxes: true,
      id: true,
      member: true,

      address: {
        select: {
          address: true,
          id: true,
        },
      },
      leader: {
        select: {
          name: true,
          phone: true,
        },
      },
    },
  });
  const totalCount = await prisma.team.count({
    where: {
      ...queryOption,
    },
  });
  const totalPage = totalCount > take ? totalCount / Number(take) : 1;
  return {
    result,
    meta: { page: page, size: take, total: totalCount, totalPage },
  };
};

const deliverOrder = async (id: number) => {
  const todayDate = dayjs(new Date()).startOf('hour');
  const formatTodayDate = todayDate.format('YYYY-MM-DD');
  const result = await prisma.order.updateMany({
    where: {
      team_id: id,
      status: 'pending',
      delivery_date: {
        equals: `${formatTodayDate}T00:00:00.000Z`,
      },
    },
    data: {
      status: 'received',
    },
  });
  return result;
};

const getUserInfo = async (number: string) => {
  const getUserInfo = await prisma.auth.findFirst({
    where: {
      phone: number,
      is_deleted: false,
    },
    select: {
      id: true,
      phone: true,
      name: true,
      UserInfo: {
        select: {
          address_id: true,
        },
      },
    },
  });
  if (!getUserInfo) {
    throw new ApiError(404, 'User not found');
  }
  if (!getUserInfo?.UserInfo.length) {
    const addresses = await prisma.address.findMany({
      select: {
        address: true,
        id: true,
      },
    });
    return {
      phone: getUserInfo?.phone,
      id: getUserInfo.id,
      name: getUserInfo?.name,
      addresses,
      isSavedAddress: false,
    };
  } else {
    const addresses = await prisma.address.findFirst({
      where: {
        id: getUserInfo.UserInfo[0].address_id,
      },
      select: {
        address: true,
        id: true,
      },
    });
    return {
      phone: getUserInfo?.phone,
      name: getUserInfo?.name,
      id: getUserInfo.id,
      addresses: [addresses],
      isSavedAddress: true,
    };
  }
};

const getTeamInfoById = async (id: number) => {
  const userInfo = await prisma.userInfo.findMany({
    where: {
      team_id: id,
      is_claimed: true,
      user: {
        is_deleted: false,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  const result = await prisma.team.findUnique({
    where: {
      id,
      is_deleted: false,
    },
    include: {
      address: true,
      leader: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });
  return { ...result, userInfo };
};

const updateDueBoxes = async (id: number, amount: number) => {
  const result = await prisma.team.update({
    where: {
      id,
      is_deleted: false,
    },
    data: {
      due_boxes: amount,
    },
  });
  return result;
};

const deleteUser = async (id: number) => {
  const getUser = await prisma.auth.findFirst({
    where: {
      id,
      is_deleted: false,
    },
  });
  if (!getUser) {
    throw new ApiError(404, 'User not found');
  } else {
    const result = await prisma.auth.update({
      where: {
        id,
      },
      data: {
        is_deleted: true,
        phone: getUser.phone + new Date(),
      },
    });
    return result;
  }
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

export const adminService = {
  ...adminUserService,
  deliverOrder,
  addAddress,
  updateAddress,
  createTeam,
  changeTeam,
  rechargeBalance,
  claimUser,
  refundBalance,
  listExpenses,
  changeLeader,
  getOrders,
  getTeams,
  getUserInfo,
  getTeamInfoById,
  updateDueBoxes,
  deleteUser,
  getTotalStatics,
  getExpenses,
};
