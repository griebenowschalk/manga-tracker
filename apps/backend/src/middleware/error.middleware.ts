/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from '@prisma/client';
import ErrorResponse from '../utils/errors';
import type { NextFunction, Request, Response } from 'express';

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  //Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': // Unique constraint violation
        error = new ErrorResponse('Invalid input provided', 400);
        break;
      case 'P2025': // Record not found
        error = new ErrorResponse('Record not found', 404);
        break;
      default:
        error = new ErrorResponse('Database error', 500);
        break;
    }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
  });
};

export default errorHandler;
