import { z } from 'zod';

export const registerSchema = z.object({
  displayName: z.string().min(3).max(20).trim().toLowerCase(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/),
  password: z
    .string()
    .trim()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    ),
});

export type RegisterInput = z.infer<typeof registerSchema>;
