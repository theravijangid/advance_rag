import { Request, Response } from 'express'
import ApiResponseHandler from '../helpers/api-response-handling.class'
import sourceDao from '../dao/source.dao'
import filebaseStorageService from '../services/filebase-storage.service'
import Logger from '../config/logger'
import { SourceType } from '../models/source.model'
import { v4 as uuidv4 } from 'uuid'
import { ingestionQueue } from '../services/queue/inngest.adapter'
import sequelize from '../database'

export class SourceController {
  async uploadSourceFile(req: Request, res: Response): Promise<void> {
    const transaction = await sequelize.transaction()
    try {
      const workspaceId = req.params.workspaceId || req.params.id
      const file = req.file

      if (!file) {
        await transaction.rollback()
        ApiResponseHandler.handleBadRequest(res, 'No file uploaded')
        return
      }

      const originalName = file.originalname
      const ext = originalName.substring(originalName.lastIndexOf('.')).toLowerCase()

      let type: SourceType = 'txt'
      if (ext === '.pdf') type = 'pdf'
      else if (ext === '.vtt') type = 'vtt'
      else if (ext === '.srt') type = 'srt'
      else if (ext === '.md' || ext === '.markdown') type = 'markdown'

      const sourceId = uuidv4()
      const storageKey = filebaseStorageService.getStorageKey(workspaceId, sourceId, originalName)

      await filebaseStorageService.uploadFile(storageKey, file.buffer, file.mimetype)

      const source = await sourceDao.createSource({
        workspaceId,
        name: originalName,
        type,
        storageKey,
        status: 'QUEUED',
        metadata: {
          size: file.size,
          mimeType: file.mimetype,
        },
      })

      await ingestionQueue.enqueueSource({
        workspaceId,
        sourceId: source.id,
      })

      await transaction.commit()
      ApiResponseHandler.handleSuccessResponse(
        res,
        'Source uploaded and queued successfully',
        source
      )
    } catch (error: any) {
      await transaction.rollback()
      Logger.error(`Error uploading source file: ${error.message}`)
      ApiResponseHandler.handleErrorReponse(res, 'Failed to upload source file', error.message)
    }
  }

  async registerUrlSource(req: Request, res: Response): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId || req.params.id
      const { url, name, type } = req.body

      const sourceName = name || url
      const source = await sourceDao.createSource({
        workspaceId,
        name: sourceName,
        type,
        originalUrl: url,
        status: 'QUEUED',
        metadata: {
          url,
        },
      })

      await ingestionQueue.enqueueSource({
        workspaceId,
        sourceId: source.id,
      })

      ApiResponseHandler.handleSuccessResponse(
        res,
        'URL source registered successfully',
        source
      )
    } catch (error: any) {
      Logger.error(`Error registering URL source: ${error.message}`)
      ApiResponseHandler.handleErrorReponse(res, 'Failed to register URL source', error.message)
    }
  }

  async listWorkspaceSources(req: Request, res: Response): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId || req.params.id
      const sources = await sourceDao.findSourcesByWorkspaceId(workspaceId)

      ApiResponseHandler.handleSuccessResponse(
        res,
        'Workspace sources fetched successfully',
        sources
      )
    } catch (error: any) {
      Logger.error(`Error fetching workspace sources: ${error.message}`)
      ApiResponseHandler.handleErrorReponse(res, 'Failed to fetch sources', error.message)
    }
  }

  async getSourceById(req: Request, res: Response): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId
      const { id } = req.params

      const source = await sourceDao.findSourceByIdAndWorkspace(id, workspaceId)
      if (!source) {
        ApiResponseHandler.handleNotFoundRequest(res, 'Source not found')
        return
      }

      let downloadUrl: string | undefined
      if (source.storageKey) {
        downloadUrl = await filebaseStorageService.getSignedDownloadUrl(
          source.storageKey,
        )
      }

      ApiResponseHandler.handleSuccessResponse(
        res,
        'Source details fetched successfully',
        {
          ...source.toJSON(),
          downloadUrl,
        }
      )
    } catch (error: any) {
      Logger.error(`Error fetching source details: ${error.message}`)
      ApiResponseHandler.handleErrorReponse(res, 'Failed to fetch source details', error.message)
    }
  }

  async getSourceView(req: Request, res: Response): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId
      const { id } = req.params

      const source: any = await sourceDao.findSourceByIdAndWorkspace(id, workspaceId)
      if (!source || !source.storageKey) {
        ApiResponseHandler.handleNotFoundRequest(res, 'Source not found')
        return
      }

      const fileBuffer = await filebaseStorageService.downloadFile(source.storageKey)
      
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `inline; filename="${source.originalName || 'document.pdf'}"`)
      res.send(fileBuffer)
    } catch (error: any) {
      Logger.error(`Error proxying source view: ${error.message}`)
      ApiResponseHandler.handleErrorReponse(res, 'Failed to proxy view file', error.message)
    }
  }

  async deleteSource(req: Request, res: Response): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId
      const { id } = req.params

      const source = await sourceDao.findSourceByIdAndWorkspace(id, workspaceId)
      if (!source) {
        ApiResponseHandler.handleNotFoundRequest(res, 'Source not found')
        return
      }

      if (source.storageKey) {
        await filebaseStorageService.deleteFile(source.storageKey)
      }

      await sourceDao.deleteSource(id, workspaceId)

      ApiResponseHandler.handleSuccessResponse(
        res,
        'Source deleted successfully',
        { id }
      )
    } catch (error: any) {
      Logger.error(`Error deleting source: ${error.message}`)
      ApiResponseHandler.handleErrorReponse(res, 'Failed to delete source', error.message)
    }
  }

  async retrySource(req: Request, res: Response): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId;
      const { id } = req.params;

      const source = await sourceDao.findSourceByIdAndWorkspace(id, workspaceId);
      if (!source) {
        ApiResponseHandler.handleNotFoundRequest(res, 'Source not found');
        return;
      }

      await sourceDao.updateSourceStatus(id, workspaceId, 'QUEUED');

      await ingestionQueue.enqueueSource({
        workspaceId,
        sourceId: source.id,
      });

      ApiResponseHandler.handleSuccessResponse(
        res,
        'Source queued for retry',
        { id: source.id, status: 'QUEUED' }
      );
    } catch (error: any) {
      Logger.error(`Error retrying source: ${error.message}`);
      ApiResponseHandler.handleErrorReponse(res, 'Failed to retry source', error.message);
    }
  }
}

export default new SourceController()
