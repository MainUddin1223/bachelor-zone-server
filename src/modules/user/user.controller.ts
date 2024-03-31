import { Request, Response } from 'express';
import catchAsync from '../../utils/errorHandlers/catchAsync';
import { orderSchema } from './user.validator';
import sendResponse from '../../utils/responseHandler/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { userService } from './user.service';

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
    const orderSortOfDate = req.body.date.split('T')[0];
    const delivery_date = `${orderSortOfDate}T00:00:00.000Z`;
    const result = await userService.placeOrder(delivery_date, userId);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Order placed successfully',
      data: result,
    });
  }
});

export const userController = {
  placeOrder,
};
