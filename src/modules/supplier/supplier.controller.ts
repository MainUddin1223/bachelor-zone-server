import { Request, Response } from 'express';
import catchAsync from '../../utils/errorHandlers/catchAsync';
import { teamFilters } from '../admin/admin.constant';
import { supplierService } from './supplier.service';
import pick from '../../utils/helpers/pick';
import sendResponse from '../../utils/responseHandler/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { successMessage } from './supplier.constant';

const getOrders = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.user?.id);
  const filter = pick(req.query, teamFilters);
  const result = await supplierService.getOrders(id, filter);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: successMessage.getOrderDataSuccess,
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

const getDeliverySpot = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.user?.id);
  const result = await supplierService.getDeliverySpot(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: successMessage.getTeamDataSuccess,
    data: { data: result },
  });
});

export const supplierController = {
  getOrders,
  getTeams,
  getDeliverySpot,
};
