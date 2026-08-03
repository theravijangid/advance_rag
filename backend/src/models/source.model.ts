import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  PrimaryKey,
  Default,
  AllowNull,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript'
import type { Workspace as WorkspaceType } from './workspace.model'

export type SourceType = 'pdf' | 'website' | 'youtube' | 'vtt' | 'srt' | 'txt' | 'markdown'

export type SourceStatus =
  | 'UPLOADING'
  | 'QUEUED'
  | 'PARSING'
  | 'CHUNKING'
  | 'EMBEDDING'
  | 'READY'
  | 'FAILED'

@Table({
  tableName: 'sources',
  timestamps: true,
  underscored: true,
})
export class Source extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    field: 'id',
  })
  declare id: string

  @ForeignKey(() => require('./workspace.model').Workspace)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
    field: 'workspace_id',
  })
  declare workspaceId: string

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    field: 'name',
  })
  declare name: string

  @AllowNull(false)
  @Column({
    type: DataType.ENUM('pdf', 'website', 'youtube', 'vtt', 'srt', 'txt', 'markdown'),
    field: 'type',
  })
  declare type: SourceType

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
    field: 'storage_key',
  })
  declare storageKey?: string

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
    field: 'original_url',
  })
  declare originalUrl?: string

  @AllowNull(false)
  @Default('QUEUED')
  @Column({
    type: DataType.ENUM(
      'UPLOADING',
      'QUEUED',
      'PARSING',
      'CHUNKING',
      'EMBEDDING',
      'READY',
      'FAILED'
    ),
    field: 'status',
  })
  declare status: SourceStatus

  @AllowNull(true)
  @Column({
    type: DataType.JSONB,
    field: 'metadata',
  })
  declare metadata?: Record<string, any>

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  declare createdAt: Date

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    field: 'updated_at',
  })
  declare updatedAt: Date

  @BelongsTo(() => require('./workspace.model').Workspace, 'workspaceId')
  declare workspace: WorkspaceType
}

export default Source
