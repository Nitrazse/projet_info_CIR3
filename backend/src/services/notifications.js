import { getIO } from './socket.js';

// Types de notifications possibles
export const NOTIF = {
  TASK_ASSIGNED:        'task:assigned',
  DELIVERABLE_VALIDATED:'deliverable:validated',
  DELIVERABLE_REJECTED: 'deliverable:rejected',
  COMMENT_POSTED:       'comment:posted',
  PROJECT_UPDATED:      'project:updated',
};

/**
 * Envoie une notification temps réel à un utilisateur spécifique.
 * Ne lève pas d'erreur si Socket.io n'est pas encore prêt (démarrage).
 */
export function emitNotification(userId, type, payload = {}) {
  try {
    getIO().to(`user:${userId}`).emit('notification:new', {
      type,
      payload,
      at: new Date().toISOString(),
    });
  } catch {
    // Socket.io pas encore initialisé — silencieux
  }
}

/**
 * Diffuse une notification à tous les membres d'un projet.
 */
export function emitToProject(projectId, type, payload = {}) {
  try {
    getIO().to(`project:${projectId}`).emit('notification:new', {
      type,
      payload,
      at: new Date().toISOString(),
    });
  } catch {}
}
