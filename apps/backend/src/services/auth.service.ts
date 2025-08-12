import { UserModel } from '../models/User';
import { RegisterInput } from '../types/auth.types';

class AuthService {
  async register(data: RegisterInput) {
    const user = await UserModel.create(data);

    return user;
  }
}

export default new AuthService();
