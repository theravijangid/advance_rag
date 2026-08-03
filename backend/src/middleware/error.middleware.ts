import { NextFunction, Request, Response } from 'express'

import logger from '../config/logger'
import { ForbiddenError } from '../errors/forbidden.error'

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ForbiddenError) {
    console.log('ForbiddenError')
    return res.status((err as ForbiddenError).status).json({
      status: 'error',
      message: err.message,
    })
  }
  logger.error(err.stack)

  res.status(500).json({
    message: 'An unexpected error occurred',
  })
}
