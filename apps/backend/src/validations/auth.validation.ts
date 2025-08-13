import { z } from 'zod';
import { emailSchema, passwordSchema } from '@manga/shared';

export const registerSchema = z.object({
  displayName: z
    .string()
    .min(3, 'Display name must be at least 3 characters')
    .max(20, 'Display name must be less than 20 characters')
    .trim()
    .toLowerCase()
    .regex(/^[a-zA-Z0-9]+$/, 'Invalid display name'),
  email: emailSchema,
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
