import { PrismaClient, TransactionType } from '@prisma/client';
import { IFilterOption } from '../../utils/helpers/interface';
import { formatLocalTime } from '../../utils/helpers/timeZone';
import { adminUserService } from '../admin/services/admin.user.service';
import { pagination } from '../../utils/helpers/pagination';
import ApiError from '../../utils/errorHandlers/apiError';
import { getSupplierId } from './supplier.utils';
import { AggregatedData } from './supplier.interface';

const prisma = new PrismaClient();

// const getOrders = async (id: number, filterOptions: IFilterOption) => {
//   const supplier_id: number = await getSupplierId(id);
//   const queryOption: { [key: string]: any } = {};
//   if (Object.keys(filterOptions).length) {
//     const { search, ...restOptions } = filterOptions;

//     if (search) {
//       queryOption['OR'] = [
//         {
//           team: {
//             name: {
//               contains: search,
//               mode: 'insensitive',
//             },
//           },
//         },
//         {
//           team: {
//             address: {
//               address: {
//                 contains: search,
//                 mode: 'insensitive',
//               },
//             },
//           },
//         },
//       ];
//     }

//     Object.entries(restOptions).forEach(([field, value]) => {
//       queryOption[field] = value;
//     });
//   }
//   const getDate = formatLocalTime(Date.now());
//   const getOrders = await prisma.order.findMany({
//     where: {
//       supplier_id,
//       delivery_date: getDate.formatDefaultDateAndTime,
//       status: 'pending',
//     },
//     select: {
//       id: true,
//       pickup_status: true,
//       user: {
//         select: {
//           name: true,
//           phone: true,
//         },
//       },
//       status: true,
//       delivery_date: true,
//       team: {
//         select: {
//           id: true,
//           name: true,
//           leader: {
//             select: {
//               name: true,
//               phone: true,
//             },
//           },
//           leader_id: true,
//           member: true,
//           address: {
//             select: {
//               id: true,
//               address: true,
//             },
//           },
//         },
//       },
//     },
//   });

//   // Process the fetched orders to the desired format
//   const teamOrdersMap: any = {};

//   getOrders.forEach(order => {
//     const teamId = order.team.id;
//     if (!teamOrdersMap[teamId]) {
//       teamOrdersMap[teamId] = {
//         teamName: order.team.name,
//         address: order?.team?.address?.address,
//         leader: {
//           name: order.team.leader.name,
//           phone: order.team.leader.phone,
//         },
//         teamId: teamId,
//         totalOrder: 0,
//         orders: [],
//       };
//     }

//     teamOrdersMap[teamId].totalOrder += 1;
//     teamOrdersMap[teamId].orders.push({
//       id: order.id,
//       userId: order.team.leader_id,
//       user: {
//         name: order.user.name,
//         phone: order.user.phone,
//       },
//     });
//   });

//   // Convert the map to an array
//   const formattedData = Object.values(teamOrdersMap);

//   return formattedData;
// };

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

const getDeliverySpot = async (id: number, status: string) => {
  const getDate = formatLocalTime(Date.now());
  const supplier_id = await getSupplierId(id);
  let statusQuery = {};
  if (status == 'pickup') {
    statusQuery = { pickup_status: 'enable' };
  } else {
    statusQuery = { status: 'pending' };
  }

  const result = await prisma.supplierInfo.findUnique({
    where: {
      id: supplier_id,
    },
    select: {
      Order: {
        where: {
          delivery_date: getDate.formatDefaultDateAndTime,
          ...statusQuery,
        },
        select: {
          delivery_date: true,
          id: true,
          team_id: true,
          status: true,
          pickup_status: true,
          team: {
            select: {
              name: true,
              id: true,
              leader: {
                select: {
                  name: true,
                  phone: true,
                },
              },
              address: {
                select: {
                  address: true,
                  id: true,
                },
              },
            },
          },
        },
      },
    },
  });
  const aggregatedData: { [key: number]: AggregatedData } = {};
  if (!result) {
    throw new ApiError(404, 'Supplier not Found');
  }
  result.Order.forEach(order => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const addressId = order.team.address!.id;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const address = order.team.address!.address;
    const teamId = order.team.id;

    if (!aggregatedData[addressId]) {
      aggregatedData[addressId] = {
        address: address,
        id: addressId,
        team: [],
      };
    }

    let team = aggregatedData[addressId].team.find(t => t.id === teamId);
    if (!team) {
      team = {
        name: order.team.name,
        id: teamId,
        leaderName: order.team.leader.name,
        leaderPhone: order.team.leader.phone,
        pendingOrder: 0,
        readyToPickup: 0,
      };
      aggregatedData[addressId].team.push(team);
    }

    if (order.status === 'pending') {
      team.pendingOrder++;
    }
    if (order.pickup_status === 'enable') {
      team.readyToPickup++;
    }
  });

  return Object.values(aggregatedData);
};

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
  const meta = pagination({ page: pageNumber, limit: 15 });
  const { skip, take, orderBy, page } = meta;
  const queryOption: { [key: string]: any } = {};
  const { search, ...restOptions } = filterOptions;
  if (Object.keys(filterOptions).length) {
    if (search) {
      queryOption['OR'] = [
        {
          user: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            phone: {
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
      receiver_id: true,
      amount: true,
      user: {
        select: {
          name: true,
          phone: true,
        },
      },
    },
  });
  const totalCount = await prisma.transaction.count({
    where: {
      receiver_id: id,
      ...queryOption,
    },
  });
  const totalPage = totalCount > take ? totalCount / Number(take) : 1;
  return {
    result,
    meta: { page: page, size: take, total: totalCount, totalPage },
  };
};

const deliverOrder = async (team_id: number, id: number) => {
  const todayDate = formatLocalTime(new Date());
  const supplier_id = await getSupplierId(id);
  const isValidOrder = await prisma.order.findFirst({
    where: {
      team_id,
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
      team_id,
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

const pickBoxes = async (team_id: number, id: number) => {
  const supplier_id = await getSupplierId(id);
  const isValidOrder = await prisma.order.findFirst({
    where: {
      team_id,
      supplier_id,
      pickup_status: 'enable',
    },
  });
  if (!isValidOrder) {
    throw new ApiError(400, 'Invalid order');
  }
  const result = await prisma.order.updateMany({
    where: {
      team_id,
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
  receiverId: number,
  balance: number
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
  getTeams,
  getDeliverySpot,
  getTransactions,
  getUsers,
  rechargeBalance,
  deliverOrder,
  pickBoxes,
};
