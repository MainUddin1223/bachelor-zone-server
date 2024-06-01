import { Request, Response } from 'express';
import catchAsync from '../../../utils/errorHandlers/catchAsync';
import {
  RechargeSchema,
  RefundSchema,
  expensesSchema,
} from '../admin.validator';
import sendResponse from '../../../utils/responseHandler/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { adminService } from '../services/admin.service';
import dayjs from 'dayjs';

const rechargeBalance = catchAsync(async (req: Request, res: Response) => {
  const { error } = RechargeSchema.validate(req.body);
  const receiverId = req?.user?.id;

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
    const result = await adminService.rechargeBalance(
      userId,
      balance,
      receiverId
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Balance recharged successfully',
      data: result,
    });
  }
});

const refundBalance = catchAsync(async (req: Request, res: Response) => {
  const { error } = RefundSchema.validate(req.body);
  const receiverId = req?.user?.id;

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
      description,
      receiverId
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Balance refund successfully',
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

const getExpenses = catchAsync(async (req: Request, res: Response) => {
  const now = dayjs();
  const month = now.month() + 1;
  const year = now.year();
  const date = req?.query?.date ? req?.query?.date : `${year}-${month}`;
  const page = req.query.page ? Number(req.query.page) : 1;
  const result = await adminService.getExpenses(page, date);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Data retrieved successfully',
    data: result,
  });
});

export const transactionController = {
  rechargeBalance,
  refundBalance,
  listExpenses,
  getExpenses,
};
