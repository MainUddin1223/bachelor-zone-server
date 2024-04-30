import { Request, Response } from 'express';
import catchAsync from '../../utils/errorHandlers/catchAsync';
import { authService } from './auth.service';
import sendResponse from '../../utils/responseHandler/sendResponse';
import {
  changePasswordSchema,
  loginSchema,
  signUpSchema,
} from './auth.validator';
import { StatusCodes } from 'http-status-codes';
import { errorMessages, successMessage } from './auth.constant';

const signUp = catchAsync(async (req: Request, res: Response) => {
  const { error } = signUpSchema.validate(req.body);

  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else if (req.body?.password !== req.body?.confirmPassword) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: errorMessages.confirmPasswordError,
      data: errorMessages.confirmPasswordError,
    });
  } else {
    delete req.body.confirmPassword;
    const result = await authService.signUp(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: successMessage.signUpSuccess,
      data: result,
    });
  }
});

const login = catchAsync(async (req: Request, res: Response) => {
  const { error } = loginSchema.validate(req.body);

  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else {
    const result = await authService.login(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: successMessage.loginSuccess,
      data: result,
    });
  }
});
const adminLogin = catchAsync(async (req: Request, res: Response) => {
  const { error } = loginSchema.validate(req.body);

  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else {
    const result = await authService.login(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: successMessage.loginSuccess,
      data: result,
    });
  }
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { error } = changePasswordSchema.validate(req.body);

  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else if (req.body?.newPassword !== req.body?.confirmPassword) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: errorMessages.confirmPasswordError,
      data: errorMessages.confirmPasswordError,
    });
  } else if (req.body?.newPassword === req.body?.oldPassword) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: errorMessages.samePasswordError,
      data: errorMessages.samePasswordError,
    });
  } else {
    delete req.body.confirmPassword;
    const id = req.user?.id;
    const result = await authService.changePassword({ ...req.body, id });
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: successMessage.changePasswordSuccess,
      data: result,
    });
  }
});

export const authController = {
  signUp,
  login,
  adminLogin,
  changePassword,
};
