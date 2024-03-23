import { ILoginPayload, ISignUpPayload } from './auth.interface';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import ApiError from '../../utils/errorHandlers/apiError';
import { StatusCodes } from 'http-status-codes';
import { jwtToken } from '../../utils/jwtHelpers/jwtToken';
import config from '../../utils/config';
import { errorMessages } from './auth.constant';

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
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      errorMessages.numberExistError
    );
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
    email: isUserExist.phone,
  };
};

export const authService = {
  signUp,
  login,
};
