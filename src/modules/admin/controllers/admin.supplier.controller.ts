import { Request, Response } from 'express';
import catchAsync from '../../../utils/errorHandlers/catchAsync';
import { createSupplierSchema, updateSupplierSchema } from '../admin.validator';
import sendResponse from '../../../utils/responseHandler/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { adminService } from '../services/admin.service';
import pick from '../../../utils/helpers/pick';
import { teamFilters } from '../admin.constant';
import { changePasswordSchema } from '../../auth/auth.validator';

const createSupplier = catchAsync(async (req: Request, res: Response) => {
  const { error } = createSupplierSchema.validate(req.body);

  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else {
    const result = await adminService.createSupplier(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'New supplier created successfully',
      data: result,
    });
  }
});

const updateSupplier = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params?.id);
  const { error } = updateSupplierSchema.validate(req.body);

  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else {
    const result = await adminService.updateSupplier(req.body, id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'New supplier created successfully',
      data: result,
    });
  }
});

const getSuppliers = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const filter = pick(req.query, teamFilters);

  const result = await adminService.getSuppliers(page, filter);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Supplier retrieved successfully',
    data: result,
  });
});
const getSupplierById = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const result = await adminService.getSupplierById(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Supplier retrieved successfully',
    data: result,
  });
});
const getPaymentFromSupplier = catchAsync(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const result = await adminService.getPaymentFromSupplier(id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Payment received',
      data: result,
    });
  }
);
const changeSupplierPassword = catchAsync(
  async (req: Request, res: Response) => {
    const { error } = changePasswordSchema.validate(req.body);

    if (error) {
      sendResponse(res, {
        statusCode: StatusCodes.NOT_ACCEPTABLE,
        success: false,
        message: error.details[0]?.message,
        data: error.details,
      });
    } else {
      const { id, password } = req.body.data;
      const result = await adminService.changeSupplierPassword(id, password);
      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Password updated successfully',
        data: result,
      });
    }
  }
);

export const supplierController = {
  createSupplier,
  updateSupplier,
  getSuppliers,
  getSupplierById,
  getPaymentFromSupplier,
  changeSupplierPassword,
};
