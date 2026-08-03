import { Request, Response, NextFunction } from 'express'
import { getAuth } from '@clerk/express'
import ApiResponseHandler from '../helpers/api-response-handling.class'
import userDao from '../dao/user.dao'
import workspaceDao from '../dao/workspace.dao'
import Logger from '../config/logger'

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = getAuth(req)
    if (!auth || !auth?.userId) {
      ApiResponseHandler.handleUnauthorizedRequest(
        res,
        'Unauthorized: Valid authentication token required'
      )
      return
    }

    const clerkId = auth.userId
    const claims = (auth.sessionClaims as Record<string, any>) || {}
    const email = claims.email || `${clerkId}@user.clerk`
    const firstName = claims.firstName || ''
    const lastName = claims.lastName || ''

    const user = await userDao.findOrCreateUser(clerkId, {
      clerkId,
      email,
      firstName,
      lastName,
    })

    if (user.email !== email || user.firstName !== firstName || user.lastName !== lastName) {
      user.email = email
      user.firstName = firstName
      user.lastName = lastName
      await user.save()
    }

    req.user = user
    next()
  } catch (error: any) {
    Logger.error(`Authentication error: ${error.message}`)
    ApiResponseHandler.handleUnauthorizedRequest(res, 'Unauthorized: Invalid authentication state')
  }
}

export async function requireWorkspaceAccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      ApiResponseHandler.handleUnauthorizedRequest(res, 'Unauthorized: User not authenticated')
      return
    }

    const workspaceId = req.params.workspaceId || req.params.id || req.body.workspaceId
    if (!workspaceId) {
      ApiResponseHandler.handleBadRequest(res, 'Missing workspaceId parameter')
      return
    }

    const workspace = await workspaceDao.findWorkspaceByIdAndUser(workspaceId, req.user.id)

    if (!workspace) {
      ApiResponseHandler.handleForbiddenRequest(
        res,
        'Forbidden: You do not have access to this workspace'
      )
      return
    }

    next()
  } catch (error: any) {
    Logger.error(`Workspace authorization error: ${error.message}`)
    ApiResponseHandler.handleErrorReponse(res, 'Internal server error checking workspace authorization', error.message)
  }
}
