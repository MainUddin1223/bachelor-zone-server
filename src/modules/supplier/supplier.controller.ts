import { Request, Response } from 'express';
import catchAsync from '../../utils/errorHandlers/catchAsync';
import { teamFilters } from '../admin/admin.constant';
import { supplierService } from './supplier.service';
import pick from '../../utils/helpers/pick';
import sendResponse from '../../utils/responseHandler/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { successMessage, transactionFilter } from './supplier.constant';
import { rechargeValidatorSchema } from './supplier.validator';
import dayjs from 'dayjs';
import { formatLocalTime } from '../../utils/helpers/timeZone';
import { PrismaClient } from '@prisma/client';
import ApiError from '../../utils/errorHandlers/apiError';
import { getSupplierId } from './supplier.utils';
const prisma = new PrismaClient();

const getUsers = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const filter = pick(req.query, teamFilters);
  const result = await supplierService.getUsers(page, filter);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: successMessage.getUsersDataSuccess,
    data: { data: result },
  });
});

const getTeams = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.user?.id);
  // const page = req.query.page ? Number(req.query.page) : 1;
  const filter = pick(req.query, teamFilters);
  const result = await supplierService.getTeams(id, filter);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: successMessage.getTeamDataSuccess,
    data: { data: result },
  });
});

// get addresses where delivery available

const getDeliverySpot = catchAsync(async (req: Request, res: Response) => {
  const orderDate = req?.query?.date ? req?.query?.date : dayjs(Date.now());
  const formatDate = formatLocalTime(orderDate);
  const page = req.query.page ? Number(req.query.page) : 1;
  const filter = pick(req.query, teamFilters);
  const id = Number(req?.user?.id);
  const supplier_id = await getSupplierId(id);

  const result = await supplierService.getDeliverySpot(
    formatDate.formatDefaultDateAndTime,
    page,
    { ...filter, supplier_id }
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: successMessage.getTeamDataSuccess,
    data: result,
  });
});

// get teams by address id

const getDeliverySpotDetails = catchAsync(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const orderDate = req?.query?.date ? req?.query?.date : dayjs(Date.now());
    const formatDate = formatLocalTime(orderDate);
    const supplier_id = await getSupplierId(id);
    if (!supplier_id) {
      throw new ApiError(404, 'Supplier not found');
    }

    const result = await supplierService.getDeliverySpotDetails(
      formatDate.formatDefaultDateAndTime,
      { supplier_id }
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: successMessage.getTeamDataSuccess,
      data: result,
    });
  }
);

// deliver order
const deliverOrder = catchAsync(async (req: Request, res: Response) => {
  const team_id = Number(req.params.id);
  const id = Number(req.user?.id);
  const result = await supplierService.deliverOrder(team_id, id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: successMessage.deliverOrderSuccess,
    data: { data: result },
  });
});

// get transactions

const getTransactions = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.user?.id);
  const page = req.query.page ? Number(req.query.page) : 1;
  const filter = pick(req.query, transactionFilter);
  const result = await supplierService.getTransactions(id, page, filter);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: successMessage.getTeamDataSuccess,
    data: { data: result },
  });
});

//

const getPickupSpot = catchAsync(async (req: Request, res: Response) => {
  const orderDate = req?.query?.date ? req?.query?.date : dayjs(Date.now());
  const formatDate = formatLocalTime(orderDate);
  const page = req.query.page ? Number(req.query.page) : 1;
  const filter = pick(req.query, teamFilters);
  const id = Number(req?.user?.id);
  const supplier_id = await getSupplierId(id);

  const result = await supplierService.getPickupSpots(
    formatDate.formatDefaultDateAndTime,
    page,
    { ...filter, supplier_id }
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Delivery spot retrieved successfully',
    data: result,
  });
});

const getPickupSpotDetails = catchAsync(async (req: Request, res: Response) => {
  const addressId = Number(req.params.id);
  const orderDate = req?.query?.date ? req?.query?.date : dayjs(Date.now());
  const formatDate = formatLocalTime(orderDate);
  const id = Number(req?.user?.id);
  const supplierInfo = await prisma.supplierInfo.findFirst({
    where: {
      user_id: id,
    },
  });
  const result = await supplierService.getPickupSpotDetails(
    formatDate.formatDefaultDateAndTime,
    { id: addressId, supplier_id: supplierInfo?.id }
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Delivery spot details retrieved successfully',
    data: result,
  });
});

const pickBoxes = catchAsync(async (req: Request, res: Response) => {
  const team_id = Number(req.params.id);
  const id = Number(req.user?.id);
  const result = await supplierService.pickBoxes(team_id, id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: successMessage.pickBoxesSuccess,
    data: { data: result },
  });
});

const rechargeBalance = catchAsync(async (req: Request, res: Response) => {
  const { error } = rechargeValidatorSchema.validate(req.body);

  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else {
    const receiverId = Number(req.user?.id);
    const balance = req.body.balance;
    const userId = req.body.userId;
    const result = await supplierService.rechargeBalance(
      userId,
      receiverId,
      balance
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: successMessage.balanceRechargeSuccess,
      data: { data: result },
    });
  }
});

export const supplierController = {
  getUsers,
  getTeams,
  getDeliverySpot,
  getTransactions,
  deliverOrder,
  getDeliverySpotDetails,
  getPickupSpot,
  getPickupSpotDetails,
  pickBoxes,
  rechargeBalance,
};
