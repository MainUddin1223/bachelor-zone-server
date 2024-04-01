import { Request, Response } from 'express';
import catchAsync from '../../utils/errorHandlers/catchAsync';
import { orderSchema } from './user.validator';
import sendResponse from '../../utils/responseHandler/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { userService } from './user.service';
import { successMessage } from './user.constant';

const placeOrder = catchAsync(async (req: Request, res: Response) => {
  const { error } = orderSchema.validate(req.body);

  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else {
    const userId = Number(req.user?.id);
    const result = await userService.placeOrder(req.body.date, userId);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Order placed successfully',
      data: result,
    });
  }
});

const cancelOrder = catchAsync(async (req: Request, res: Response) => {
  const userId = Number(req.user?.id);
  const orderId = Number(req.params.id);
  const result = await userService.cancelOrder(orderId, userId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: successMessage.successToCancel,
    data: result,
  });
});
const updateOrder = catchAsync(async (req: Request, res: Response) => {
  const userId = Number(req.user?.id);
  const orderId = Number(req.params.id);
  const result = await userService.updateOrder(orderId, userId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: successMessage.successToUpdate,
    data: result,
  });
});
const getUpcomingOrder = catchAsync(async (req: Request, res: Response) => {
  const userId = Number(req.user?.id);
  const result = await userService.getUpcomingOrder(userId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: successMessage.successToUpdate,
    data: result,
  });
});

export const userController = {
  placeOrder,
  cancelOrder,
  updateOrder,
  getUpcomingOrder,
};
