import express from 'express';
import { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  forgotPassword, 
  verifyEmail, 
  setup2FA, 
  verify2FA 
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-email', verifyEmail);
router.post('/2fa/setup', authenticateToken, setup2FA);
router.post('/2fa/verify', verify2FA); // can be called unauthenticated during login flow

router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

export default router;
