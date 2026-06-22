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
  origin: (origin, callback) => {
    // Autorise toutes les origines localhost en développement
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else if (process.env.CORS_ORIGIN && origin === process.env.CORS_ORIGIN) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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

const server = httpServer.listen(PORT, async () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`WebSocket (Socket.io) actif sur ws://localhost:${PORT}`);

  // Warm-up Supabase : on fait une petite requête pour initialiser la connexion
  try {
    const { supabaseAdmin } = await import('./src/config/supabase.js');
    await supabaseAdmin.from('projects').select('id').limit(1);
    console.log('✅ Connexion Supabase prête');
  } catch {
    console.log('⚠️  Warm-up Supabase échoué (normal si pas de .env)');
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} occupé, tentative de libération...`);
    import('child_process').then(({ execSync }) => {
      try {
        execSync(`for /f "tokens=5" %a in ('netstat -aon ^| find ":${PORT}" ^| find "LISTENING"') do taskkill /F /PID %a`, { shell: 'cmd.exe' });
      } catch {}
      setTimeout(() => httpServer.listen(PORT), 1000);
    });
  }
});
