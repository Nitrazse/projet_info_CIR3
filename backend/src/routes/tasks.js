import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireRole, ROLES } from '../middlewares/roles.js';
import * as tasksController from '../controllers/tasks.js';

const router = Router();

router.use(authenticate);

// GET    /api/tasks                  — liste des tâches (filtrable par project_id, assignee_id, statut)
router.get('/', tasksController.listTasks);

// POST   /api/tasks                  — crée une tâche (ENCADRANT, TEAM_LEADER)
router.post('/', requireRole(ROLES.ENCADRANT, ROLES.TEAM_LEADER), tasksController.createTask);

// GET    /api/tasks/:id              — détail d'une tâche
router.get('/:id', tasksController.getTask);

// PATCH  /api/tasks/:id              — modifie une tâche (ENCADRANT, TEAM_LEADER)
router.patch('/:id', requireRole(ROLES.ENCADRANT, ROLES.TEAM_LEADER), tasksController.updateTask);

// DELETE /api/tasks/:id              — supprime une tâche (ENCADRANT uniquement)
router.delete('/:id', requireRole(ROLES.ENCADRANT), tasksController.deleteTask);

// PATCH  /api/tasks/:id/status       — change le statut (tous les membres authentifiés)
router.patch('/:id/status', tasksController.updateTaskStatus);

// Validation et revue des routes CRUD tâches par l'équipe
export default router;