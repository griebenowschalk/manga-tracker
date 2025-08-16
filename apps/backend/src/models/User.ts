import { prisma } from '../lib/prisma';
import { Role, type User } from '@prisma/client';
import { comparePassword, getUserSelect, hashPassword } from '../utils/auth';
import { RegisterInput, UpdateUserDetailsInput } from '../types/auth.types';
import { CreateUserInput, UpdateUserInput } from '../types/user.types';
import ErrorResponse from '../utils/errors';

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

  async update(
    data: UpdateUserDetailsInput | UpdateUserInput,
    isAdminUpdate?: boolean,
    currentUserId?: string
  ) {
    let userData = {};

    if ('role' in data && !isAdminUpdate) {
      throw new ErrorResponse('Cannot update role', 403);
    }

    if ('role' in data && isAdminUpdate && currentUserId === this.user.id) {
      if (data.role !== Role.ADMIN) {
        throw new ErrorResponse('Cannot demote yourself from admin role', 403);
      }
    }

    if ('role' in data && isAdminUpdate) {
      userData = {
        role: (data.role as Role) ?? Role.USER,
        passwordHash: data.password
          ? await hashPassword(data.password)
          : this.user.passwordHash,
      };
    }

    const user = await prisma.user.update({
      where: { id: this.user.id },
      data: {
        displayName: data.displayName ?? this.user.displayName,
        email: data.email ?? this.user.email,
        preferences: Object.assign(
          {},
          this.user.preferences ?? {},
          data.preferences ?? {}
        ),
        ...userData,
      },
    });
    return new UserModel(user);
  }

  async delete() {
    await prisma.user.delete({
      where: { id: this.user.id },
    });
  }

  // Static methods
  static async findByEmail(
    email: string,
    includePassword?: boolean
  ): Promise<UserModel | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        ...getUserSelect(),
        passwordHash: includePassword,
      },
    });
    return user ? new UserModel(user as User) : null;
  }

  static async findById(
    id: string,
    includePassword?: boolean
  ): Promise<UserModel | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { ...getUserSelect(), passwordHash: includePassword },
    });
    return user ? new UserModel(user as User) : null;
  }

  static async create(
    data: RegisterInput | CreateUserInput,
    isAdminCreate?: boolean
  ): Promise<UserModel> {
    let role = {};

    if ('role' in data && !isAdminCreate) {
      role = {
        role: data.role ?? Role.USER,
      };
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        displayName: data.displayName,
        passwordHash: await hashPassword(data.password),
        ...role,
      },
    });
    return new UserModel(user);
  }

  // Getter for the raw user data
  get data(): User {
    return this.user;
  }
}
