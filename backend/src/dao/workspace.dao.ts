import { Workspace } from '../models/workspace.model'
import { Source } from '../models/source.model'
import { Conversation } from '../models/conversation.model'

export interface CreateWorkspaceDTO {
  userId: string
  name: string
  description?: string
}

export interface UpdateWorkspaceDTO {
  name?: string
  description?: string
}

export class WorkspaceDao {
  async createWorkspace(data: CreateWorkspaceDTO): Promise<Workspace> {
    return Workspace.create({
      userId: data.userId,
      name: data.name,
      description: data.description,
    })
  }

  async findWorkspacesByUserId(userId: string): Promise<Workspace[]> {
    return Workspace.findAll({
      where: { userId },
      include: ['sources', 'conversations'],
      order: [['createdAt', 'DESC']],
    })
  }

  async findWorkspaceByIdAndUser(id: string, userId: string): Promise<Workspace | null> {
    return Workspace.findOne({
      where: { id, userId },
      include: ['sources', 'conversations'],
      order: [['conversations', 'createdAt', 'DESC']],
    })
  }

  async updateWorkspace(
    id: string,
    userId: string,
    data: UpdateWorkspaceDTO
  ): Promise<Workspace | null> {
    const workspace = await this.findWorkspaceByIdAndUser(id, userId)
    if (!workspace) return null
    return workspace.update(data)
  }

  async deleteWorkspace(id: string, userId: string): Promise<boolean> {
    const workspace = await this.findWorkspaceByIdAndUser(id, userId)
    if (!workspace) return false
    await workspace.destroy()
    return true
  }
}

export default new WorkspaceDao()
