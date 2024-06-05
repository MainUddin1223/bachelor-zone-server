import { Request, Response } from 'express';
import catchAsync from '../../../utils/errorHandlers/catchAsync';
import { ClaimUserSchema } from '../admin.validator';
import sendResponse from '../../../utils/responseHandler/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { minAmountForClaim, teamFilters } from '../admin.constant';
import { adminService } from '../services/admin.service';
import pick from '../../../utils/helpers/pick';

const claimUser = catchAsync(async (req: Request, res: Response) => {
  const { error } = ClaimUserSchema.validate(req.body);
  const receiver_id = req?.user?.id;
  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else {
    if (minAmountForClaim > req.body.balance) {
      sendResponse(res, {
        statusCode: StatusCodes.NOT_ACCEPTABLE,
        success: false,
        message: `Minimum balance should be ${minAmountForClaim}`,
        data: `Minimum balance should be ${minAmountForClaim}`,
      });
    } else {
      const result = await adminService.claimUser(req.body, receiver_id);
      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'User claimed successfully',
        data: result,
      });
    }
  }
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
  if (!id) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: 'User id missing',
      data: 'User id missing',
    });
  }
  const result = await adminService.getUserById(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User details retrieved successfully',
    data: result,
  });
});

const getUnclaimUserById = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: 'User id missing',
      data: 'User id missing',
    });
  }
  const result = await adminService.getUnclaimedUser(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User details retrieved successfully',
    data: result,
  });
});

export const adminUserController = {
  claimUser,
  getUserInfo,
  getUsers,
  getUserById,
  getUnclaimUserById,
};
