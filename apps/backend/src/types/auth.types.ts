import type { Prisma } from '@prisma/client';

export type ExtendedUserCreateInput = Omit<
  Prisma.UserCreateInput,
  'passwordHash'
> & {
  password?: string;
};

export type ExtendedUserCreateArgs = Omit<Prisma.UserCreateArgs, 'data'> & {
  data: ExtendedUserCreateInput;
};

export type RegisterInput = {
  displayName: string;
  email: string;
  password: string;
};
