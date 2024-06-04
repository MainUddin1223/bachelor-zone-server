import { PrismaClient } from '@prisma/client';
import { ICreateTeam } from '../admin.interface';
import ApiError from '../../../utils/errorHandlers/apiError';
import { generateRandomID } from '../../../utils/helpers/helpers';
import { IFilterOption } from '../../../utils/helpers/interface';
import { pagination } from '../../../utils/helpers/pagination';
import { formatLocalTime } from '../../../utils/helpers/timeZone';

const prisma = new PrismaClient();

const createTeam = async (data: ICreateTeam) => {
  const isUserExist = await prisma.auth.findFirst({
    where: {
      id: data.leader_id,
    },
    include: {
      UserInfo: true,
    },
  });
  if (!isUserExist) {
    throw new ApiError(404, 'Leader dose not exist');
  }
  const isAlreadyLeadingTeam = await prisma.team.findFirst({
    where: {
      leader_id: data.leader_id,
    },
  });
  if (isAlreadyLeadingTeam) {
    throw new ApiError(409, 'The user already leading a team');
  }
  const isAddressExist = await prisma.address.findFirst({
    where: {
      id: data.address_id,
    },
  });
  if (!isAddressExist) {
    throw new ApiError(404, 'Address dose not exist');
  }
  const isTeamExist = await prisma.team.findFirst({
    where: {
      OR: [
        {
          name: {
            equals: data.name,
            mode: 'insensitive',
          },
        },
      ],
    },
  });
  if (isTeamExist) {
    throw new ApiError(409, 'Team with this name already exists');
  }

  const isAccountClaimed = await prisma.userInfo.findFirst({
    where: {
      user_id: data.leader_id,
    },
  });
  if (isAccountClaimed?.id) {
    if (isAccountClaimed.address_id !== data.address_id) {
      throw new ApiError(409, 'User Address and team address must be same');
    }
    const result = await prisma.$transaction(async tx => {
      const createTeam = await tx.team.create({
        data: {
          ...data,
          member: 1,
        },
      });
      const findTeam = await tx.team.findFirst({
        where: {
          id: isAccountClaimed.team_id,
        },
      });
      const updateTeamMember = await tx.team.update({
        where: {
          id: isAccountClaimed.team_id,
        },
        data: {
          member: Number(findTeam?.member) - 1,
        },
      });
      if (!createTeam.id || !updateTeamMember.id) {
        throw new ApiError(500, 'Failed to create team');
      }
      const updateUserInfo = await tx.userInfo.updateMany({
        where: {
          user_id: data.leader_id,
        },
        data: {
          team_id: createTeam.id,
        },
      });
      if (!updateUserInfo.count) {
        throw new ApiError(500, 'Failed to create team');
      }
      return { message: 'Team created successfully' };
    });
    return result;
  } else {
    const result = await prisma.$transaction(async tx => {
      const createTeam = await tx.team.create({
        data: {
          ...data,
          member: 1,
        },
      });
      if (!createTeam.id) {
        throw new ApiError(500, 'Failed to create team');
      }
      const generateId = generateRandomID(5, data.leader_id);
      const updateUserInfo = await tx.userInfo.create({
        data: {
          address_id: data.address_id,
          virtual_id: generateId,
          user_id: data.leader_id,
          team_id: createTeam.id,
          is_in_team: true,
        },
      });
      if (!updateUserInfo) {
        throw new ApiError(500, 'Failed to create team');
      }
      return { message: 'Team created successfully' };
    });
    return result;
  }
};
const changeTeam = async (teamId: number, userId: number) => {
  const findUserInfo = await prisma.userInfo.findFirst({
    where: {
      user_id: userId,
    },
    include: {
      team_member: true,
    },
  });

  if (!findUserInfo) {
    throw new ApiError(404, 'User info not found');
  }
  const findTeamInfo = await prisma.team.findUnique({
    where: {
      id: teamId,
    },
  });
  if (!findTeamInfo) {
    throw new ApiError(404, 'Team info not found');
  }
  if (findTeamInfo.address_id !== findUserInfo.address_id) {
    throw new ApiError(409, 'Address must be same for user and team');
  }

  const isLeader = await prisma.team.findFirst({
    where: {
      leader_id: userId,
    },
  });

  if (isLeader) {
    throw new ApiError(
      409,
      'The user is leading a team. To change team user has to give leadership to another team member'
    );
  }
  await prisma.$transaction(async tx => {
    await tx.team.update({
      where: {
        id: findUserInfo.team_id,
      },
      data: {
        member: Number(findUserInfo.team_member.member) - 1,
      },
    });
    await tx.team.update({
      where: {
        id: findTeamInfo.id,
      },
      data: {
        member: Number(findTeamInfo.member) + 1,
      },
    });
    await tx.userInfo.update({
      where: {
        id: findUserInfo.id,
      },
      data: {
        team_id: teamId,
      },
    });
  });

  return { message: 'Successfully change the team' };
};

