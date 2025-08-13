import type { Prisma } from '@prisma/client';
import type { RegisterInput as ZodRegisterInput } from '../validations/auth.validation';

export type ExtendedUserCreateInput = Omit<
  Prisma.UserCreateInput,
  'passwordHash'
> & {
  password?: string;
};

export type ExtendedUserCreateArgs = Omit<Prisma.UserCreateArgs, 'data'> & {
  data: ExtendedUserCreateInput;
};

export type RegisterInput = ZodRegisterInput;

export type JwtPayload = {
  id: string;
  jti?: string;
} | null;
