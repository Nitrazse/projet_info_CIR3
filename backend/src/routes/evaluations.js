import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireRole, ROLES } from '../middlewares/roles.js';
import * as evaluationsController from '../controllers/evaluations.js';

const router = Router();

router.use(authenticate);

// GET    /api/evaluations?project_id=        — liste les évaluations d'un projet
router.get('/', evaluationsController.listEvaluations);

// POST   /api/evaluations                    — crée une évaluation (ENCADRANT, JURY)
router.post('/', requireRole(ROLES.ENCADRANT, ROLES.JURY), evaluationsController.createEvaluation);

// GET    /api/evaluations/:id                — détail d'une évaluation
router.get('/:id', evaluationsController.getEvaluation);

// PATCH  /api/evaluations/:id               — modifie une évaluation (ENCADRANT, JURY)
router.patch('/:id', requireRole(ROLES.ENCADRANT, ROLES.JURY), evaluationsController.updateEvaluation);

// GET    /api/evaluations/:projectId/export  — export CSV (ENCADRANT, JURY)
router.get('/:projectId/export', requireRole(ROLES.ENCADRANT, ROLES.JURY), evaluationsController.exportEvaluations);

export default router;
