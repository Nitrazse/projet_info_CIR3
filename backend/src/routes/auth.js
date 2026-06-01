import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import * as authController from '../controllers/auth.js';

const router = Router();

// POST /api/auth/register — inscription (email, password, nom, role)
router.post('/register', authController.register);

// POST /api/auth/verify-otp — vérifie le code à 4 chiffres reçu par email
router.post('/verify-otp', authController.verifyOtp);

// POST /api/auth/resend-otp — renvoie un nouveau code OTP
router.post('/resend-otp', authController.resendOtp);

// POST /api/auth/login — connexion, retourne { token, user }
router.post('/login', authController.login);

// POST /api/auth/logout — révoque la session Supabase
router.post('/logout', authController.logout);

// GET /api/auth/me — profil de l'utilisateur connecté (token requis)
router.get('/me', authenticate, authController.getMe);

export default router;
