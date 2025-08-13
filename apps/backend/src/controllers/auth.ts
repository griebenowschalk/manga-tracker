import type { CookieOptions, Request, Response } from 'express';
import asyncHandler from '../middleware/async.middleware';
import authService from '../services/auth.service';
import ErrorResponse from '../utils/errors';
import { parseTimeString } from '../utils/auth';

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
    sameSite: 'lax',
    maxAge: parseTimeString(process.env.JWT_EXPIRE as string),
  };
  const refreshOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: parseTimeString(process.env.JWT_REFRESH_EXPIRE as string),
    path: '/api/v1/auth',
  };

  res
    .cookie('mt_access', accessToken, accessOptions)
    .cookie('mt_refresh', refreshToken, refreshOptions)
    .status(statusCode)
    .json({
      success: true,
      token: accessToken,
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

  res.clearCookie('mt_access');
  res.clearCookie('mt_refresh');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

export { register, refresh, logout };
