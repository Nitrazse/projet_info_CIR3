import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireRole, ROLES } from '../middlewares/roles.js';
import * as progressController from '../controllers/progress.js';

const router = Router();

router.use(authenticate);

// GET  /api/progress/:projectId   — avancement calculé + points manuels
router.get('/:projectId', progressController.getProgress);

// POST /api/progress/:projectId   — enregistre un point d'avancement (ENCADRANT)
router.post('/:projectId', requireRole(ROLES.ENCADRANT), progressController.addProgressEntry);

export default router;
