import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireRole, ROLES } from '../middlewares/roles.js';
import * as evaluationsController from '../controllers/evaluations.js';

const router = Router();

router.use(authenticate);

// ─── GRILLES ────────────────────────────────────────────────────────────────

// GET    /api/evaluations/grilles              — liste les grilles disponibles
router.get('/grilles', evaluationsController.listGrilles);

// POST   /api/evaluations/grilles              — crée une grille (ENCADRANT)
router.post('/grilles', requireRole(ROLES.ENCADRANT), evaluationsController.createGrille);

// GET    /api/evaluations/grilles/:id          — détail d'une grille
router.get('/grilles/:id', evaluationsController.getGrille);

// PATCH  /api/evaluations/grilles/:id          — modifie une grille (ENCADRANT auteur)
router.patch('/grilles/:id', requireRole(ROLES.ENCADRANT), evaluationsController.updateGrille);

// ─── ÉVALUATIONS ────────────────────────────────────────────────────────────

// GET    /api/evaluations?project_id=          — liste les évaluations d'un projet
router.get('/', evaluationsController.listEvaluations);

// POST   /api/evaluations                      — crée une évaluation brouillon (ENCADRANT, JURY)
router.post('/', requireRole(ROLES.ENCADRANT, ROLES.JURY), evaluationsController.createEvaluation);

// GET    /api/evaluations/:id                  — détail d'une évaluation
router.get('/:id', evaluationsController.getEvaluation);

// PATCH  /api/evaluations/:id                  — modifie une évaluation brouillon (auteur)
router.patch('/:id', requireRole(ROLES.ENCADRANT, ROLES.JURY), evaluationsController.updateEvaluation);

// POST   /api/evaluations/:id/soumettre        — soumet et verrouille l'évaluation
router.post('/:id/soumettre', requireRole(ROLES.ENCADRANT, ROLES.JURY), evaluationsController.soumetteEvaluation);

// GET    /api/evaluations/:projectId/export    — export CSV (ENCADRANT, JURY)
router.get('/:projectId/export', requireRole(ROLES.ENCADRANT, ROLES.JURY), evaluationsController.exportEvaluations);

export default router;
