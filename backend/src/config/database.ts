import { config } from 'dotenv'
import { Dialect } from 'sequelize'

config()

interface DatabaseConfig {
  username: string
  password: string
  database: string
  host: string
  port: number
  dialect: Dialect
  dialectOptions: {
    ssl: {
        require: boolean;
        rejectUnauthorized: boolean;
    };
}
  pool: {
    max: number
    min: number
    acquire: number
    idle: number
  }
}

const DatabaseConfig: DatabaseConfig = {
  username: process.env.DB_USERNAME || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  host: process.env.DB_HOST || '',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  dialect: (process.env.DB_DIALECT as Dialect) || 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
  },
  pool: {
    max: parseInt(process.env.POOL_MAX || '5', 10),
    min: parseInt(process.env.POOL_MIN || '0', 10),
    acquire: parseInt(process.env.POOL_ACQUIRE || '30000', 10),
    idle: parseInt(process.env.POOL_IDLE || '10000', 10),
  },
}

export default DatabaseConfig