const changeLeader = async (leaderId: number, team_id: number) => {
  const result = await prisma.userInfo.findFirst({
    where: {
      user_id: leaderId,
    },
  });
  if (!result?.id) {
    throw new ApiError(404, 'User not found');
  }
  if (team_id !== result.team_id) {
    throw new ApiError(400, 'User is not in the same team .');
  }
  await prisma.team.update({
    where: {
      id: team_id,
    },
    data: {
      leader_id: leaderId,
    },
  });
  return { message: `Successfully changed the leader` };
};
const getTeams = async (pageNumber: number, filterOptions: IFilterOption) => {
  const meta = pagination({ page: pageNumber, limit: 10 });
  const { skip, take, orderBy, page } = meta;
  const queryOption: { [key: string]: any } = {};
  if (Object.keys(filterOptions).length) {
    const { search, ...restOptions } = filterOptions;

    if (search) {
      queryOption['OR'] = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          address: {
            address: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    Object.entries(restOptions).forEach(([field, value]) => {
      queryOption[field] = value;
    });
  }
  const result = await prisma.team.findMany({
    skip,
    take,
    orderBy,
    where: {
      ...queryOption,
      is_deleted: false,
    },
    select: {
      address_id: true,
      name: true,
      due_boxes: true,
      id: true,
      member: true,

      address: {
        select: {
          address: true,
          id: true,
          supplier: {
            select: {
              name: true,
              contact_no: true,
            },
          },
        },
      },
      leader: {
        select: {
          name: true,
          phone: true,
        },
      },
    },
  });
  const totalCount = await prisma.team.count({
    where: {
      ...queryOption,
    },
  });
  const totalPage = totalCount > take ? totalCount / Number(take) : 1;
  return {
    result,
    meta: { page: page, size: take, total: totalCount, totalPage },
  };
};

const getTeamInfoById = async (id: number) => {
  const userInfo = await prisma.userInfo.findMany({
    where: {
      team_id: id,
      is_claimed: true,
      user: {
        is_deleted: false,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  const result = await prisma.team.findUnique({
    where: {
      id,
      is_deleted: false,
    },
    include: {
      address: {
        select: {
          address: true,
          id: true,
          supplier: {
            select: {
              name: true,
              contact_no: true,
            },
          },
        },
      },
      leader: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });
  return { ...result, userInfo };
};

const updateDueBoxes = async (id: number, amount: number) => {
  const result = await prisma.team.update({
    where: {
      id,
      is_deleted: false,
    },
    data: {
      due_boxes: amount,
    },
  });
  return result;
};

const deliverOrder = async (id: number) => {
  const todayDate = formatLocalTime(new Date());
  const isValidOrder = await prisma.order.findFirst({
    where: {
      team_id: id,
      status: 'pending',
      delivery_date: {
        equals: todayDate.formatDefaultDateAndTime,
      },
    },
  });
  if (!isValidOrder) {
    throw new ApiError(400, 'Invalid order');
  }
  const result = await prisma.order.updateMany({
    where: {
      team_id: id,
      status: 'pending',
      delivery_date: {
        equals: todayDate.formatDefaultDateAndTime,
      },
    },
    data: {
      status: 'received',
    },
  });
  return result;
};

export const adminTeamService = {
  createTeam,
  changeTeam,
  changeLeader,
  getTeams,
  getTeamInfoById,
  updateDueBoxes,
  deliverOrder,
};
