import type { NextFunction, Request, Response } from 'express';
import ErrorResponse from '../utils/errors';
import { asyncHandler } from './async.middleware';
import { prisma } from '../lib/prisma';
import type { UserRequest } from '../types/query.types';
import { Role, User } from '@prisma/client';
import authService from '../services/auth.service';

const protect = asyncHandler(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.mt_access) {
      token = req.cookies.mt_access;
    }

    if (!token) {
      return next(new ErrorResponse('Unauthorized', 401));
    }

    try {
      const decoded = await authService.verifyAccessToken(token);

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

/**
 *  CSRF protection cause SameSite=none
 *  Require x-csrf-token header to match cookie on state-changing routes
 */

const requireCsrf = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      if (req.headers['x-csrf-token'] !== req.cookies['XSRF-TOKEN']) {
        return next(new ErrorResponse('Bad CSRF token', 403));
      }
    }
    next();
  }
);

const authorize = (...roles: Role[]) => {
  return (req: UserRequest, _res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role as Role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user?.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

export { protect, requireCsrf, authorize };
