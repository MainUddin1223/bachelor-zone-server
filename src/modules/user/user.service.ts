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
import { TeamOrderData } from '../admin/admin.interface';

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
  const supplier_id = userInfo?.address.supplier_id;
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
        supplier_id,
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

// const getUpcomingOrder = async (id: number) => {
//   const todayDate = formatLocalTime(new Date());
//   const upcomingOrders = await prisma.order.findMany({
//     where: {
//       user_id: id,
//       delivery_date: {
//         gte: `${todayDate.formatDefaultDateAndTime}`,
//       },
//     },
//     orderBy: {
//       delivery_date: 'asc',
//     },
//   });
//   return upcomingOrders;
// };

//Optimized Code

const getUpcomingOrder = async (id: number) => {
  const todayDate = formatLocalTime(new Date()).formatDefaultDateAndTime;

  const upcomingOrders = await prisma.order.findMany({
    where: {
      user_id: id,
      delivery_date: {
        gte: todayDate,
      },
    },
    orderBy: {
      delivery_date: 'asc',
    },
  });

  return upcomingOrders;
};

// const getOrderHistory = async (id: number, pageNumber: number) => {
//   const meta = pagination({ page: pageNumber });
//   const { skip, take, page } = meta;
//   const todayDate = formatLocalTime(new Date());
//   const orderHistory = await prisma.order.findMany({
//     skip,
//     take,
//     where: {
//       user_id: id,
//       delivery_date: {
//         lt: todayDate.formatDefaultDateAndTime,
//       },
//     },
//     orderBy: {
//       delivery_date: 'desc',
//     },
//   });
//   const totalOrderHistory = await prisma.order.findMany({
//     where: {
//       user_id: id,
//       delivery_date: {
//         lt: todayDate.formatDefaultDateAndTime,
//       },
//     },
//   });
//   const initialOrderData = {
//     totalCount: totalOrderHistory.length,
//     deliveredOrder: 0,
//     notReceived: 0,
//     canceledOrder: 0,
//   };

//   const orderData = totalOrderHistory.reduce((acc, order) => {
//     if (order.status === 'pending') {
//       acc.notReceived += 1;
//     } else if (order.status === 'received') {
//       acc.deliveredOrder += 1;
//     } else {
//       acc.canceledOrder += 1;
//     }
//     return acc;
//   }, initialOrderData);

//   const totalPage =
//     initialOrderData.totalCount > take
//       ? Math.ceil(initialOrderData.totalCount / Number(take))
//       : 1;
//   return {
//     data: { orderHistory, orderData },
//     meta: {
//       size: take,
//       total: initialOrderData.totalCount,
//       totalPage,
//       currentPage: page,
//     },
//   };
// };

// Optimized code

const getOrderHistory = async (id: number, pageNumber: number) => {
  const meta = pagination({ page: pageNumber });
  const { skip, take, page } = meta;
  const todayDate = formatLocalTime(new Date()).formatDefaultDateAndTime;

  // Fetch order history and total count concurrently
  const [orderHistory, totalCount] = await Promise.all([
    prisma.order.findMany({
      skip,
      take,
      where: {
        user_id: id,
        delivery_date: {
          lt: todayDate,
        },
      },
      orderBy: {
        delivery_date: 'desc',
      },
    }),
    prisma.order.count({
      where: {
        user_id: id,
        delivery_date: {
          lt: todayDate,
        },
      },
    }),
  ]);

  // Calculate order statistics
  const initialOrderData = {
    totalCount,
    deliveredOrder: 0,
    notReceived: 0,
    canceledOrder: 0,
  };

  const orderData = orderHistory.reduce((acc, order) => {
    if (order.status === 'pending') {
      acc.notReceived += 1;
    } else if (order.status === 'received') {
      acc.deliveredOrder += 1;
    } else {
      acc.canceledOrder += 1;
    }
    return acc;
  }, initialOrderData);

  const totalPage = Math.ceil(totalCount / take);

  return {
    data: { orderHistory, orderData },
    meta: {
      size: take,
      total: totalCount,
      totalPage,
      currentPage: page,
    },
  };
};

// const userInfo = async (id: number) => {
//   const todayDate = formatLocalTime(new Date());
//   const result = await prisma.userInfo.findFirst({
//     where: {
//       user_id: id,
//     },
//     select: {
//       address: true,
//       team_member: {
//         select: {
//           leader: {
//             select: {
//               name: true,
//               phone: true,
//               id: true,
//             },
//           },
//           member: true,
//           name: true,
//           id: true,
//         },
//       },
//       id: true,
//       Balance: true,
//       virtual_id: true,
//       is_claimed: true,
//       user: {
//         select: {
//           phone: true,
//           name: true,
//           Order: {
//             where: {
//               delivery_date: todayDate.formatDefaultDateAndTime,
//             },
//             select: {
//               status: true,
//               id: true,
//             },
//           },
//         },
//       },
//     },
//   });
//   const memberInfo = await prisma.userInfo.findMany({
//     where: {
//       team_id: result?.team_member?.id,
//     },
//     select: {
//       user: {
//         select: {
//           name: true,
//           phone: true,
//         },
//       },
//     },
//   });

