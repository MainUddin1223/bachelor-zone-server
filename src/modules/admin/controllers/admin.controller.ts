import { Request, Response } from 'express';
import catchAsync from '../../../utils/errorHandlers/catchAsync';
import { addressSchema, updateAddressSchema } from '../admin.validator';
import sendResponse from '../../../utils/responseHandler/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { adminService } from '../services/admin.service';
import dayjs from 'dayjs';
import { teamFilters } from '../admin.constant';
import pick from '../../../utils/helpers/pick';
import { supplierController } from './admin.supplier.controller';
import { adminUserController } from './admin.user.controller';
import { adminTeamController } from './admin.team.controller';
import { transactionController } from './admin.transaction.controller';
import { getSupplierStatics } from '../../supplier/supplier.utils';
import { formatLocalTime } from '../../../utils/helpers/timeZone';

const addAddress = catchAsync(async (req: Request, res: Response) => {
  const { error } = addressSchema.validate(req.body);

  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else {
    const result = await adminService.addAddress(
      req.body.address,
      req.body.supplierId
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Address created successfully',
      data: result,
    });
  }
});

const updateAddress = catchAsync(async (req: Request, res: Response) => {
  const { error } = updateAddressSchema.validate(req.body);

  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else {
    const result = await adminService.updateAddress(
      req.body.id,
      req.body.address
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Category added successfully',
      data: result,
    });
  }
});

const getOrders = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, teamFilters);
  const status = req?.query?.status;
  const orderDate = req?.query?.date ? req?.query?.date : dayjs(Date.now());
  const result = await adminService.getOrders(orderDate, filter, status);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Orders retrieved successfully',
    data: result,
  });
});

const getTotalStatics = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req?.user?.id);
  const role = req?.user?.role;
  if (role == 'admin') {
    const result = await adminService.getTotalStatics();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Data retrieved successfully',
      data: result,
    });
  } else {
    const result = await getSupplierStatics(id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Data retrieved successfully',
      data: result,
    });
  }
});

const getDeliverySpot = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req?.user?.id);
  const orderDate = req?.query?.date ? req?.query?.date : dayjs(Date.now());
  const formatDate = formatLocalTime(orderDate);
  const role = req?.user?.role;
  const page = req.query.page ? Number(req.query.page) : 1;
  const filter = pick(req.query, teamFilters);
  if (role == 'supplier') {
    const result = await adminService.getDeliverySpot(
      formatDate.formatDefaultDateAndTime,
      page,
      { ...filter, supplier_id: id }
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Delivery spot retrieved successfully',
      data: result,
    });
  } else {
    const result = await adminService.getDeliverySpot(
      formatDate.formatDefaultDateAndTime,
      page,
      filter
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Data retrieved successfully',
      data: result,
    });
  }
});

// supplier

export const adminController = {
  addAddress,
  updateAddress,
  getOrders,
  getTotalStatics,
  getDeliverySpot,
  // Users
  ...adminUserController,
  //supplier
  ...supplierController,
  //team
  ...adminTeamController,
  //transaction
  ...transactionController,
};
