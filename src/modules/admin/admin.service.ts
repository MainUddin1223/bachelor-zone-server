import { PrismaClient } from '@prisma/client';
import ApiError from '../../utils/errorHandlers/apiError';
import { IClaimUser, ICreateTeam } from './admin.interface';
// import ApiError from '../../utils/errorHandlers/apiError';
// import { StatusCodes } from 'http-status-codes';

const prisma = new PrismaClient();

const addAddress = async (address: string) => {
  const isAddressExist = await prisma.address.findFirst({
    where: {
      address: {
        equals: address,
        mode: 'insensitive',
      },
    },
  });
  if (isAddressExist) {
    throw new ApiError(403, 'Address already exist');
  }
  const result = await prisma.address.create({
    data: { address },
  });
  return result;
};

const updateAddress = async (id: number, address: string) => {
  const result = await prisma.address.update({
    where: {
      id,
    },
    data: { address },
  });
  return result;
};

const createTeam = async (data: ICreateTeam) => {
  const isUserExist = await prisma.auth.findFirst({
    where: {
      id: data.leader_id,
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
  if (isAccountClaimed) {
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
      const updateUserInfo = await tx.userInfo.updateMany({
        where: {
          user_id: data.leader_id,
        },
        data: {},
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
      const updateUserInfo = await tx.userInfo.create({
        data: {
          address_id: data.address_id,
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

const claimUser = async (data: IClaimUser) => {
  const isClaimed = await prisma.userInfo.findFirst({
    where: {
      user_id: data.id,
    },
  });
  if (isClaimed) {
    if (isClaimed.is_claimed) {
      throw new ApiError(409, 'Account already claimed');
    } else {
      await prisma.userInfo.update({
        where: {
          id: isClaimed.id,
        },
        data: {
          is_claimed: true,
          Balance: Number(isClaimed.Balance) + data.balance,
        },
      });
    }
    return {
      message: 'Account updated successfully',
    };
  } else {
    await prisma.userInfo.create({
      data: {
        address_id: data.addressId,
        is_in_team: true,
        is_claimed: true,
        user_id: data.id,
        Balance: data.balance,
        team_id: data.teamId,
      },
    });
    return {
      message: 'Account updated successfully',
    };
  }
};

const changeTeam = async (teamId: number, userId: number) => {
  const findUserInfo = await prisma.userInfo.findFirst({
    where: {
      user_id: userId,
    },
  });
  if (!findUserInfo) {
    throw new ApiError(404, 'User info not found');
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
  await prisma.userInfo.update({
    where: {
      id: findUserInfo.id,
    },
    data: {
      team_id: teamId,
    },
  });
  return { message: 'Successfully change the team' };
};

const rechargeBalance = async (id: number, amount: number) => {
  const result = await prisma.$transaction(async tx => {
    const getUser = await prisma.userInfo.findFirst({
      where: {
        user_id: id,
      },
    });
    if (!getUser) {
      throw new ApiError(404, 'User info not found');
    }
    const recharge = await tx.userInfo.update({
      where: {
        id: getUser.id,
      },
      data: {
        Balance: amount,
      },
    });
    if (!recharge.Balance) {
      throw new ApiError(500, 'Recharge failed');
    }
    await tx.transaction.create({
      data: {
        transaction_type: 'deposit',
        amount,
        user_id: id,
      },
    });
    return { message: 'Recharge successful' };
  });
  return result;
};

export const adminService = {
  addAddress,
  updateAddress,
  createTeam,
  changeTeam,
  rechargeBalance,
  claimUser,
};