//   const ordersOfTheDay = await prisma.order.count({
//     where: {
//       delivery_date: todayDate.formatDefaultDateAndTime,
//       status: 'pending',
//     },
//   });
//   if (!result?.id) {
//     throw new ApiError(404, errorMessage.unclaimedUser);
//   }
//   let teamInfo = {};
//   const getTeamInfo = await prisma.team.findUnique({
//     where: {
//       leader_id: id,
//     },
//   });
//   if (getTeamInfo) {
//     const getTodayOrder = await prisma.order.findMany({
//       where: {
//         team_id: getTeamInfo.id,
//         status: {
//           not: 'canceled',
//         },
//         delivery_date: todayDate.formatDefaultDateAndTime,
//       },
//     });
//     const status = getTodayOrder.find(order => order.status === 'pending');
//     teamInfo = { ...getTeamInfo, order: getTodayOrder.length, status };
//   }
//   const formatInfo = {
//     balance: result?.Balance,
//     address: result?.address.address,
//     team: result?.team_member.name,
//     teamLeader: result?.team_member.leader.name,
//     ordersOfTheDay,
//     memberInfo,
//     totalMembers: result?.team_member?.member,
//     leaderPhone: result?.team_member.leader.phone,
//     name: result.user.name,
//     phone: result.user.phone,
//     order: result.user.Order,
//     virtual_id: result?.virtual_id,
//     is_claimed: result?.is_claimed,
//     teamInfo,
//   };
//   return formatInfo;
// };

// optimized code

const userInfo = async (id: number) => {
  const todayDate = formatLocalTime(new Date());
  const todayDateStr = todayDate.formatDefaultDateAndTime;

  // Fetch user information and related data in a single query
  const result = await prisma.userInfo.findFirst({
    where: { user_id: id },
    select: {
      address: {
        select: {
          address: true,
          id: true,
          supplier: {
            select: {
              contact_no: true,
              name: true,
            },
          },
        },
      },
      team_member: {
        select: {
          leader: { select: { name: true, phone: true, id: true } },
          member: true,
          name: true,
          id: true,
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
          Order: {
            where: { delivery_date: todayDateStr },
            select: { status: true, id: true },
          },
        },
      },
    },
  });

  if (!result?.id) {
    throw new ApiError(404, errorMessage.unclaimedUser);
  }

  // Fetch member information in parallel
  const [memberInfo, ordersOfTheDay, getTeamInfo] = await Promise.all([
    prisma.userInfo.findMany({
      where: { team_id: result.team_member?.id },
      select: {
        user: { select: { name: true, phone: true } },
      },
    }),
    prisma.order.count({
      where: {
        delivery_date: todayDateStr,
        status: 'pending',
      },
    }),
    prisma.team.findUnique({
      where: { leader_id: id },
    }),
  ]);

  let teamInfo = {};
  if (getTeamInfo) {
    const getTodayOrder = await prisma.order.findMany({
      where: {
        team_id: getTeamInfo.id,
        status: { not: 'canceled' },
        delivery_date: todayDateStr,
      },
    });
    const orderStatus = getTodayOrder.find(order => order.status === 'pending')
      ? 'pending'
      : 'received';
    teamInfo = { ...getTeamInfo, order: getTodayOrder.length, orderStatus };
  }

  const formatInfo = {
    balance: result.Balance,
    address: result.address?.address,
    supplier: result?.address?.supplier,
    team: result.team_member?.name,
    teamLeader: result.team_member?.leader?.name,
    ordersOfTheDay,
    memberInfo,
    totalMembers: result.team_member?.member,
    leaderPhone: result.team_member?.leader?.phone,
    name: result.user?.name,
    phone: result.user?.phone,
    order: result.user?.Order,
    virtual_id: result.virtual_id,
    is_claimed: result.is_claimed,
    teamInfo,
  };

  return formatInfo;
};

// const getTransaction = async (id: number, pageNumber: number) => {
//   const meta = pagination({ page: pageNumber });
//   const { skip, take, page } = meta;
//   const result = await prisma.transaction.findMany({
//     skip,
//     take,
//     where: {
//       user_id: id,
//     },
//     orderBy: {
//       date: 'desc',
//     },
//     select: {
//       amount: true,
//       date: true,
//       transaction_type: true,
//       description: true,
//       id: true,
//     },
//   });
//   const totalCount = await prisma.transaction.count();
//   const totalPage =
//     totalCount > take ? Math.ceil(totalCount / Number(take)) : 1;
//   return {
//     data: result,
//     meta: { size: take, total: totalCount, totalPage, currentPage: page },
//   };
// };

//Optimized code

