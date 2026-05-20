import { Router } from 'express';
import * as authController from '../controllers/auth.js';

const router = Router();

// TODO: POST /api/auth/register — inscription (email, password, role, nom)
// TODO: POST /api/auth/login    — connexion, retourne le JWT Supabase
// TODO: POST /api/auth/logout   — révoque la session Supabase
// TODO: GET  /api/auth/me       — retourne le profil de l'utilisateur connecté

router.get('/', (req, res) => res.json({ module: 'auth' }));

export default router;
