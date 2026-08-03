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
import { Conversation } from './conversation.model'

@Table({
  tableName: 'messages',
  timestamps: true,
  underscored: true,
})
export class Message extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    field: 'id',
  })
  declare id: string

  @ForeignKey(() => Conversation)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
    field: 'conversation_id',
  })
  declare conversationId: string

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    field: 'role', // 'user', 'assistant', 'system'
  })
  declare role: string

  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
    field: 'content',
  })
  declare content: string

  @AllowNull(true)
  @Column({
    type: DataType.JSONB,
    field: 'citations',
  })
  declare citations: Record<string, any> | null

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

  @BelongsTo(() => Conversation, 'conversationId')
  declare conversation: Conversation
}

export default Message
