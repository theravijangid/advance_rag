import path from 'path'

import { Sequelize } from 'sequelize-typescript'

import config from '../config/database'
import logger from '../config/logger'

logger.info("DB pool config : ",config.pool)
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect || 'postgres',
  pool: config.pool,
  //models: [path.join(__dirname, '../models')]
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
})

export default sequelize
