import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import * as commentsController from '../controllers/comments.js';

const router = Router();

router.use(authenticate);

// TODO: GET    /api/comments?projectId=  — liste les commentaires d'un projet ou d'une tâche
// TODO: POST   /api/comments             — poste un commentaire (avec ref: projet | tâche)
// TODO: DELETE /api/comments/:id         — supprime son propre commentaire

router.get('/', (req, res) => res.json({ module: 'comments' }));

export default router;
