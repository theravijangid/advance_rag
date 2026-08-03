import { Router } from 'express'
import workspaceController from '../controllers/workspace.controller'
import { requireAuth, requireWorkspaceAccess } from '../middleware/auth.middleware'
import { validate } from '../middleware/validator.middleware'
import { createWorkspaceSchema, updateWorkspaceSchema } from '../validators/workspace.validator'
import { apiLimiter } from '../middleware/rate-limit.middleware'

const router = Router()

router.use(apiLimiter)
router.use(requireAuth)

router.post(
  '/',
  requireAuth,
  validate(createWorkspaceSchema),
  (req, res) => workspaceController.createWorkspace(req, res)
)

router.get(
  '/',
  requireAuth,
  (req, res) => workspaceController.listWorkspaces(req, res)
)

router.get(
  '/:id',
  requireWorkspaceAccess,
  (req, res) => workspaceController.getWorkspaceById(req, res)
)

router.put(
  '/:id',
  requireWorkspaceAccess,
  validate(updateWorkspaceSchema),
  (req, res) => workspaceController.updateWorkspace(req, res)
)

router.delete(
  '/:id',
  requireWorkspaceAccess,
  (req, res) => workspaceController.deleteWorkspace(req, res)
)

export default router
