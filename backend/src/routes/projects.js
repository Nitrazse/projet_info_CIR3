import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireRole, ROLES } from '../middlewares/roles.js';
import * as projectsController from '../controllers/projects.js';

const router = Router();

// Toutes les routes projets nécessitent d'être connecté
router.use(authenticate);

// TODO: GET    /api/projects          — liste tous les projets (filtrés par rôle)
// TODO: POST   /api/projects          — crée un projet (ENCADRANT uniquement)
// TODO: GET    /api/projects/:id      — détail d'un projet
// TODO: PATCH  /api/projects/:id      — modifie un projet (ENCADRANT, TEAM_LEADER)
// TODO: DELETE /api/projects/:id      — supprime un projet (ENCADRANT uniquement)
// TODO: POST   /api/projects/:id/members — ajoute un membre au projet

router.get('/', (req, res) => res.json({ module: 'projects' }));

export default router;
