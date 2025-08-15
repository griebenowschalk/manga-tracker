import { z } from 'zod';
import { displayNameSchema, emailSchema, passwordSchema } from '@manga/shared';
import { Source } from '@prisma/client';

export const registerSchema = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const updateUserDetailsSchema = z.object({
  displayName: displayNameSchema.optional(),
  email: emailSchema.optional(),
  preferences: z
    .object({
      source: z.enum(Source),
    })
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserDetailsInput = z.infer<typeof updateUserDetailsSchema>;
