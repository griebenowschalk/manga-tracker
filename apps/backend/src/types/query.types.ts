import type { Request } from 'express';
import type { User } from '@prisma/client';

export interface UserRequest extends Request {
  user?: User;
}

export interface AdvancedResults<T> {
  success: boolean;
  count: number;
  pagination: {
    next?: { page: number; limit: number };
    prev?: { page: number; limit: number };
  };
  data: T[];
}

declare module 'express' {
  interface Response {
    advancedResults?: AdvancedResults<unknown>;
  }
}
