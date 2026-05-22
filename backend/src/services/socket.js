import { Server } from 'socket.io';
import { supabaseAdmin } from '../config/supabase.js';

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  // Middleware d'authentification : vérifie le JWT Supabase à la connexion
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Token manquant'));

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return next(new Error('Token invalide ou expiré'));

    socket.user = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.user_metadata?.role ?? 'etudiant',
    };
    next();
  });

  io.on('connection', (socket) => {
    // Salle privée pour les notifications personnelles
    socket.join(`user:${socket.user.id}`);

    // --- Chat par projet ---

    // Rejoindre la salle d'un projet pour recevoir les messages
    socket.on('project:join', (projectId) => {
      if (projectId) socket.join(`project:${projectId}`);
    });

    // Quitter la salle d'un projet
    socket.on('project:leave', (projectId) => {
      if (projectId) socket.leave(`project:${projectId}`);
    });

    // Envoyer un message de chat — persiste en base puis broadcast
    socket.on('chat:message', async ({ project_id, contenu }) => {
      if (!project_id || !contenu?.trim()) return;

      const { data, error } = await supabaseAdmin
        .from('messages')
        .insert({
          project_id,
          auteur_id: socket.user.id,
          contenu: contenu.trim(),
        })
        .select()
        .single();

      if (error) {
        socket.emit('error', { message: 'Impossible d\'envoyer le message' });
        return;
      }

      // Diffuse le message à tous les membres connectés au projet
      io.to(`project:${project_id}`).emit('chat:message', {
        ...data,
        auteur: { id: socket.user.id, email: socket.user.email },
      });
    });

    // Indicateur "est en train d'écrire…"
    socket.on('chat:typing', ({ project_id }) => {
      if (project_id) {
        socket.to(`project:${project_id}`).emit('chat:typing', {
          user: { id: socket.user.id, email: socket.user.email },
        });
      }
    });

    socket.on('disconnect', () => {});
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.io non initialisé — appelez initSocket() d\'abord');
  return io;
}
