import multer from 'multer'
import { Request } from 'express'

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/vtt',
  'application/x-subrip',
  'application/octet-stream',
]

const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md', '.markdown', '.vtt', '.srt']

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase()
    if (ALLOWED_MIME_TYPES.includes(file.mimetype) || ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true)
    } else {
      cb(
        new Error(
          `Invalid file type '${file.mimetype}'. Allowed file types: PDF, TXT, MD, VTT, SRT.`
        )
      )
    }
  },
})

export default uploadMiddleware
