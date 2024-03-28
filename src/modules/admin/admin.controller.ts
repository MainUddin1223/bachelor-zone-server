import { Request, Response } from 'express';
import catchAsync from '../../utils/errorHandlers/catchAsync';
import {
  ClaimUserSchema,
  CreateTeamSchema,
  addressSchema,
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
      message: 'Category added successfully',
      data: result,
    });
  }
});

export const adminController = {
  addAddress,
  updateAddress,
  createTeam,
  claimUser,
};
