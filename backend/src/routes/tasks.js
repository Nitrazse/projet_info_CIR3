import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import * as tasksController from '../controllers/tasks.js';

const router = Router();

router.use(authenticate);

// TODO: GET    /api/tasks             — liste des tâches (filtrable par projet, assignee, statut)
// TODO: POST   /api/tasks             — crée une tâche dans un projet
// TODO: GET    /api/tasks/:id         — détail d'une tâche
// TODO: PATCH  /api/tasks/:id         — modifie une tâche (titre, statut, assignee…)
// TODO: DELETE /api/tasks/:id         — supprime une tâche
// TODO: PATCH  /api/tasks/:id/status  — change uniquement le statut (Kanban drag & drop)

router.get('/', (req, res) => res.json({ module: 'tasks' }));

export default router;
