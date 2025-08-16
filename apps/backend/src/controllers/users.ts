import { asyncHandler } from '../middleware/async.middleware';
import { NextFunction, Request, Response } from 'express';
import { UserModel } from '../models/User';
import ErrorResponse from '../utils/errors';
import userService from '../services/user.service';
import { UserRequest } from '../types/query.types';

/**
 * @description Get all users
 * @route GET /api/v1/users
 * @access Private/Admin
 */
const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json(res.advancedResults);
});

/**
 * @description Get a user
 * @route GET /api/v1/users/:id
 * @access Private/Admin
 */
const getUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserModel.findById(req.params.id);

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  }
);

/**
 * @description Create a user
 * @route POST /api/v1/users
 * @access Private/Admin
 */
const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);

  res.status(201).json({
    success: true,
    data: user,
  });
});

/**
 * @description Update a user
 * @route PUT /api/v1/users/:id
 * @access Private/Admin
 */
const updateUser = asyncHandler(async (req: UserRequest, res: Response) => {
  const user = await userService.updateUser(
    req.params.id,
    req.body,
    req.user?.id || ''
  );
  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * @description Delete a user
 * @route DELETE /api/v1/users/:id
 * @access Private/Admin
 */
const deleteUser = asyncHandler(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    if (req.user?.id === req.params.id) {
      return next(new ErrorResponse('Cannot delete yourself', 403));
    }

    await userService.deleteUser(req.params.id);

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);

export { getUsers, getUser, createUser, updateUser, deleteUser };
