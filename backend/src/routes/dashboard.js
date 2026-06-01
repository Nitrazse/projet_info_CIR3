import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireRole, ROLES } from '../middlewares/roles.js';
import * as dashboardController from '../controllers/dashboard.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(ROLES.ENCADRANT));

// GET /api/dashboard                       — KPIs globaux + liste projets supervisés + distribution santé
router.get('/', dashboardController.getDashboard);

// GET /api/dashboard/project/:id/health   — health score détaillé d'un projet
router.get('/project/:id/health', dashboardController.getProjectHealth);

export default router;
