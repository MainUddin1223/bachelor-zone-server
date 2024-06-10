import { PrismaClient, TransactionType } from '@prisma/client';
import { IFilterOption } from '../../utils/helpers/interface';
import { formatLocalTime } from '../../utils/helpers/timeZone';
import { adminUserService } from '../admin/services/admin.user.service';
import { pagination } from '../../utils/helpers/pagination';
import ApiError from '../../utils/errorHandlers/apiError';
import { getSupplierId } from './supplier.utils';

const prisma = new PrismaClient();

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
const getUsers = async (pageNumber: number, filterOptions: IFilterOption) => {
  const result = await adminUserService.getUsers(
    'claimed',
    pageNumber,
    filterOptions
  );
  return result;
};

// get transactions

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

const pickBoxes = async (team_id: number, id: number) => {
  const supplier_id = await getSupplierId(id);
  console.log(supplier_id, team_id);
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

//get delivery with pending orders
const getDeliverySpot = async (
  date: string,
  pageNumber: number,
  filterOptions: any
) => {
  const meta = pagination({ page: pageNumber, limit: 10 });
  const { skip, take, orderBy, page } = meta;
  const queryOption: { [key: string]: any } = {};
  if (Object.keys(filterOptions).length) {
    const { search, ...restOptions } = filterOptions;

    if (search) {
      queryOption['OR'] = [
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
    skip,
    take,
    orderBy,
    where: {
      ...queryOption,
    },
    select: {
      address: true,
      id: true,
      supplier: {
        select: {
          name: true,
          contact_no: true,
        },
      },
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
            },
          },
          order: {
            where: {
              delivery_date: date,
              status: 'pending',
            },
            select: {
              id: true,
              status: true,
              pickup_status: true,
            },
          },
        },
      },
    },
  });
  const totalCount = await prisma.address.count({
    where: {
      ...queryOption,
    },
  });
  const totalPage = totalCount > take ? totalCount / Number(take) : 1;

  //format data
  const formattedData = result.map(addressData => {
    const address = addressData.address;
    const addressId = addressData.id;
    const totalTeams = addressData.Team.length;

    interface ProcessedTeamData {
      totalPendingOrder: number;
      totalDueBoxes: number;
      totalMembers: number;
    }

    const teamData = addressData.Team.reduce<ProcessedTeamData>(
      (teamAcc, team) => {
        teamAcc.totalPendingOrder += team.order.length;
        teamAcc.totalDueBoxes += team.due_boxes;
        teamAcc.totalMembers += team.member;
        return teamAcc;
      },
      {
        totalPendingOrder: 0,
        totalDueBoxes: 0,
        totalMembers: 0,
      }
    );

    return {
      address,
      addressId,
      totalTeams,
      date,
      totalMembers: teamData.totalMembers,
      totalPendingOrder: teamData.totalPendingOrder,
      totalDueBoxes: teamData.totalDueBoxes,
    };
  });
  const data = formattedData.sort(
    (a, b) => a.totalPendingOrder - b.totalPendingOrder
  );
  return {
    data,
    meta: { page: page, size: take, total: totalCount, totalPage },
  };
};

// get teams from specific address with pending order
const getDeliverySpotDetails = async (date: string, data: any) => {
  const result = await prisma.address.findFirst({
    where: {
      ...data,
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
            },
          },
          order: {
            where: {
              delivery_date: date,
              status: 'pending',
            },
            select: {
              id: true,
              status: true,
              pickup_status: true,
              user: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!result) {
    throw new ApiError(404, 'Address not found');
  }
  //format data
  const processTeams = (teams: any) => {
    return teams.map((team: any) => {
      const totalPendingOrder = team.order.length;

      return {
        ...team,
        totalPendingOrder,
        date,
      };
    });
  };

  // Construct the final result
  const finalResult = {
    address: result.address,
    id: result.id,
    Teams: processTeams(result.Team),
  };

  return finalResult;
};

// deliver order

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

//pickup

const getPickupSpots = async (
  date: string,
  pageNumber: number,
  filterOptions: any
) => {
  const meta = pagination({ page: pageNumber, limit: 20 });
  const { skip, take, orderBy, page } = meta;
  const queryOption: { [key: string]: any } = {};
  if (Object.keys(filterOptions).length) {
    const { search, ...restOptions } = filterOptions;

    if (search) {
      queryOption['OR'] = [
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
    skip,
    take,
    orderBy,
    where: {
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
            },
          },
          order: {
            where: {
              delivery_date: date,
              pickup_status: 'enable',
            },
            select: {
              id: true,
              status: true,
              pickup_status: true,
            },
          },
        },
      },
    },
  });
  const totalCount = await prisma.address.count({
    where: {
      ...queryOption,
    },
  });
  const totalPage = totalCount > take ? totalCount / Number(take) : 1;

  //format data
  const formattedData = result.map(addressData => {
    const address = addressData.address;
    const addressId = addressData.id;
    const totalTeams = addressData.Team.length;

    interface ProcessedTeamData {
      totalReadyToPickup: number;
      totalDueBoxes: number;
      totalMembers: number;
    }

    const teamData = addressData.Team.reduce<ProcessedTeamData>(
      (teamAcc, team) => {
        teamAcc.totalMembers += team.member;
        teamAcc.totalDueBoxes += team.due_boxes;
        teamAcc.totalReadyToPickup += team.order.length;

        return teamAcc;
      },
      {
        totalMembers: 0,
        totalReadyToPickup: 0,
        totalDueBoxes: 0,
      }
    );

    return {
      address,
      addressId,
      totalTeams,
      date,
      totalAvailablePickup: teamData.totalReadyToPickup,
      totalDueBoxes: teamData.totalDueBoxes,
      totalMembers: teamData.totalMembers,
    };
  });

  return {
    data: formattedData,
    meta: { page: page, size: take, total: totalCount, totalPage },
  };
};

const getPickupSpotDetails = async (date: string, data: any) => {
  const result = await prisma.address.findFirst({
    where: {
      ...data,
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
            },
          },
          order: {
            where: {
              delivery_date: date,
              pickup_status: 'enable',
            },
            select: {
              id: true,
              status: true,
              pickup_status: true,
              user: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!result) {
    throw new ApiError(404, 'Address not found');
  }
  //format data
  const processTeams = (teams: any) => {
    return teams.map((team: any) => {
      const totalAvailableOrderForPickup = team.order.length;

      return {
        ...team,
        totalAvailableOrderForPickup,
        date,
      };
    });
  };

  // Construct the final result
  const finalResult = {
    address: result.address,
    id: result.id,
    Teams: processTeams(result.Team),
  };

  return finalResult;
};

export const supplierService = {
  getTeams,
  getDeliverySpot,
  getDeliverySpotDetails,
  getTransactions,
  getUsers,
  rechargeBalance,
  deliverOrder,
  pickBoxes,
  getPickupSpots,
  getPickupSpotDetails,
};
