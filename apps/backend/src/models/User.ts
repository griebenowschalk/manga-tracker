import { prisma } from '../lib/prisma';
import type { User } from '@prisma/client';
import { comparePassword, hashPassword } from '../utils/auth';
import { RegisterInput } from '../types/auth.types';

export class UserModel {
  constructor(private user: User) {}

  // Instance methods
  async validatePassword(password: string): Promise<boolean> {
    return comparePassword(password, this.user.passwordHash);
  }

  async updatePassword(newPassword: string): Promise<User> {
    const updated = await prisma.user.update({
      where: { id: this.user.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });
    this.user = updated;
    return updated;
  }

  // Static methods
  static async findByEmail(email: string): Promise<UserModel | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? new UserModel(user) : null;
  }

  static async create(data: RegisterInput): Promise<UserModel> {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        displayName: data.displayName,
        passwordHash: await hashPassword(data.password),
      },
    });
    return new UserModel(user);
  }

  // Getter for the raw user data
  get data(): User {
    return this.user;
  }
}
