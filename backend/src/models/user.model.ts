import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  PrimaryKey,
  Default,
  Unique,
  AllowNull,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript'
import { Workspace } from './workspace.model'

@Table({
  tableName: 'users',
  timestamps: true,
  underscored: true,
})
export class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    field: 'id',
  })
  declare id: string

  @Unique
  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    field: 'clerk_id',
  })
  declare clerkId: string

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
    field: 'first_name',
  })
  declare firstName?: string

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
    field: 'last_name',
  })
  declare lastName?: string

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    field: 'email',
  })
  declare email: string

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

  @HasMany(() => Workspace, 'userId')
  declare workspaces: Workspace[]
}

export default User
