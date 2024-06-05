import { Request, Response } from 'express';
import catchAsync from '../../../utils/errorHandlers/catchAsync';
import {
  ChangeTeamSchema,
  CreateTeamSchema,
  changeLeaderSchema,
  updateDueBoxesSchema,
} from '../admin.validator';
import sendResponse from '../../../utils/responseHandler/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { adminService } from '../services/admin.service';
import pick from '../../../utils/helpers/pick';
import { teamFilters } from '../admin.constant';
import { formatLocalTime } from '../../../utils/helpers/timeZone';

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
      message: 'Create team successfully',
      data: result,
    });
  }
});

//need to cancel all upcoming order while changing team
const changeTeam = catchAsync(async (req: Request, res: Response) => {
  const { error } = ChangeTeamSchema.validate(req.body);

  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else {
    const teamId = Number(req.body.teamId);
    const userId = Number(req.body.userId);
    const result = await adminService.changeTeam(teamId, userId);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Team changed successfully',
      data: result,
    });
  }
});

const changeLeader = catchAsync(async (req: Request, res: Response) => {
  const { error } = changeLeaderSchema.validate(req.body);

  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else {
    const result = await adminService.changeLeader(
      req.body.leaderId,
      req.body.teamId
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Leader changed successfully',
      data: result,
    });
  }
});

const deliverOrder = catchAsync(async (req: Request, res: Response) => {
  const teamId = Number(req.params.id);
  const role = req.user?.role;
  const supplier_id = req.user?.id;
  // query
  const todayDate = formatLocalTime(new Date());

  const query = {
    team_id: teamId,
    status: 'pending',
    delivery_date: {
      equals: todayDate.formatDefaultDateAndTime,
    },
  };
  const result =
    role === 'supplier'
      ? await adminService.pickupOrders({ ...query, supplier_id })
      : await adminService.pickupOrders(query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Orders delivered successfully',
    data: result,
  });
});

const pickupOrder = catchAsync(async (req: Request, res: Response) => {
  const teamId = Number(req.params.id);
  const role = req.user?.role;
  const supplier_id = req.user?.id;
  // query
  const todayDate = formatLocalTime(new Date());

  const query = {
    team_id: teamId,
    status: 'received',
    pickup_status: 'enable',
  };
  const result =
    role === 'supplier'
      ? await adminService.pickupOrders({
          ...query,
          supplier_id,
          delivery_date: {
            equals: todayDate.formatDefaultDateAndTime,
          },
        })
      : await adminService.pickupOrders(query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Orders pick up successfully',
    data: result,
  });
});

const getTeams = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const filter = pick(req.query, teamFilters);
  const result = await adminService.getTeams(page, filter);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Teams retrieved successfully',
    data: result,
  });
});

const getTeamInfoById = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: 'User id missing',
      data: 'User id missing',
    });
  }
  const result = await adminService.getTeamInfoById(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Team info retrieved successfully',
    data: result,
  });
});

const updateDueBoxes = catchAsync(async (req: Request, res: Response) => {
  const { error } = updateDueBoxesSchema.validate(req.body);
  if (error) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      success: false,
      message: error.details[0]?.message,
      data: error.details,
    });
  } else {
    const id = Number(req.params.id);
    if (!id) {
      sendResponse(res, {
        statusCode: StatusCodes.NOT_ACCEPTABLE,
        success: false,
        message: 'User id missing',
        data: 'User id missing',
      });
    }
    const amount = Number(req.body.amount);
    const result = await adminService.updateDueBoxes(id, amount);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Expenses listed successfully',
      data: result,
    });
  }
});

export const adminTeamController = {
  createTeam,
  changeTeam,
  changeLeader,
  getTeams,
  getTeamInfoById,
  updateDueBoxes,
  deliverOrder,
  pickupOrder,
};
