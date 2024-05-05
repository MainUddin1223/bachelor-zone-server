import { PrismaClient } from '@prisma/client';
import { IFilterOption } from '../../utils/helpers/interface';
import { pagination } from '../../utils/helpers/pagination';

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
export const adminUserService = { getUsers };
