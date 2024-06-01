import { PrismaClient } from '@prisma/client';
import ApiError from '../../../utils/errorHandlers/apiError';
import { pagination } from '../../../utils/helpers/pagination';
import { IFilterOption } from '../../../utils/helpers/interface';
import { formatLocalTime } from '../../../utils/helpers/timeZone';

const prisma = new PrismaClient();

const createSupplier = async (data: {
  contactNo: string;
  id: number;
  name: string;
}) => {
  const { contactNo, id, name } = data;
  const isSupplierExist = await prisma.supplierInfo.findFirst({
    where: {
      user_id: id,
    },
  });
  if (isSupplierExist) {
    throw new ApiError(409, 'Supplier already exist');
  }
  const result = await prisma.$transaction(async tx => {
    const res = await tx.supplierInfo.create({
      data: {
        user_id: id,
        contact_no: contactNo,
        name,
      },
    });
    await prisma.auth.update({
      where: {
        id,
      },
      data: {
        role: 'supplier',
      },
    });
    return res;
  });
  return result;
};

const updateSupplier = async (data: any, id: number) => {
  const result = await prisma.supplierInfo.update({
    where: {
      id,
    },
    data,
  });
  return result;
};

const getSuppliers = async (
  pageNumber: number,
  filterOptions: IFilterOption
) => {
  const meta = pagination({ page: pageNumber, limit: 5 });
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
          contact_no: {
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
  const result = await prisma.supplierInfo.findMany({
    skip,
    take,
    orderBy,
    where: {
      ...queryOption,
    },
    select: {
      contact_no: true,
      name: true,
      address: {
        select: {
          address: true,
          id: true,
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

const getSupplierById = async (id: number) => {
  const supplierData = await prisma.supplierInfo.findUnique({
    where: {
      id,
    },
    select: {
      contact_no: true,
      name: true,
      user: {
        select: {
          phone: true,
        },
      },
      address: {
        select: {
          address: true,
          id: true,
        },
      },
      Order: {
        where: {
          delivery_date: {
            gte: formatLocalTime(Date.now()).formatDefaultDateAndTime,
          },
          status: {
            not: {
              equals: 'canceled',
            },
          },
        },
        select: {
          delivery_date: true,
        },
      },
      Transaction: {
        where: {
          status: 'pending',
        },
        select: {
          amount: true,
        },
      },
    },
  });
  return supplierData;
};

const getPaymentFromSupplier = async (id: number) => {
  const result = await prisma.transaction.updateMany({
    where: {
      receiver_id: id,
      status: 'pending',
    },
    data: {
      status: 'paid',
    },
  });
  return result;
};

export const adminSupplierService = {
  createSupplier,
  updateSupplier,
  getSuppliers,
  getSupplierById,
  getPaymentFromSupplier,
};
