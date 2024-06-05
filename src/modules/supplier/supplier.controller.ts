import { Request, Response } from 'express';
import catchAsync from '../../utils/errorHandlers/catchAsync';
import { teamFilters } from '../admin/admin.constant';
import { supplierService } from './supplier.service';
import pick from '../../utils/helpers/pick';
import sendResponse from '../../utils/responseHandler/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { successMessage, transactionFilter } from './supplier.constant';
import { rechargeValidatorSchema } from './supplier.validator';

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

const getDeliverySpot = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.user?.id);
  const orderType = req?.params.type;
  const result = await supplierService.getDeliverySpot(id, orderType);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: successMessage.getTeamDataSuccess,
    data: { data: result },
  });
});

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
  pickBoxes,
  rechargeBalance,
};
