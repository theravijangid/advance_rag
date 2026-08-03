import 'reflect-metadata'
import app from './app'
import appConfig from './config/config'
import Logger from './config/logger'
import sequelize from './database'
import { initModels } from './models'
import { assertQdrantConnectionOk } from './config/qdrant'

const port = appConfig.port

async function assertDatabaseConnectionOk() {
  Logger.info('Checking database connection...')
  try {
    await sequelize.authenticate()
    initModels(sequelize)
    Logger.info('Database connection OK!')
  } catch (error:any) {
    Logger.error(`Unable to connect to the database: ${error.message}`)
    Logger.error(error)
    process.exit(1)
  }
}

async function init() {
  await assertDatabaseConnectionOk()
  await assertQdrantConnectionOk()

  Logger.info(`Starting Backend API on port ${port}...`)

  app.listen(port, () => {
    Logger.info(`Backend API server started on port ${port}.`)
  })
}

init()
