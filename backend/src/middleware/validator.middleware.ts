import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
import ApiResponseHandler from '../helpers/api-response-handling.class'

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const errorMsg = result.error.issues.map((i) => i.message).join(', ')
      ApiResponseHandler.handleBadRequest(res, 'Invalid workspace payload', errorMsg)
      return
    }
    req.body = result.data
    next()
  }
}

export default validate
