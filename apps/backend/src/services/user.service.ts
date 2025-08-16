import { UserModel } from '../models/User';
import { CreateUserInput, UpdateUserInput } from '../types/user.types';
import ErrorResponse from '../utils/errors';

class UserService {
  async createUser(data: CreateUserInput) {
    const user = await UserModel.findByEmail(data.email);

    if (user) {
      throw new ErrorResponse('User already exists', 400);
    }

    return await UserModel.create(data, true);
  }

  async updateUser(
    userId: string,
    data: UpdateUserInput,
    currentUserId: string
  ) {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new ErrorResponse('User not found', 404);
    }

    return await user.update(data, true, currentUserId);
  }

  async deleteUser(userId: string) {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new ErrorResponse('User not found', 404);
    }

    await user.delete();
  }
}

export default new UserService();
