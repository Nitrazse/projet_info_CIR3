import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireRole, ROLES } from '../middlewares/roles.js';
import * as deliverablesController from '../controllers/deliverables.js';

const router = Router();

router.use(authenticate);

// GET    /api/deliverables?project_id=&statut=    — liste les livrables d'un projet (filtrable par statut)
router.get('/', deliverablesController.listDeliverables);

// GET    /api/deliverables/pending?project_id=    — livrables en attente de validation (ENCADRANT, JURY)
router.get('/pending', requireRole(ROLES.ENCADRANT, ROLES.JURY), deliverablesController.listPendingDeliverables);

// POST   /api/deliverables                        — soumet un livrable (avec versioning auto)
router.post('/', deliverablesController.uploadDeliverable);

// GET    /api/deliverables/:id                    — détail + URL signée + historique versions
router.get('/:id', deliverablesController.getDeliverable);

// PATCH  /api/deliverables/:id/status             — valide ou rejette + notification (ENCADRANT, JURY)
router.patch('/:id/status', requireRole(ROLES.ENCADRANT, ROLES.JURY), deliverablesController.updateDeliverableStatus);

// DELETE /api/deliverables/:id                    — supprime un livrable
router.delete('/:id', deliverablesController.deleteDeliverable);

export default router;
