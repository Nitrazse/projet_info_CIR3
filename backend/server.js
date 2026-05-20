import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './src/routes/auth.js';
import projectsRoutes from './src/routes/projects.js';
import tasksRoutes from './src/routes/tasks.js';
import progressRoutes from './src/routes/progress.js';
import commentsRoutes from './src/routes/comments.js';
import deliverablesRoutes from './src/routes/deliverables.js';
import evaluationsRoutes from './src/routes/evaluations.js';

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares globaux ---
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// --- Routes ---
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/deliverables', deliverablesRoutes);
app.use('/api/evaluations', evaluationsRoutes);

// --- Gestion des routes inconnues ---
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} introuvable` });
});

// --- Gestion centralisée des erreurs ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Erreur interne du serveur' });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
