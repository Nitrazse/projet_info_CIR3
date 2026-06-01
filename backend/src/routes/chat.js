import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import * as chatController from '../controllers/chat.js';

const router = Router();

router.use(authenticate);

// GET    /api/chat?project_id=  — historique des messages d'un projet
router.get('/', chatController.getMessages);

// DELETE /api/chat/:id          — supprime un message
router.delete('/:id', chatController.deleteMessage);

export default router;
