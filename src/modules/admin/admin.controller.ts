import { Request, Response } from 'express';
import catchAsync from '../../utils/errorHandlers/catchAsync';
import {
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

// model Team {
//   id         Int @id @default (autoincrement())
//   name       String
//   address_id Int
//   member     Int @default (0)
//   due_boxes  Int @default (0)
//   leader_id  Int @unique
//   leader     Auth @relation(fields: [leader_id], references: [id])
//   address    Address ? @relation(fields: [address_id], references: [id])
//   createdAt  DateTime @default (now())
//   updatedAt  DateTime @updatedAt
//   order      Order[]
//   userInfo   UserInfo[]

//   @@map("team")
// }

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
};
