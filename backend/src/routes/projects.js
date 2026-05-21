import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireRole, ROLES } from '../middlewares/roles.js';
import * as projectsController from '../controllers/projects.js';

const router = Router();

router.use(authenticate);

// GET    /api/projects          — liste (filtrée par rôle)
router.get('/', projectsController.listProjects);

// POST   /api/projects          — crée un projet (ENCADRANT uniquement)
router.post('/', requireRole(ROLES.ENCADRANT), projectsController.createProject);

// GET    /api/projects/:id      — détail d'un projet
router.get('/:id', projectsController.getProject);

// PATCH  /api/projects/:id      — modifie un projet (ENCADRANT, TEAM_LEADER)
router.patch('/:id', requireRole(ROLES.ENCADRANT, ROLES.TEAM_LEADER), projectsController.updateProject);

// DELETE /api/projects/:id      — supprime un projet (ENCADRANT uniquement)
router.delete('/:id', requireRole(ROLES.ENCADRANT), projectsController.deleteProject);

// POST   /api/projects/:id/members — ajoute un membre (ENCADRANT uniquement)
router.post('/:id/members', requireRole(ROLES.ENCADRANT), projectsController.addMember);

export default router;
