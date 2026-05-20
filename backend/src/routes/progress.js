import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import * as progressController from '../controllers/progress.js';

const router = Router();

router.use(authenticate);

// TODO: GET  /api/progress/:projectId   — pourcentage avancement, tâches par statut
// TODO: POST /api/progress/:projectId   — enregistre un point d'avancement manuel (ENCADRANT)

router.get('/', (req, res) => res.json({ module: 'progress' }));

export default router;