const getTransaction = async (id: number, pageNumber: number) => {
  const meta = pagination({ page: pageNumber });
  const { skip, take, page } = meta;

  // Run both queries concurrently using Promise.all
  const [result, totalCount] = await Promise.all([
    prisma.transaction.findMany({
      skip,
      take,
      where: { user_id: id },
      orderBy: { date: 'desc' },
      select: {
        amount: true,
        date: true,
        transaction_type: true,
        description: true,
        id: true,
      },
    }),
    prisma.transaction.count({ where: { user_id: id } }), // Count only user's transactions
  ]);

  const totalPage = Math.ceil(totalCount / take);

  return {
    data: result,
    meta: { size: take, total: totalCount, totalPage, currentPage: page },
  };
};

// const getTeamDetails = async (id: number) => {
//   const getTeamDetails = await prisma.team.findFirst({
//     where: {
//       leader_id: id,
//     },
//     select: {
//       id: true,
//       name: true,
//       member: true,
//       leader: {
//         select: {
//           name: true,
//           phone: true,
//         },
//       },
//       address: {
//         select: {
//           address: true,
//         },
//       },
//     },
//   });
//   if (getTeamDetails) {
//     const members = await prisma.userInfo.findMany({
//       where: {
//         team_id: getTeamDetails.id,
//       },
//       select: {
//         user: {
//           select: {
//             name: true,
//             phone: true,
//           },
//         },
//       },
//     });
//     const formatDate = formatLocalTime(Date.now());
//     const getOrders = await prisma.order.findMany({
//       orderBy: {
//         delivery_date: 'asc',
//       },
//       where: {
//         status: 'pending',
//         delivery_date: {
//           gte: formatDate.formatDefaultDateAndTime,
//         },
//       },
//       include: {
//         user: {
//           select: {
//             name: true,
//             phone: true,
//           },
//         },
//       },
//     });
//     const aggregatedData: Record<string, TeamOrderData> = {};
//     getOrders.forEach(item => {
//       const { status, delivery_date } = item;
//       const formatDate = formatLocalTime(delivery_date);

//       // Check if the team_id exists in the aggregatedData
//       if (!aggregatedData[formatDate.localDate]) {
//         // If not, initialize an object for the team_id
//         aggregatedData[formatDate.localDate] = {
//           delivery_date: formatDate.localDate,
//           status,
//           order_count: 1,
//           orderList: [
//             {
//               user_name: item.user.name,
//               user_phone: item.user.phone,
//             },
//           ], // Initialize order count to 1
//         };
//       } else {
//         // If it exists, increment the order count
//         aggregatedData[formatDate.localDate].order_count++;
//         aggregatedData[formatDate.localDate].orderList.push({
//           user_name: item.user.name,
//           user_phone: item.user.phone,
//         });
//       }
//     });

//     // Convert the aggregatedData object into an array
//     const result = Object.values(aggregatedData);
//     return { teamDetails: getTeamDetails, members, result };
//   } else {
//     throw new ApiError(404, 'Team not found');
//   }
// };

//Optimized code

const getTeamDetails = async (id: number): Promise<any> => {
  // Fetch team details first
  const teamDetails = await prisma.team.findFirst({
    where: { leader_id: id },
    select: {
      id: true,
      name: true,
      member: true,
      leader: {
        select: { name: true, phone: true },
      },
      address: {
        select: {
          address: true,
          supplier: {
            select: {
              name: true,
              contact_no: true,
            },
          },
        },
      },
    },
  });

  if (!teamDetails) {
    throw new ApiError(404, 'Team not found');
  }

  // Fetch members and orders concurrently
  const [members, orders] = await Promise.all([
    prisma.userInfo.findMany({
      where: { team_id: teamDetails.id },
      select: {
        user: {
          select: { name: true, phone: true },
        },
      },
    }),
    prisma.order.findMany({
      orderBy: { delivery_date: 'asc' },
      where: {
        team_id: teamDetails.id,
        status: {
          not: 'canceled',
        },
        delivery_date: {
          gte: formatLocalTime(Date.now()).formatDefaultDateAndTime,
        },
      },
      include: {
        user: {
          select: { name: true, phone: true },
        },
      },
    }),
  ]);

  // Aggregate orders by delivery date
  const aggregatedData: Record<string, TeamOrderData> = {};
  orders.forEach(item => {
    const { status, delivery_date, user } = item;
    const formattedDate = formatLocalTime(delivery_date).localDate;

    if (!aggregatedData[formattedDate]) {
      aggregatedData[formattedDate] = {
        delivery_date: formattedDate,
        status,
        order_count: 1,
        pendingOrder: status == 'pending' ? 1 : 0,
        receivedOrder: status == 'received' ? 1 : 0,
        orderList: [{ user_name: user.name, user_phone: user.phone }],
      };
    } else {
      if (status == 'pending') {
        aggregatedData[formattedDate].pendingOrder++;
      } else {
        aggregatedData[formattedDate].receivedOrder++;
      }
      aggregatedData[formattedDate].order_count++;
      aggregatedData[formattedDate].orderList.push({
        user_name: user.name,
        user_phone: user.phone,
      });
    }
  });

  const result = Object.values(aggregatedData);

  return {
    teamDetails,
    members,
    result,
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
  getTeamDetails,
};
