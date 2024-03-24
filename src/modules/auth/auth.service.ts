import {
  IChangePasswordPayload,
  ILoginPayload,
  ISignUpPayload,
} from './auth.interface';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import ApiError from '../../utils/errorHandlers/apiError';
import { StatusCodes } from 'http-status-codes';
import { jwtToken } from '../../utils/jwtHelpers/jwtToken';
import config from '../../utils/config';
import { errorMessages, successMessage } from './auth.constant';

const prisma = new PrismaClient();

const signUp = async (payload: ISignUpPayload) => {
  const { phone, password, name } = payload;
  const hashedPassword = bcrypt.hashSync(password, 10);

  const data = {
    phone,
    password: hashedPassword,
    name,
  };

  const isExist = await prisma.auth.findFirst({
    where: {
      phone,
    },
  });

  if (isExist) {
    throw new ApiError(StatusCodes.FORBIDDEN, errorMessages.numberExistError);
  }

  const result = await prisma.auth.create({
    data,
  });

  const accessData = {
    role: result.role,
    id: result.id,
  };
  const accessToken = await jwtToken.createToken(
    accessData,
    config.jwt_access_secret as string,
    config.expires_in as string
  );
  return {
    accessToken,
    name: result.name,
    phone: result.phone,
  };
};

const login = async (payload: ILoginPayload) => {
  const { phone, password } = payload;
  const isUserExist = await prisma.auth.findFirst({
    where: {
      phone,
    },
  });
  if (!isUserExist) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      errorMessages.somethingWrongError
    );
  }

  const isPasswordMatched = await bcrypt.compare(
    password,
    isUserExist.password
  );
  if (!isPasswordMatched) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      errorMessages.somethingWrongError
    );
  }
  const accessData = {
    role: isUserExist.role,
    id: isUserExist.id,
  };
  const accessToken = await jwtToken.createToken(
    accessData,
    config.jwt_access_secret as string,
    config.expires_in as string
  );
  return {
    accessToken,
    name: isUserExist.name,
    phone: isUserExist.phone,
  };
};

const changePassword = async (payload: IChangePasswordPayload) => {
  const { oldPassword, newPassword, id } = payload;
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  const isUserExist = await prisma.auth.findFirst({
    where: {
      id,
    },
  });
  if (!isUserExist) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      errorMessages.somethingWrongError
    );
  }

  const isPasswordMatched = await bcrypt.compare(
    oldPassword,
    isUserExist.password
  );
  if (!isPasswordMatched) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      errorMessages.somethingWrongError
    );
  } else {
    const result = await prisma.auth.update({
      where: {
        id,
      },
      data: {
        password: hashedPassword,
      },
    });
    if (result) {
      return { message: successMessage.changePasswordSuccess };
    }
  }
};

export const authService = {
  signUp,
  login,
  changePassword,
};
