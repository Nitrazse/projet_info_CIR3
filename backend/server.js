import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';

import { initSocket } from './src/services/socket.js';

import authRoutes         from './src/routes/auth.js';
import projectsRoutes     from './src/routes/projects.js';
import tasksRoutes        from './src/routes/tasks.js';
import progressRoutes     from './src/routes/progress.js';
import commentsRoutes     from './src/routes/comments.js';
import deliverablesRoutes from './src/routes/deliverables.js';
import evaluationsRoutes  from './src/routes/evaluations.js';
import chatRoutes         from './src/routes/chat.js';
import exportRoutes       from './src/routes/export.js';
import notificationsRoutes from './src/routes/notifications.js';
import dashboardRoutes    from './src/routes/dashboard.js';

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());

// --- Routes REST ---
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth',          authRoutes);
app.use('/api/projects',      projectsRoutes);
app.use('/api/tasks',         tasksRoutes);
app.use('/api/progress',      progressRoutes);
app.use('/api/comments',      commentsRoutes);
app.use('/api/deliverables',  deliverablesRoutes);
app.use('/api/evaluations',   evaluationsRoutes);
app.use('/api/chat',          chatRoutes);
app.use('/api/export',        exportRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/dashboard',     dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} introuvable` });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Erreur interne du serveur' });
});

// --- Serveur HTTP + Socket.io ---
const httpServer = http.createServer(app);
initSocket(httpServer);

const server = httpServer.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`WebSocket (Socket.io) actif sur ws://localhost:${PORT}`);
});

// Libère le port proprement quand nodemon redémarre
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
