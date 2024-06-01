import { PrismaClient, TransactionType } from '@prisma/client';
import { IFilterOption } from '../../utils/helpers/interface';
import { formatLocalTime } from '../../utils/helpers/timeZone';
import { adminUserService } from '../admin/services/admin.user.service';
import { pagination } from '../../utils/helpers/pagination';
import ApiError from '../../utils/errorHandlers/apiError';

const prisma = new PrismaClient();

const getOrders = async (id: number, filterOptions: IFilterOption) => {
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
      supplier_id: id,
      ...queryOption,
      delivery_date: getDate.formatDefaultDateAndTime,
      status: 'pending',
    },
    select: {
      id: true,
      pickup_status: true,
      status: true,
      delivery_date: true,
      team: {
        select: {
          id: true,
          name: true,
          leader: true,
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
  return getOrders;
};

const getTeams = async (id: number, filterOptions: IFilterOption) => {
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
      supplier_id: id,
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
        },
      },
    },
  });
  return result;
};

const getDeliverySpot = async (id: number) => {
  const getDate = formatLocalTime(Date.now());
  const result = await prisma.address.findMany({
    where: {
      supplier_id: id,
    },
    select: {
      address: true,
      id: true,
      Team: {
        select: {
          name: true,
          id: true,
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
  return result;
};

const getUsers = async (pageNumber: number, filterOptions: IFilterOption) => {
  const result = await adminUserService.getUsers(
    'claimed',
    pageNumber,
    filterOptions
  );
  return result;
};

const GetTransactions = async (
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

  //get teams by address and supplier id

  getUsers,
  rechargeBalance,
  GetTransactions,
  deliverOrder,
  pickBoxes,
};
