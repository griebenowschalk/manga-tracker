import type { CookieOptions, Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import authService from '../services/auth.service';
import { UserModel } from '../models/User';

// Get token from model, create cookie and send response
const sendTokenResponse = (
  user: UserModel,
  statusCode: number,
  res: Response
) => {
  const token = user.getSignedJwtToken();
  const options: CookieOptions = {
    expires: new Date(
      Date.now() +
        parseInt(process.env.JWT_COOKIE_EXPIRE as string) * 24 * 60 * 60 * 1000 // Convert to milliseconds
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
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

  sendTokenResponse(user, 200, res);
});

export { register };
