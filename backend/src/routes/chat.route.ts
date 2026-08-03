import { Router } from 'express'
import { ChatController } from '../controllers/chat.controller'
import { requireAuth, requireWorkspaceAccess } from '../middleware/auth.middleware'
import { apiLimiter } from '../middleware/rate-limit.middleware'

const router = Router({ mergeParams: true })

router.use(apiLimiter)
router.use(requireAuth)
router.use(requireWorkspaceAccess)

router.post('/', ChatController.sendChatMessage)
router.get('/:conversationId', ChatController.getConversation)

export default router
