import { Role, Source } from '@prisma/client';
import {
  displayNameSchema,
  emailSchema,
  passwordSchema,
} from '@shared/validations';
import { z } from 'zod';

export const createUserSchema = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(Role),
});

export const updateUserSchema = z.object({
  displayName: displayNameSchema.optional(),
  email: emailSchema.optional(),
  password: passwordSchema.optional(),
  preferences: z
    .object({
      source: z.enum(Source),
    })
    .optional(),
  role: z.enum(Role).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
