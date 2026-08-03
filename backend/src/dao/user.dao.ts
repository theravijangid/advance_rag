import { User } from '../models/user.model'

export class UserDao {
  async findOrCreateUser(
    clerkId: string,
    defaults: { clerkId: string; email: string; firstName?: string; lastName?: string }
  ): Promise<User> {
    const [user] = await User.findOrCreate({
      where: { clerkId },
      defaults,
    })
    return user
  }

  async findUserByClerkId(clerkId: string): Promise<User | null> {
    return User.findOne({ where: { clerkId } })
  }

  async findUserById(id: string): Promise<User | null> {
    return User.findByPk(id)
  }
}

export default new UserDao()
