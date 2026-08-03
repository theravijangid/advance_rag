import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import appConfig from '../config/config'
import Logger from '../config/logger'
import { normalizeFileName } from '../utils/normalize-name'

export class FilebaseStorageService {
  private readonly s3Client: S3Client
  private readonly bucket: string

  constructor() {
    this.s3Client = new S3Client({
      endpoint: appConfig.filebase.endpoint,
      region: appConfig.filebase.region || 'us-east-1',
      credentials: {
        accessKeyId: appConfig.filebase.accessKeyId || 'mock_key',
        secretAccessKey: appConfig.filebase.secretAccessKey || 'mock_secret',
      },
      forcePathStyle: true,
    })
    this.bucket = appConfig.filebase.bucket
  }

  getStorageKey(workspaceId: string, sourceId: string, fileName: string): string {
    const cleanFileName = normalizeFileName(fileName)
    return `workspaces/${workspaceId}/sources/${sourceId}/${cleanFileName}`
  }

  async uploadFile(
    storageKey: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: fileBuffer,
        ContentType: contentType,
      })

      await this.s3Client.send(command)
      Logger.info(`File uploaded successfully to Filebase storage: ${storageKey}`)
      return storageKey
    } catch (error: any) {
      Logger.error(`Error uploading file to Filebase storage: ${error.message}`)
      throw new Error(`Failed to upload file to object storage: ${error.message}`)
    }
  }

  async getSignedDownloadUrl(storageKey: string, fileName?: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        ResponseContentDisposition: fileName
          ? `inline; filename="${encodeURIComponent(fileName)}"`
          : 'inline',
      })

      return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 })
    } catch (error: any) {
      Logger.error(`Error generating signed download URL: ${error.message}`)
      throw new Error(`Failed to generate signed download URL: ${error.message}`)
    }
  }

  async downloadFile(storageKey: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      })

      const response = await this.s3Client.send(command)
      const stream = response.Body
      if (!stream) {
        throw new Error('No body returned from S3')
      }

      const chunks: Uint8Array[] = []
      for await (const chunk of stream as any) {
        chunks.push(chunk)
      }
      return Buffer.concat(chunks)
    } catch (error: any) {
      Logger.error(`Error downloading file from Filebase storage: ${error.message}`)
      throw new Error(`Failed to download file: ${error.message}`)
    }
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      })

      await this.s3Client.send(command)
      Logger.info(`File deleted successfully from Filebase storage: ${storageKey}`)
      return true
    } catch (error: any) {
      Logger.error(`Error deleting file from Filebase storage: ${error.message}`)
      return false
    }
  }
}

export default new FilebaseStorageService()
