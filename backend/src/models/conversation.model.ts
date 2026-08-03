import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  PrimaryKey,
  Default,
  AllowNull,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript'
import type { Workspace as WorkspaceType } from './workspace.model'
import { Message } from './message.model'

@Table({
  tableName: 'conversations',
  timestamps: true,
  underscored: true,
})
export class Conversation extends Model {
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
    field: 'title',
  })
  declare title: string

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

  @HasMany(() => Message, 'conversationId')
  declare messages: Message[]
}

export default Conversation
