import { PrismaClient, TransactionType } from '@prisma/client';
import ApiError from '../../utils/errorHandlers/apiError';
import { IClaimUser, ICreateTeam, IListedExpenses } from './admin.interface';
import { minAmountForClaim, serviceFee, tiffinBoxCost } from './admin.constant';
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
  if (minAmountForClaim > data.balance) {
    throw new ApiError(402, `Minimum balance should be ${minAmountForClaim}`);
  }

  const isClaimed = await prisma.userInfo.findFirst({
    where: {
      user_id: data.id,
    },
  });

  const getTeam = await prisma.team.findUnique({
    where: {
      id: data.teamId,
    },
  });

  const getAddress = await prisma.address.findUnique({
    where: {
      id: data.addressId,
    },
  });

  if (!getAddress || !getTeam) {
    throw new ApiError(404, 'Team or Address not found');
  }

  const includeMember = Number(getTeam.member) + 1;

  const calculateBalance = data.balance - (tiffinBoxCost + serviceFee);
  const transaction_type: TransactionType = 'deposit';

  const transactions = [
    {
      transaction_type,
      amount: tiffinBoxCost,
      description: 'Tiffin box cost',
      user_id: data.id,
    },
    {
      transaction_type,
      amount: serviceFee,
      description: 'Service fee',
      user_id: data.id,
    },
    {
      transaction_type,
      amount: calculateBalance,
      description: 'Balance recharge',
      user_id: data.id,
    },
  ];

  if (isClaimed) {
    if (isClaimed.is_claimed) {
      throw new ApiError(409, 'Account already claimed');
    } else {
      await prisma.$transaction(async tx => {
        const claimUser = await tx.userInfo.update({
          where: {
            id: isClaimed.id,
          },
          data: {
            is_claimed: true,
            Balance: Number(isClaimed.Balance) + data.balance,
          },
        });
        if (claimUser.is_claimed) {
          await tx.transaction.createMany({
            data: transactions,
          });

          await tx.team.update({
            where: {
              id: data.teamId,
            },
            data: {
              member: includeMember,
            },
          });
        }
        return {
          message: 'Account claimed successfully',
        };
      });
    }
  } else {
    await prisma.$transaction(async tx => {
      const updateUser = await tx.userInfo.create({
        data: {
          address_id: data.addressId,
          is_in_team: true,
          is_claimed: true,
          user_id: data.id,
          Balance: data.balance,
          team_id: data.teamId,
        },
      });
      if (!updateUser.id) {
        throw new ApiError(500, 'Failed to claimed user');
      } else {
        await tx.transaction.createMany({
          data: transactions,
        });
        await tx.team.update({
          where: {
            id: data.teamId,
          },
          data: {
            member: includeMember,
          },
        });
      }
      return {
        message: 'Account updated successfully',
      };
    });
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

const rechargeBalance = async (id: number, balance: number) => {
  const transaction_type: TransactionType = 'deposit';

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
        Balance: balance,
      },
    });
    if (!recharge.Balance) {
      throw new ApiError(500, 'Recharge failed');
    }
    await tx.transaction.create({
      data: {
        transaction_type,
        description: 'Balance recharge',
        amount: balance,
        user_id: id,
      },
    });
    return { message: 'Recharge successful' };
  });

  return result;
};

const refundBalance = async (id: number, balance: number) => {
  const transaction_type: TransactionType = 'refund';

  const result = await prisma.$transaction(async tx => {
    const getUser = await prisma.userInfo.findFirst({
      where: {
        user_id: id,
      },
    });
    if (!getUser) {
      throw new ApiError(404, 'User info not found');
    }

    const currentBalance = Number(getUser.Balance);

    if (balance > currentBalance) {
      throw new ApiError(409, 'Refund balance is getter than current balance');
    }

    const refund = await tx.userInfo.update({
      where: {
        id: getUser.id,
      },
      data: {
        Balance: currentBalance - balance,
      },
    });
    if (!refund.Balance) {
      throw new ApiError(500, 'Recharge failed');
    }
    await tx.transaction.create({
      data: {
        transaction_type,
        description: 'Refund recharge',
        amount: balance,
        user_id: id,
      },
    });
    return { message: 'Refund successful' };
  });

  return result;
};

const listExpenses = async (data: IListedExpenses) => {
  const result = await prisma.expenses.create({
    data,
  });
  if (!result.id) {
    throw new ApiError(500, 'Failed to list the expenses');
  }
  return { message: 'Expenses listed successfully' };
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

export const adminService = {
  addAddress,
  updateAddress,
  createTeam,
  changeTeam,
  rechargeBalance,
  claimUser,
  refundBalance,
  listExpenses,
  changeLeader,
};
