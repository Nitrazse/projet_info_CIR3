import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireRole, ROLES } from '../middlewares/roles.js';
import * as deliverablesController from '../controllers/deliverables.js';

const router = Router();

router.use(authenticate);

// TODO: GET    /api/deliverables?projectId=  — liste les livrables d'un projet
// TODO: POST   /api/deliverables             — dépose un livrable (upload fichier via Supabase Storage)
// TODO: GET    /api/deliverables/:id         — télécharge / détail d'un livrable
// TODO: PATCH  /api/deliverables/:id/status  — valide ou rejette un livrable (ENCADRANT, JURY)
// TODO: DELETE /api/deliverables/:id         — supprime un livrable

router.get('/', (req, res) => res.json({ module: 'deliverables' }));

export default router;
