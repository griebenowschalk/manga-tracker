import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import ErrorResponse from '../utils/errors';

type ValidationTarget = 'body' | 'query' | 'params';

export const validate =
  <T extends z.ZodTypeAny>(schema: T, targets: ValidationTarget[] = ['body']) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      for (const target of targets) {
        await schema.parseAsync(req[target]);
      }
      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        return next(new ErrorResponse(errorMessage, 400));
      }
      return next(new ErrorResponse('Validation failed', 400));
    }
  };

// Convenience functions for common cases
export const validateBody = <T extends z.ZodTypeAny>(schema: T) =>
  validate(schema, ['body']);

export const validateQuery = <T extends z.ZodTypeAny>(schema: T) =>
  validate(schema, ['query']);

export const validateParams = <T extends z.ZodTypeAny>(schema: T) =>
  validate(schema, ['params']);
