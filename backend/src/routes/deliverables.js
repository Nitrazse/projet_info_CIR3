import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireRole, ROLES } from '../middlewares/roles.js';
import * as deliverablesController from '../controllers/deliverables.js';

const router = Router();

router.use(authenticate);

// GET    /api/deliverables?project_id=       — liste les livrables d'un projet
router.get('/', deliverablesController.listDeliverables);

// POST   /api/deliverables                   — enregistre un livrable (URL storage_path)
router.post('/', deliverablesController.uploadDeliverable);

// GET    /api/deliverables/:id               — détail + URL signée du livrable
router.get('/:id', deliverablesController.getDeliverable);

// PATCH  /api/deliverables/:id/status        — valide ou rejette (ENCADRANT, JURY)
router.patch('/:id/status', requireRole(ROLES.ENCADRANT, ROLES.JURY), deliverablesController.updateDeliverableStatus);

// DELETE /api/deliverables/:id               — supprime un livrable
router.delete('/:id', deliverablesController.deleteDeliverable);

export default router;
