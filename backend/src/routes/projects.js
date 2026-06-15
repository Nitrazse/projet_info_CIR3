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

// GET    /api/projects/etudiants/disponibles    — étudiants non affectés (ENCADRANT) — AVANT /:id
router.get('/etudiants/disponibles', requireRole(ROLES.ENCADRANT), projectsController.getEtudiantsDisponibles);

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

// ─── JALONS ──────────────────────────────────────────────────────────────────

// GET    /api/projects/:id/jalons               — liste les jalons d'un projet
router.get('/:id/jalons', projectsController.listJalons);

// POST   /api/projects/:id/jalons               — ajoute un jalon (ENCADRANT)
router.post('/:id/jalons', requireRole(ROLES.ENCADRANT), projectsController.addJalon);

// PATCH  /api/projects/:id/jalons/:jalonId      — modifie un jalon (ENCADRANT)
router.patch('/:id/jalons/:jalonId', requireRole(ROLES.ENCADRANT), projectsController.updateJalon);

// DELETE /api/projects/:id/jalons/:jalonId      — supprime un jalon (ENCADRANT)
router.delete('/:id/jalons/:jalonId', requireRole(ROLES.ENCADRANT), projectsController.deleteJalon);

// ─── GROUPES ─────────────────────────────────────────────────────────────────

// GET    /api/projects/:id/groupes              — liste les groupes avec membres
router.get('/:id/groupes', projectsController.listGroupes);

// POST   /api/projects/:id/groupes              — crée un groupe (ENCADRANT)
router.post('/:id/groupes', requireRole(ROLES.ENCADRANT), projectsController.createGroupe);

// DELETE /api/projects/:id/groupes/:groupeId    — supprime un groupe (ENCADRANT)
router.delete('/:id/groupes/:groupeId', requireRole(ROLES.ENCADRANT), projectsController.deleteGroupe);

// ─── TRACKING ────────────────────────────────────────────────────────────────

// GET    /api/projects/:id/unseen               — éléments non consultés depuis la dernière visite (ENCADRANT)
router.get('/:id/unseen', requireRole(ROLES.ENCADRANT), projectsController.getUnseenElements);

export default router;
