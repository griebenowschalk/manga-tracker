import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;

const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const paginatedResults = (
  model: keyof typeof prisma,
  options?: {
    select?: Record<string, boolean>;
    where?: Record<string, unknown>;
    orderBy?: Record<string, unknown>;
    include?: Record<string, unknown>;
  }
): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string, 10) || DEFAULT_PAGE;
    const limit = parseInt(req.query.limit as string, 10) || DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    // Build query from request
    const { select, sort, ...filters } = req.query;

    const where = Object.entries(filters).reduce(
      (acc: Record<string, unknown>, [key, value]) => {
        if (value !== undefined && value !== '') {
          acc[key] = value;
        }
        return acc;
      },
      {}
    );

    const selectClause = select
      ? (select as string)
          .split(',')
          .reduce((acc: Record<string, boolean>, field: string) => {
            acc[field.trim()] = true;
            return acc;
          }, {})
      : undefined;

    const orderBy = sort
      ? (sort as string).split(',').map((field: string) => {
          const trimmed = field.trim();
          return trimmed.startsWith('-')
            ? { [trimmed.slice(1)]: 'desc' as const }
            : { [trimmed]: 'asc' as const };
        })
      : [{ createdAt: 'desc' as const }];

    // Build the query object
    const queryObj: Prisma.UserFindManyArgs = {
      where: { ...where, ...options?.where },
      orderBy: options?.orderBy || orderBy,
      include: options?.include,
      skip,
      take: limit,
    };

    // Only add select if it's provided and has truthy values
    if (selectClause && Object.keys(selectClause).length > 0) {
      queryObj.select = selectClause;
    } else if (options?.select && Object.keys(options.select).length > 0) {
      queryObj.select = options.select;
    }

    // Execute query
    const [results, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma[model] as any).findMany(queryObj),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma[model] as any).count({
        where: { ...where, ...options?.where },
      }),
    ]);

    const pagination = {
      next: skip + limit < total ? { page: page + 1, limit } : undefined,
      prev: page > 1 ? { page: page - 1, limit } : undefined,
    };

    res.advancedResults = {
      success: true,
      count: results.length,
      pagination,
      data: results,
    };

    next();
  };
};

export { asyncHandler, paginatedResults };
