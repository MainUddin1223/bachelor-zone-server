import { Request, Response } from 'express';
import catchAsync from '../../utils/errorHandlers/catchAsync';
import { categorySchema, quizSchema } from './admin.validator';
import sendResponse from '../../utils/responseHandler/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { adminService } from './admin.service';

const addCategory = catchAsync(async (req: Request, res: Response) => {
  const { error } = categorySchema.validate(req.body);

  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else {
    const result = await adminService.addCategory({
      category: req.body.category,
      adminId: req.user?.id,
    });
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Category added successfully',
      data: result,
    });
  }
});

const addQuiz = catchAsync(async (req: Request, res: Response) => {
  const { error } = quizSchema.validate(req.body);
  const categoryId = Number(req.params.id);
  const adminId = req.user?.id;
  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else {
    const result = await adminService.addQuiz({
      ...req.body,
      categoryId,
      adminId,
    });
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Quiz added successfully',
      data: result,
    });
  }
});

const getStatics = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getStatics();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Statics retrieved successfully',
    data: result,
  });
});

export const adminController = {
  addCategory,
  addQuiz,
  getStatics,
};
