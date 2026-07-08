import express from 'express';
import { 
  listUsers, 
  listAllDeployments, 
  deleteDeployment, 
  getAdminStats 
} from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/users', listUsers);
router.get('/deployments', listAllDeployments);
router.delete('/deployments/:id', deleteDeployment);
router.get('/stats', getAdminStats);

export default router;
