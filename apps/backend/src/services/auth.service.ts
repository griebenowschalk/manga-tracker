import { UserModel } from '../models/User';
import { JwtPayload, RegisterInput } from '../types/auth.types';
import ErrorResponse from '../utils/errors';
import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { LoginInput } from '../validations/auth.validation';

class AuthService {
  async register(data: RegisterInput) {
    const existing = await UserModel.findByEmail(data.email);

    if (existing) {
      throw new ErrorResponse('User already exists', 400);
    }

    const user = await UserModel.create(data);

    return user;
  }

  async login(data: LoginInput) {
    const user = await UserModel.findByEmail(data.email, true);

    if (!user || !(await user.validatePassword(data.password))) {
      throw new ErrorResponse('Invalid credentials', 401);
    }

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
    });

    if (!refreshToken || refreshToken.revoked) {
      await prisma.refreshToken.updateMany({
        where: { userId: decoded.id, revoked: false },
        data: { revoked: true },
      });
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

  async generateResetToken(userId: string) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.resetToken.create({
      data: { id: crypto.randomUUID(), userId, token: resetToken, expiresAt },
    });
    return resetToken;
  }

  async validateResetToken(token: string) {
    const resetToken = await prisma.resetToken.findFirst({
      where: { token, expiresAt: { gt: new Date() }, used: false },
    });

    if (!resetToken) {
      throw new ErrorResponse('Invalid reset token', 401);
    }

    await prisma.resetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    return resetToken.userId;
  }

  async updateUserPassword(
    userId: string,
    password: string,
    oldPassword?: string
  ) {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new ErrorResponse('User not found', 404);
    }

    if (oldPassword) {
      if (!(await user.validatePassword(oldPassword))) {
        throw new ErrorResponse('Invalid old password', 401);
      }
    }

    await user.updatePassword(password);

    // Revoke all refresh tokens for security
    await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }
}

export default new AuthService();
