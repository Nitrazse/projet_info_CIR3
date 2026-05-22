import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireRole, ROLES } from '../middlewares/roles.js';
import * as exportController from '../controllers/export.js';

const router = Router();

router.use(authenticate);

// GET /api/export/projects/:id/pdf                   — rapport complet (tous rôles)
router.get('/projects/:id/pdf', exportController.projectPDF);

// GET /api/export/projects/:id/tasks/excel           — tâches en Excel (tous rôles)
router.get('/projects/:id/tasks/excel', exportController.tasksExcel);

// GET /api/export/projects/:id/evaluations/pdf       — évaluations PDF (ENCADRANT, JURY)
router.get(
  '/projects/:id/evaluations/pdf',
  requireRole(ROLES.ENCADRANT, ROLES.JURY),
  exportController.evaluationsPDF,
);

// GET /api/export/projects/:id/evaluations/excel     — évaluations Excel (ENCADRANT, JURY)
router.get(
  '/projects/:id/evaluations/excel',
  requireRole(ROLES.ENCADRANT, ROLES.JURY),
  exportController.evaluationsExcel,
);

export default router;
