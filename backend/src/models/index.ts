import { Sequelize } from 'sequelize-typescript'
import { User } from './user.model'
import { Workspace } from './workspace.model'
import { Source } from './source.model'
import { Conversation } from './conversation.model'
import { Message } from './message.model'

export { User, Workspace, Source, Conversation, Message }

const models = [User, Workspace, Source, Conversation, Message]

export const initModels = (sequelize: Sequelize): void => {
  sequelize.addModels(models)
}
