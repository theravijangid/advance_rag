import { User } from '../models/user.model'
import 'express'

declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: User
  }
}
