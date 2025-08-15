import type { CookieOptions, Request, Response } from 'express';
import asyncHandler from '../middleware/async.middleware';
import authService from '../services/auth.service';
import ErrorResponse from '../utils/errors';
import { parseTimeString } from '../utils/auth';
import { UserModel } from '../models/User';
import { UserRequest } from '../types/query.types';
import { sendPasswordResetEmail } from '../utils/emails';

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

/**
 * @description Forgot password
 * @route POST /api/v1/auth/forgot-password
 * @access Public
 */
const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await UserModel.findByEmail(email);

  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  const resetToken = await authService.generateResetToken(user.data.id);

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/reset-password/${resetToken}`;

  try {
    await sendPasswordResetEmail(user.data.email, resetUrl);

    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    console.log(err);
    throw new ErrorResponse('Email could not be sent', 500);
  }
});

/**
 * @description Reset password
 * @route POST /api/v1/auth/reset-password/:token
 * @access Public
 */
const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  const userId = await authService.validateResetToken(token);

  await authService.updateUserPassword(userId, password);

  res.status(200).json({ success: true, data: 'Password reset successfully' });
});

/**
 * @description Update password
 * @route PUT /api/v1/auth/update-password
 * @access Private
 */
const updatePassword = asyncHandler(async (req: UserRequest, res: Response) => {
  const { password } = req.body;
  const userId = req.user?.id;

  await authService.updateUserPassword(userId || '', password);

  res
    .status(200)
    .json({ success: true, data: 'Password updated successfully' });
});

/**
 * @description Update user details
 * @route PUT /api/v1/auth/update-details
 * @access Private
 */
const updateDetails = asyncHandler(async (req: UserRequest, res: Response) => {
  const { displayName, email, preferences } = req.body;
  const userId = req.user?.id;
  await authService.updateUserDetails(userId || '', {
    displayName,
    email,
    preferences,
  });

  res.status(200).json({
    success: true,
    data: 'User details updated successfully',
  });
});

export {
  register,
  login,
  refresh,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
  updateDetails,
};
