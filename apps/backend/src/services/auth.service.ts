import { UserModel } from '../models/User';
import { JwtPayload, RegisterInput } from '../types/auth.types';
import ErrorResponse from '../utils/errors';
import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';

class AuthService {
  async register(data: RegisterInput) {
    const existing = await UserModel.findByEmail(data.email);

    if (existing) {
      throw new ErrorResponse('User already exists', 400);
    }

    const user = await UserModel.create(data);

    return user;
  }

  async generateTokens(userId: string) {
    const jti = crypto.randomUUID();
    const accessToken = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET as string,
      {
        expiresIn: process.env.JWT_EXPIRE as string,
      } as SignOptions
    );
    const refreshToken = jwt.sign(
      { id: userId, jti },
      process.env.JWT_REFRESH_SECRET as string,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRE as string,
      } as SignOptions
    );

    await prisma.refreshToken.create({
      data: {
        id: jti,
        revoked: false,
        userId,
      },
    });

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string) {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    if (!decoded?.id) {
      throw new ErrorResponse('Invalid access token', 401);
    }

    return decoded;
  }

  async verifyRefreshToken(token: string) {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET as string
    ) as JwtPayload;

    if (!decoded?.jti) {
      throw new ErrorResponse('Invalid refresh token', 401);
    }

    const refreshToken = await prisma.refreshToken.findUnique({
      where: { id: decoded?.jti },
      include: {
        user: true,
      },
    });

    if (!refreshToken || refreshToken.revoked) {
      throw new ErrorResponse('Invalid refresh token', 401);
    }

    return refreshToken;
  }

  async revokeRefreshToken(jti: string) {
    await prisma.refreshToken.update({
      where: { id: jti },
      data: { revoked: true },
    });
  }
}

export default new AuthService();
