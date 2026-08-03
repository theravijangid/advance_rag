import { Router } from 'express'
import sourceController from '../controllers/source.controller'
import { requireAuth, requireWorkspaceAccess } from '../middleware/auth.middleware'
import { uploadMiddleware } from '../middleware/upload.middleware'
import { validate } from '../middleware/validator.middleware'
import { registerUrlSourceSchema } from '../validators/source.validator'
import { apiLimiter, uploadLimiter } from '../middleware/rate-limit.middleware'

const router = Router({ mergeParams: true })

router.use(apiLimiter)
router.use(requireAuth)
router.use(requireWorkspaceAccess)

router.post(
  '/',
  uploadLimiter,
  uploadMiddleware.single('file'),
  (req, res) => sourceController.uploadSourceFile(req, res)
)

router.post(
  '/url',
  validate(registerUrlSourceSchema),
  (req, res) => sourceController.registerUrlSource(req, res)
)

router.get(
  '/',
  (req, res) => sourceController.listWorkspaceSources(req, res)
)

router.get(
  '/:id',
  (req, res) => sourceController.getSourceById(req, res)
)

router.get(
  '/:id/view',
  (req, res) => sourceController.getSourceView(req, res)
)

router.delete(
  '/:id',
  (req, res) => sourceController.deleteSource(req, res)
)

router.post(
  '/:id/retry',
  (req, res) => sourceController.retrySource(req, res)
)

export default router
