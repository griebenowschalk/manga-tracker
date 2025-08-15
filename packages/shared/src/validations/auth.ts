import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email');

export const passwordSchema = z
  .string()
  .trim()
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,}$/,
    'Password must be at least 8 characters, include upper and lower case letters, a number, and a special character'
  );

export const displayNameSchema = z
  .string()
  .min(3, 'Display name must be at least 3 characters')
  .max(20, 'Display name must be less than 20 characters')
  .trim()
  .toLowerCase()
  .regex(/^[a-zA-Z0-9]+$/, 'Invalid display name');
