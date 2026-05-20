import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireRole, ROLES } from '../middlewares/roles.js';
import * as evaluationsController from '../controllers/evaluations.js';

const router = Router();

router.use(authenticate);

// TODO: GET    /api/evaluations?projectId=   — liste les évaluations d'un projet
// TODO: POST   /api/evaluations              — crée une évaluation (ENCADRANT, JURY)
// TODO: GET    /api/evaluations/:id          — détail d'une évaluation
// TODO: PATCH  /api/evaluations/:id          — modifie une évaluation (avant clôture)
// TODO: GET    /api/evaluations/:projectId/export — export PDF/CSV (JURY, ENCADRANT)

router.get('/', (req, res) => res.json({ module: 'evaluations' }));

export default router;
