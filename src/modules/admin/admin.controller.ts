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
  updateDueBoxesSchema,
} from './admin.validator';
import sendResponse from '../../utils/responseHandler/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { adminService } from './admin.service';
import dayjs from 'dayjs';
import { teamFilters } from './admin.constant';
import pick from '../../utils/helpers/pick';

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
    const description = req.body.description;
    const userId = Number(req.body.userId);
    const result = await adminService.refundBalance(
      userId,
      balance,
      description
    );
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

const getOrders = catchAsync(async (req: Request, res: Response) => {
  const date = dayjs(Date.now());
  const filter = pick(req.query, teamFilters);
  const status = req?.query?.status ? req?.query?.status : 'pending';
  const result = await adminService.getOrders(date, filter, status);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Leader changed successfully',
    data: result,
  });
});
const getUserInfo = catchAsync(async (req: Request, res: Response) => {
  const phone = req.body.phone;
  const result = await adminService.getUserInfo(phone);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User info retrieved successfully',
    data: result,
  });
});

const deliverOrder = catchAsync(async (req: Request, res: Response) => {
  const teamId = Number(req.params.id);
  const result = await adminService.deliverOrder(teamId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Orders delivered successfully',
    data: result,
  });
});
const getTeams = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const filter = pick(req.query, teamFilters);
  const result = await adminService.getTeams(page, filter);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Teams retrieved successfully',
    data: result,
  });
});
const getTeamInfoById = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await adminService.getTeamInfoById(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Team info retrieved successfully',
    data: result,
  });
});
const updateDueBoxes = catchAsync(async (req: Request, res: Response) => {
  const { error } = updateDueBoxesSchema.validate(req.body);
  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else {
    const id = Number(req.params.id);
    const amount = Number(req.body.amount);
    const result = await adminService.updateDueBoxes(id, amount);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Expenses listed successfully',
      data: result,
    });
  }
});
const getUsers = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const status = req.query?.status ? req.query?.status : 'all';
  const filter = pick(req.query, teamFilters);
  const result = await adminService.getUsers(status, page, filter);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Users retrieved successfully',
    data: result,
  });
});
const getUserById = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  console.log(id);
  const result = await adminService.getUserById(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User details retrieved successfully',
    data: result,
  });
});

export const adminController = {
  addAddress,
  updateAddress,
  createTeam,
  getTeams,
  claimUser,
  listExpenses,
  changeTeam,
  rechargeBalance,
  refundBalance,
  changeLeader,
  getOrders,
  deliverOrder,
  getUserInfo,
  getTeamInfoById,
  updateDueBoxes,
  getUsers,
  getUserById,
};
