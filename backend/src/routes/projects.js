import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireRole, ROLES } from '../middlewares/roles.js';
import * as projectsController from '../controllers/projects.js';

const router = Router();

router.use(authenticate);

// GET    /api/projects                          — liste (filtrée par rôle)
router.get('/', projectsController.listProjects);

// POST   /api/projects                          — crée un projet (ENCADRANT)
router.post('/', requireRole(ROLES.ENCADRANT), projectsController.createProject);

// GET    /api/projects/:id                      — détail complet (membres, tâches, livrables, stats, feedbacks)
router.get('/:id', projectsController.getProject);

// PATCH  /api/projects/:id                      — modifie un projet (ENCADRANT, TEAM_LEADER)
router.patch('/:id', requireRole(ROLES.ENCADRANT, ROLES.TEAM_LEADER), projectsController.updateProject);

// DELETE /api/projects/:id                      — supprime un projet (ENCADRANT)
router.delete('/:id', requireRole(ROLES.ENCADRANT), projectsController.deleteProject);

// POST   /api/projects/:id/members              — ajoute un membre (ENCADRANT)
router.post('/:id/members', requireRole(ROLES.ENCADRANT), projectsController.addMember);

// ─── FEEDBACKS ───────────────────────────────────────────────────────────────

// GET    /api/projects/:id/feedbacks            — liste les feedbacks du projet
router.get('/:id/feedbacks', projectsController.listFeedbacks);

// POST   /api/projects/:id/feedbacks            — ajoute un feedback (ENCADRANT)
router.post('/:id/feedbacks', requireRole(ROLES.ENCADRANT), projectsController.addFeedback);

// PATCH  /api/projects/:id/feedbacks/:feedbackId — modifie un feedback (ENCADRANT auteur)
router.patch('/:id/feedbacks/:feedbackId', requireRole(ROLES.ENCADRANT), projectsController.updateFeedback);

// DELETE /api/projects/:id/feedbacks/:feedbackId — supprime un feedback (ENCADRANT auteur)
router.delete('/:id/feedbacks/:feedbackId', requireRole(ROLES.ENCADRANT), projectsController.deleteFeedback);

// ─── TRACKING ────────────────────────────────────────────────────────────────

// GET    /api/projects/:id/unseen               — éléments non consultés depuis la dernière visite (ENCADRANT)
router.get('/:id/unseen', requireRole(ROLES.ENCADRANT), projectsController.getUnseenElements);

export default router;
