import type { CookieOptions, Request, Response } from 'express';
import asyncHandler from '../middleware/async.middleware';
import authService from '../services/auth.service';
import ErrorResponse from '../utils/errors';
import { parseTimeString } from '../utils/auth';
import { UserModel } from '../models/User';
import { UserRequest } from '../types/query.types';

// Get token from model, create cookie and send response
const sendTokenResponse = async (
  userId: string,
  statusCode: number,
  res: Response
) => {
  const { accessToken, refreshToken } =
    await authService.generateTokens(userId);

  const accessOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: parseTimeString(process.env.JWT_EXPIRE as string),
  };
  const refreshOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: parseTimeString(process.env.JWT_REFRESH_EXPIRE as string),
    path: '/api/v1/auth',
  };

  res
    .cookie('mt_access', accessToken, accessOptions)
    .cookie('mt_refresh', refreshToken, refreshOptions)
    .status(statusCode)
    .json({
      success: true,
      message: 'Logged in successfully',
    });
};

/**
 * @description Register user
 * @route POST /api/v1/auth/register
 * @access Public
 */
const register = asyncHandler(async (req: Request, res: Response) => {
  const { displayName, email, password } = req.body;

  const user = await authService.register({
    displayName,
    email,
    password,
  });

  sendTokenResponse(user.data.id, 200, res);
});

/**
 * @description Login user
 * @route POST /api/v1/auth/login
 * @access Public
 */
const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await authService.login({ email, password });

  sendTokenResponse(user.data.id, 200, res);
});

/**
 * @description Refresh access token
 * @route POST /api/v1/auth/refresh
 * @access Public
 */
const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { mt_refresh: refreshToken } = req.cookies;
  const token = await authService.verifyRefreshToken(refreshToken);

  if (!token) {
    throw new ErrorResponse('Invalid refresh token', 401);
  }

  await authService.revokeRefreshToken(token.id);
  sendTokenResponse(token.userId, 200, res);
});

/**
 * @description Logout user
 * @route POST /api/v1/auth/logout
 * @access Public
 */
const logout = asyncHandler(async (req: Request, res: Response) => {
  const { mt_refresh: refreshToken } = req.cookies;
  const token = await authService.verifyRefreshToken(refreshToken);
  await authService.revokeRefreshToken(token.id);

  res.clearCookie('mt_access', { path: '/' });
  res.clearCookie('mt_refresh', { path: '/api/v1/auth' });
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * @description Get Me
 * @route GET /api/v1/auth/me
 * @access Private
 */
const getMe = asyncHandler(async (req: UserRequest, res: Response) => {
  const user = await UserModel.findByEmail(req.user?.email as string);
  res.status(200).json({
    success: true,
    data: user,
  });
});

export { register, login, refresh, logout, getMe };
