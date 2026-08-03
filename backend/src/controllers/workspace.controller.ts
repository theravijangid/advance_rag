import { Request, Response } from 'express'
import ApiResponseHandler from '../helpers/api-response-handling.class'
import workspaceDao from '../dao/workspace.dao'
import Logger from '../config/logger'

export class WorkspaceController {
  /**
   * POST /api/v1/workspaces
   * Create a new workspace for authenticated user
   */
  async createWorkspace(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user
      if (!user) {
        ApiResponseHandler.handleUnauthorizedRequest(res, 'User not authenticated')
        return
      }

      const { name, description } = req.body
      const workspace = await workspaceDao.createWorkspace({
        userId: user.id,
        name,
        description,
      })

      ApiResponseHandler.handleSuccessResponse(
        res,
        'Workspace created successfully',
        workspace
      )
    } catch (error: any) {
      Logger.error(`Error creating workspace: ${error.message}`)
      ApiResponseHandler.handleErrorReponse(res, 'Failed to create workspace', error.message)
    }
  }

  /**
   * GET /api/v1/workspaces
   * List all workspaces owned by authenticated user
   */
  async listWorkspaces(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user
      if (!user) {
        ApiResponseHandler.handleUnauthorizedRequest(res, 'User not authenticated')
        return
      }

      const workspaces = await workspaceDao.findWorkspacesByUserId(user.id)

      ApiResponseHandler.handleSuccessResponse(
        res,
        'Workspaces fetched successfully',
        workspaces
      )
    } catch (error: any) {
      Logger.error(`Error listing workspaces: ${error.message}`)
      ApiResponseHandler.handleErrorReponse(res, 'Failed to list workspaces', error.message)
    }
  }

  /**
   * GET /api/v1/workspaces/:id
   * Get workspace details by ID
   */
  async getWorkspaceById(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user
      const { id } = req.params

      if (!user) {
        ApiResponseHandler.handleUnauthorizedRequest(res, 'User not authenticated')
        return
      }

      const workspace = await workspaceDao.findWorkspaceByIdAndUser(id, user.id)

      if (!workspace) {
        ApiResponseHandler.handleNotFoundRequest(res, 'Workspace not found')
        return
      }

      ApiResponseHandler.handleSuccessResponse(
        res,
        'Workspace details fetched successfully',
        workspace
      )
    } catch (error: any) {
      Logger.error(`Error fetching workspace: ${error.message}`)
      ApiResponseHandler.handleErrorReponse(res, 'Failed to fetch workspace', error.message)
    }
  }

  /**
   * PUT /api/v1/workspaces/:id
   * Update workspace details
   */
  async updateWorkspace(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user
      const { id } = req.params

      if (!user) {
        ApiResponseHandler.handleUnauthorizedRequest(res, 'User not authenticated')
        return
      }

      const workspace = await workspaceDao.updateWorkspace(id, user.id, req.body)

      if (!workspace) {
        ApiResponseHandler.handleNotFoundRequest(res, 'Workspace not found')
        return
      }

      ApiResponseHandler.handleSuccessResponse(
        res,
        'Workspace updated successfully',
        workspace
      )
    } catch (error: any) {
      Logger.error(`Error updating workspace: ${error.message}`)
      ApiResponseHandler.handleErrorReponse(res, 'Failed to update workspace', error.message)
    }
  }

  /**
   * DELETE /api/v1/workspaces/:id
   * Delete workspace by ID
   */
  async deleteWorkspace(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user
      const { id } = req.params

      if (!user) {
        ApiResponseHandler.handleUnauthorizedRequest(res, 'User not authenticated')
        return
      }

      const deleted = await workspaceDao.deleteWorkspace(id, user.id)

      if (!deleted) {
        ApiResponseHandler.handleNotFoundRequest(res, 'Workspace not found')
        return
      }

      ApiResponseHandler.handleSuccessResponse(
        res,
        'Workspace deleted successfully',
        { id }
      )
    } catch (error: any) {
      Logger.error(`Error deleting workspace: ${error.message}`)
      ApiResponseHandler.handleErrorReponse(res, 'Failed to delete workspace', error.message)
    }
  }
}

export default new WorkspaceController()
