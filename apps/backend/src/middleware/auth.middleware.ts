import type { NextFunction, Response } from 'express';
import ErrorResponse from '../utils/errors';
import asyncHandler from './async.middleware';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import type { UserRequest } from '../types/query.types';
import { User } from '@prisma/client';

export const protect = asyncHandler(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new ErrorResponse('Unauthorized', 401));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;

      req.user = (await prisma.user.findUnique({
        where: {
          id: decoded.id,
        },
      })) as User;

      next();
    } catch {
      return next(new ErrorResponse('Unauthorized', 401));
    }
  }
);
