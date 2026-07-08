import express from 'express';
import { 
  createProject, 
  listProjects, 
  getProject, 
  deleteProject 
} from '../controllers/projectController.js';
import { 
  deployProject, 
  stopDeployment, 
  restartDeployment, 
  rollbackDeployment, 
  getLogs, 
  getHistory 
} from '../controllers/deploymentController.js';
import { getProjectStats } from '../controllers/monitorController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all project routes
router.use(authenticateToken);

router.post('/', createProject);
router.get('/', listProjects);
router.get('/:id', getProject);
router.delete('/:id', deleteProject);

// Deployments
router.post('/:id/deploy', deployProject);
router.post('/:id/stop', stopDeployment);
router.post('/:id/restart', restartDeployment);
router.post('/:id/rollback', rollbackDeployment);
router.get('/:id/history', getHistory);

// Telemetry
router.get('/:id/stats', getProjectStats);
router.get('/deployments/:deploymentId/logs', getLogs);

export default router;
