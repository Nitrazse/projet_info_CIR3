import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import * as notificationsController from '../controllers/notifications.js';

const router = Router();
router.use(authenticate);

// GET  /api/notifications        — liste mes notifications
router.get('/', notificationsController.listNotifications);

// PATCH /api/notifications/:id/read — marque une notification comme lue
router.patch('/:id/read', notificationsController.markAsRead);

// PATCH /api/notifications/read-all — marque toutes comme lues
router.patch('/read-all', notificationsController.markAllAsRead);

export default router;