import { PrismaClient, TransactionType } from '@prisma/client';
import { IFilterOption } from '../../utils/helpers/interface';
import { formatLocalTime } from '../../utils/helpers/timeZone';
import { adminUserService } from '../admin/services/admin.user.service';
import { pagination } from '../../utils/helpers/pagination';
import ApiError from '../../utils/errorHandlers/apiError';
import { getSupplierId } from './supplier.utils';

const prisma = new PrismaClient();

const getOrders = async (id: number, filterOptions: IFilterOption) => {
  const supplier_id: number = await getSupplierId(id);
  const queryOption: { [key: string]: any } = {};
  if (Object.keys(filterOptions).length) {
    const { search, ...restOptions } = filterOptions;

    if (search) {
      queryOption['OR'] = [
        {
          team: {
            name: {
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
      ];
    }

    Object.entries(restOptions).forEach(([field, value]) => {
      queryOption[field] = value;
    });
  }
  const getDate = formatLocalTime(Date.now());
  const getOrders = await prisma.order.findMany({
    where: {
      supplier_id,
      delivery_date: getDate.formatDefaultDateAndTime,
      status: 'pending',
    },
    select: {
      id: true,
      pickup_status: true,
      user: {
        select: {
          name: true,
          phone: true,
        },
      },
      status: true,
      delivery_date: true,
      team: {
        select: {
          id: true,
          name: true,
          leader: {
            select: {
              name: true,
              phone: true,
            },
          },
          leader_id: true,
          member: true,
          address: {
            select: {
              id: true,
              address: true,
            },
          },
        },
      },
    },
  });

  // Process the fetched orders to the desired format
  const teamOrdersMap: any = {};

  getOrders.forEach(order => {
    const teamId = order.team.id;
    if (!teamOrdersMap[teamId]) {
      teamOrdersMap[teamId] = {
        teamName: order.team.name,
        address: order?.team?.address?.address,
        leader: {
          name: order.team.leader.name,
          phone: order.team.leader.phone,
        },
        teamId: teamId,
        totalOrder: 0,
        orders: [],
      };
    }

    teamOrdersMap[teamId].totalOrder += 1;
    teamOrdersMap[teamId].orders.push({
      id: order.id,
      userId: order.team.leader_id,
      user: {
        name: order.user.name,
        phone: order.user.phone,
      },
    });
  });

  // Convert the map to an array
  const formattedData = Object.values(teamOrdersMap);

  return formattedData;
};

const getTeams = async (id: number, filterOptions: IFilterOption) => {
  const supplier_id = await getSupplierId(id);
  const queryOption: { [key: string]: any } = {};
  const getDate = formatLocalTime(Date.now());
  if (Object.keys(filterOptions).length) {
    const { search, ...restOptions } = filterOptions;

    if (search) {
      queryOption['OR'] = [
        {
          team: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          address: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    Object.entries(restOptions).forEach(([field, value]) => {
      queryOption[field] = value;
    });
  }

  const result = await prisma.address.findMany({
    where: {
      supplier_id,
      ...queryOption,
    },
    select: {
      address: true,
      id: true,
      Team: {
        select: {
          due_boxes: true,
          id: true,
          member: true,
          name: true,
          leader: {
            select: {
              name: true,
              phone: true,
              id: true,
            },
          },
          order: {
            where: {
              delivery_date: getDate.formatDefaultDateAndTime,
              status: 'pending',
            },
          },
        },
      },
    },
  });

  // Process the fetched data to the desired format
  const formattedData = result.flatMap(address =>
    address.Team.map(team => ({
      teamName: team.name,
      address: address.address,
      leaderName: team.leader.name,
      leaderPhone: team.leader.phone,
      id: team.id,
      totalOrder: team.order.length,
      member: team.member,
      dueBoxes: team.due_boxes,
    }))
  );
  return formattedData;
};

const getDeliverySpot = async (id: number) => {
  const getDate = formatLocalTime(Date.now());
  const supplier_id = await getSupplierId(id);
  const result = await prisma.address.findMany({
    where: {
      supplier_id,
    },
    select: {
      address: true,
      id: true,
      Team: {
        select: {
          name: true,
          id: true,
          leader: {
            select: {
              name: true,
              phone: true,
            },
          },
          order: {
            where: {
              delivery_date: getDate.formatDefaultDateAndTime,
              status: {
                not: 'canceled',
              },
            },
          },
        },
      },
    },
  });
  // Process the fetched data to the desired format
  const formattedData = result.map(address => ({
    address: address.address,
    id: address.id,
    team: address.Team.map(team => {
      const pendingOrder = team.order.filter(
        order => order.status === 'pending'
      ).length;
      const readyToPickup = team.order.filter(
        order => order.pickup_status === 'enable'
      ).length;

      return {
        name: team.name,
        id: team.id,
        leaderName: team.leader.name,
        leaderPhone: team.leader.phone,
        pendingOrder: pendingOrder,
        readyToPickup: readyToPickup,
      };
    }),
  }));
  return formattedData;
};

// Combine all teams into a single array
// const combinedTeams = result.flatMap((address) =>
//   address.Team.map((team) => {
//     const pendingOrder = team.order.filter(order => order.status === 'pending').length;
//     const readyToPickup = team.order.filter(order => order.pickup_status === 'enable').length;

//     return {
//       name: team.name,
//       id: team.id,
//       leaderName: team.leader.name,
//       leaderPhone: team.leader.phone,
//       pendingOrder: pendingOrder,
//       readyToPickup: readyToPickup,
//       address: address.address, // Include address inside each team
//     };
//   })
// );
// return combinedTeams

const getUsers = async (pageNumber: number, filterOptions: IFilterOption) => {
  const result = await adminUserService.getUsers(
    'claimed',
    pageNumber,
    filterOptions
  );
  return result;
};

const getTransactions = async (
  id: number,
  pageNumber: number,
  filterOptions: IFilterOption
) => {
  const meta = pagination({ page: pageNumber, limit: 10 });
  const { skip, take, orderBy, page } = meta;
  const queryOption: { [key: string]: any } = {};
  if (Object.keys(filterOptions).length) {
    Object.entries(queryOption).forEach(([field, value]) => {
      queryOption[field] = value;
    });
  }

  const result = await prisma.transaction.findMany({
    skip,
    take,
    orderBy,
    where: {
      receiver_id: id,
      ...queryOption,
    },
    select: {
      date: true,
      status: true,
      amount: true,
    },
  });
  const totalCount = await prisma.transaction.count({
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

const deliverOrder = async (id: number, supplier_id: number) => {
  const todayDate = formatLocalTime(new Date());
  const isValidOrder = await prisma.order.findFirst({
    where: {
      team_id: id,
      supplier_id,
      status: 'pending',
      delivery_date: {
        equals: todayDate.formatDefaultDateAndTime,
      },
    },
  });
  if (!isValidOrder) {
    throw new ApiError(400, 'Invalid order');
  }
  const result = await prisma.order.updateMany({
    where: {
      team_id: id,
      status: 'pending',
      supplier_id,
      delivery_date: {
        equals: todayDate.formatDefaultDateAndTime,
      },
    },
    data: {
      status: 'received',
      pickup_status: 'enable',
    },
  });
  return result;
};
const pickBoxes = async (id: number, supplier_id: number) => {
  const isValidOrder = await prisma.order.findFirst({
    where: {
      team_id: id,
      supplier_id,
      pickup_status: 'enable',
    },
  });
  if (!isValidOrder) {
    throw new ApiError(400, 'Invalid order');
  }
  const result = await prisma.order.updateMany({
    where: {
      team_id: id,
      pickup_status: 'enable',
      supplier_id,
    },
    data: {
      pickup_status: 'received',
    },
  });
  return result;
};

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
        status: 'pending',
        receiver_id: receiverId,
      },
    });
    return { message: 'Recharge successful' };
  });

  return result;
};

export const supplierService = {
  getOrders,
  getTeams,
  getDeliverySpot,
  getTransactions,

  //get teams by address and supplier id

  getUsers,
  rechargeBalance,
  deliverOrder,
  pickBoxes,
};
