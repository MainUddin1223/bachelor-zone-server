import { Request, Response } from 'express';
import catchAsync from '../../utils/errorHandlers/catchAsync';
import {
  ChangeTeamSchema,
  ClaimUserSchema,
  CreateTeamSchema,
  RechargeSchema,
  addressSchema,
  changeLeaderSchema,
  expensesSchema,
  updateAddressSchema,
} from './admin.validator';
import sendResponse from '../../utils/responseHandler/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { adminService } from './admin.service';

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
    const result = await adminService.addAddress(req.body.address);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Category added successfully',
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

const claimUser = catchAsync(async (req: Request, res: Response) => {
  const { error } = ClaimUserSchema.validate(req.body);

  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else {
    const result = await adminService.claimUser(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Category added successfully',
      data: result,
    });
  }
});

const createTeam = catchAsync(async (req: Request, res: Response) => {
  const { error } = CreateTeamSchema.validate(req.body);

  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else {
    const result = await adminService.createTeam(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Create team successfully',
      data: result,
    });
  }
});

const rechargeBalance = catchAsync(async (req: Request, res: Response) => {
  const { error } = RechargeSchema.validate(req.body);

  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else {
    const balance = Number(req.body.balance);
    const userId = Number(req.body.userId);
    const result = await adminService.rechargeBalance(userId, balance);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Balance recharged successfully',
      data: result,
    });
  }
});

const refundBalance = catchAsync(async (req: Request, res: Response) => {
  const { error } = RechargeSchema.validate(req.body);

  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else {
    const balance = Number(req.body.balance);
    const userId = Number(req.body.userId);
    const result = await adminService.refundBalance(userId, balance);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Balance refund successfully',
      data: result,
    });
  }
});

const changeTeam = catchAsync(async (req: Request, res: Response) => {
  const { error } = ChangeTeamSchema.validate(req.body);

  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else {
    const teamId = Number(req.body.teamId);
    const userId = Number(req.body.userId);
    const result = await adminService.changeTeam(teamId, userId);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Team changed successfully',
      data: result,
    });
  }
});

const listExpenses = catchAsync(async (req: Request, res: Response) => {
  const { error } = expensesSchema.validate(req.body);

  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else {
    const result = await adminService.listExpenses(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Expenses listed successfully',
      data: result,
    });
  }
});
const changeLeader = catchAsync(async (req: Request, res: Response) => {
  const { error } = changeLeaderSchema.validate(req.body);

  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else {
    const result = await adminService.changeLeader(
      req.body.leaderId,
      req.body.teamId
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Leader changed successfully',
      data: result,
    });
  }
});

export const adminController = {
  addAddress,
  updateAddress,
  createTeam,
  claimUser,
  listExpenses,
  changeTeam,
  rechargeBalance,
  refundBalance,
  changeLeader,
};
