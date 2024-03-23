import { Request, Response } from 'express';
import catchAsync from '../../utils/errorHandlers/catchAsync';
import { authService } from './auth.service';
import sendResponse from '../../utils/responseHandler/sendResponse';
import { loginSchema, signUpSchema } from './auth.validator';
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
    delete req.body.confirmPassword;
    const result = await authService.login(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: successMessage.loginSuccess,
      data: result,
    });
  }
});

export const authController = {
  signUp,
  login,
};
