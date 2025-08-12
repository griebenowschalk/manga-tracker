import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import ErrorResponse from '../utils/errors';

export const validate =
  <T extends z.ZodTypeAny>(schema: T) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate body, query, and params based on schema structure
      if (schema instanceof z.ZodObject) {
        // If schema has specific fields, validate accordingly
        if ('body' in schema.shape) {
          await schema.shape.body.parseAsync(req.body);
        }
        if ('query' in schema.shape) {
          await schema.shape.query.parseAsync(req.query);
        }
        if ('params' in schema.shape) {
          await schema.shape.params.parseAsync(req.params);
        }
      } else {
        // Default: validate body
        await schema.parseAsync(req.body);
      }

      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(
          new ErrorResponse(error.message || 'Validation failed', 400)
        );
      }
      return next(new ErrorResponse('Validation failed', 400));
    }
  };
