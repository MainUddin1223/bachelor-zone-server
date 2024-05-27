import { PrismaClient, TransactionType } from '@prisma/client';
import { IFilterOption } from '../../utils/helpers/interface';
import { pagination } from '../../utils/helpers/pagination';
import ApiError from '../../utils/errorHandlers/apiError';
import { IClaimUser } from './admin.interface';
import { registrationFee, tiffinBoxCost } from './admin.constant';
import { generateRandomID } from '../../utils/helpers/helpers';

const prisma = new PrismaClient();

const getUsers = async (
  status: any,
  pageNumber: number,
  filterOptions: IFilterOption
) => {
  const meta = pagination({ page: pageNumber, limit: 20 });
  const { skip, take, page } = meta;
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
          phone: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    Object.entries(restOptions).forEach(([field, value]) => {
      queryOption[field] = value;
    });
  }

  const users = await prisma.auth.findMany({
    where: {
      ...queryOption,
      is_deleted: false,
      role: 'user',
    },
    include: {
      UserInfo: {
        include: {
          address: true,
          team_member: true,
        },
      },
    },
  });

  const usersData = users
    .filter(user => {
      const isClaimedUser = user?.UserInfo[0]?.is_claimed;

      if (status === 'all') {
        return true; // Include all users
      } else if (status === 'claimed' && isClaimedUser) {
        return true; // Include claimed users
      } else if (status === 'unclaimed' && !isClaimedUser) {
        return true; // Include unclaimed users
      }

      return false; // Exclude users that don't match the criteria
    })
    .map(user => {
      const id = user?.id;
      const userInfo = user?.UserInfo[0];
      const address = userInfo?.address?.address || 'Not selected';
      const balance = userInfo?.Balance || 0;
      const status = userInfo?.is_claimed || false;
      const teamName = userInfo?.team_member?.name || 'Not selected';

      return {
        id,
        balance,
        name: user?.name,
        phone: user?.phone,
        status,
        address,
        teamName,
      };
    });

  const totalCount = usersData.length;
  const result = usersData.slice(skip, skip + 20);
  const totalPage =
    totalCount > take ? Math.ceil(totalCount / Number(take)) : 1;
  return {
    result,
    meta: { page, size: take, total: totalCount, totalPage },
  };
};

const getUserById = async (id: number) => {
  const result = await prisma.auth.findUnique({
    where: {
      id,
      is_deleted: false,
      role: 'user',
    },
    select: {
      name: true,
      phone: true,
      UserInfo: {
        select: {
          Balance: true,
          is_claimed: true,
          address: true,
          id: true,
          team_member: {
            select: {
              name: true,
              id: true,
              leader: {
                select: {
                  name: true,
                  phone: true,
                },
              },
              address: {
                select: {
                  address: true,
                  id: true,
                  Team: {
                    select: {
                      id: true,
                      address_id: true,
                      name: true,
                      member: true,
                      leader: {
                        select: {
                          name: true,
                          phone: true,
                        },
                      },
                      address: {
                        select: {
                          address: true,
                          id: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      Order: {
        take: 15,
        select: {
          delivery_date: true,
          status: true,
        },
      },
      Transaction: {
        take: 15,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          date: true,
          transaction_type: true,
          amount: true,
          description: true,
        },
      },
    },
  });
  return {
    ...result,
    teams: result?.UserInfo[0]?.team_member,
    UserInfo: result?.UserInfo[0],
  };
};

const getUnclaimedUser = async (id: number) => {
  const result = await prisma.userInfo.findFirst({
    where: {
      user_id: id,
      is_claimed: false,
    },
    select: {
      team_member: {
        select: {
          id: true,
          name: true,
          leader: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      },
      user: {
        select: {
          name: true,
          phone: true,
        },
      },
      address: {
        select: {
          address: true,
          id: true,
        },
      },
      Balance: true,
    },
  });
  if (result) {
    return result;
  } else {
    const authInfo = await prisma.auth.findUnique({
      where: {
        id,
      },
      select: {
        name: true,
        phone: true,
      },
    });
    const address = await prisma.address.findMany({
      select: {
        id: true,
        address: true,
        Team: {
          where: {
            is_deleted: false,
          },
          select: {
            id: true,
            name: true,
            leader: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });
    return { authInfo, address };
  }
};

const claimUser = async (data: IClaimUser) => {
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
  if (getAddress.id !== getTeam.address_id) {
    throw new ApiError(409, 'User Address and team address must be same');
  }

  const includeMember = Number(getTeam.member) + 1;

  const calculateBalance = data.balance - (tiffinBoxCost + registrationFee);
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
      amount: registrationFee,
      description: 'Registration fee',
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
            Balance: calculateBalance,
          },
        });
        if (claimUser.is_claimed) {
          await tx.transaction.createMany({
            data: transactions,
          });
        }
        return {
          message: 'Account claimed successfully',
        };
      });
    }
  } else {
    await prisma.$transaction(async tx => {
      const virtual_id = generateRandomID(5, data.id);
      const updateUser = await tx.userInfo.create({
        data: {
          virtual_id,
          address_id: data.addressId,
          is_in_team: true,
          is_claimed: true,
          user_id: data.id,
          Balance: calculateBalance,
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

const getUserInfo = async (number: string) => {
  const getUserInfo = await prisma.auth.findFirst({
    where: {
      phone: number,
      is_deleted: false,
    },
    select: {
      id: true,
      phone: true,
      name: true,
      UserInfo: {
        select: {
          address_id: true,
        },
      },
    },
  });
  if (!getUserInfo) {
    throw new ApiError(404, 'User not found');
  }
  if (!getUserInfo?.UserInfo.length) {
    const addresses = await prisma.address.findMany({
      select: {
        address: true,
        id: true,
      },
    });
    return {
      phone: getUserInfo?.phone,
      id: getUserInfo.id,
      name: getUserInfo?.name,
      addresses,
      isSavedAddress: false,
    };
  } else {
    const addresses = await prisma.address.findFirst({
      where: {
        id: getUserInfo.UserInfo[0].address_id,
      },
      select: {
        address: true,
        id: true,
      },
    });
    return {
      phone: getUserInfo?.phone,
      name: getUserInfo?.name,
      id: getUserInfo.id,
      addresses: [addresses],
      isSavedAddress: true,
    };
  }
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
      address: true,
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

const deleteUser = async (id: number) => {
  const getUser = await prisma.auth.findFirst({
    where: {
      id,
      is_deleted: false,
    },
  });
  if (!getUser) {
    throw new ApiError(404, 'User not found');
  } else {
    const result = await prisma.auth.update({
      where: {
        id,
      },
      data: {
        is_deleted: true,
        phone: getUser.phone + new Date(),
      },
    });
    return result;
  }
};
export const adminUserService = {
  getUsers,
  getUserById,
  getUnclaimedUser,
  claimUser,
  getUserInfo,
  getTeamInfoById,
  deleteUser,
};
