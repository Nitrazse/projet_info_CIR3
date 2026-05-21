import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import * as commentsController from '../controllers/comments.js';

const router = Router();

router.use(authenticate);

// GET    /api/comments?project_id=  — commentaires d'un projet
// GET    /api/comments?task_id=     — commentaires d'une tâche
router.get('/', commentsController.listComments);

// POST   /api/comments              — poste un commentaire
router.post('/', commentsController.createComment);

// DELETE /api/comments/:id          — supprime son commentaire (ou ENCADRANT)
router.delete('/:id', commentsController.deleteComment);

export default router;
