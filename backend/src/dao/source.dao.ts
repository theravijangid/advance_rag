import { Source, SourceType, SourceStatus } from '../models/source.model'

export interface CreateSourceDTO {
  workspaceId: string
  name: string
  type: SourceType
  storageKey?: string
  originalUrl?: string
  status?: SourceStatus
  metadata?: Record<string, any>
}

export class SourceDao {
  async createSource(data: CreateSourceDTO): Promise<Source> {
    return Source.create({
      workspaceId: data.workspaceId,
      name: data.name,
      type: data.type,
      storageKey: data.storageKey,
      originalUrl: data.originalUrl,
      status: data.status || 'QUEUED',
      metadata: data.metadata || {},
    })
  }

  async findSourcesByWorkspaceId(workspaceId: string): Promise<Source[]> {
    return Source.findAll({
      where: { workspaceId },
      order: [['createdAt', 'DESC']],
    })
  }

  async findSourceByIdAndWorkspace(id: string, workspaceId: string): Promise<Source | null> {
    return Source.findOne({
      where: { id, workspaceId },
    })
  }

  async updateSourceStatus(
    id: string,
    workspaceId: string,
    status: SourceStatus,
    metadata?: Record<string, any>
  ): Promise<Source | null> {
    const source = await this.findSourceByIdAndWorkspace(id, workspaceId)
    if (!source) return null

    const updatedMetadata = metadata
      ? { ...(source.metadata || {}), ...metadata }
      : source.metadata

    return source.update({
      status,
      metadata: updatedMetadata,
    })
  }

  async deleteSource(id: string, workspaceId: string): Promise<boolean> {
    const source = await this.findSourceByIdAndWorkspace(id, workspaceId)
    if (!source) return false
    await source.destroy()
    return true
  }
}

export default new SourceDao()
