import { asyncHandler } from '../middleware/async.middleware';
import { Request, Response } from 'express';

/**
 * @description Get all users
 * @route GET /api/v1/users
 * @access Private/Admin
 */
const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json(res.advancedResults);
});
export { getUsers };
