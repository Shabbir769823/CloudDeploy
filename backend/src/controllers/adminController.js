import { UserModel } from '../models/userModel.js';
import { DeploymentModel } from '../models/deploymentModel.js';
import { stopAndRemoveContainer } from '../services/dockerService.js';
import { ProjectModel } from '../models/projectModel.js';

export const listUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    const users = await UserModel.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve users.' });
  }
};

export const listAllDeployments = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    const deployments = await DeploymentModel.findAll();
    res.json(deployments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve all deployments.' });
  }
};

export const deleteDeployment = async (req, res) => {
  const { id } = req.params;

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }

    const deployment = await DeploymentModel.findById(id);
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found.' });
    }

    // Stop and remove the container associated with this project
    const containerName = `clouddeploy-${deployment.projectId}`;
    await stopAndRemoveContainer(containerName);

    // Delete deployment entry
    await DeploymentModel.delete(id);

    res.json({ success: true, message: 'Deployment record deleted and remote/local container stopped.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to terminate deployment.' });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const users = await UserModel.findAll();
    const deployments = await DeploymentModel.findAll();
    const projects = await ProjectModel.findAll();

    res.json({
      totalUsers: users.length,
      totalDeployments: deployments.length,
      totalProjects: projects.length,
      roles: {
        adminCount: users.filter(u => u.role === 'admin').length,
        devCount: users.filter(u => u.role === 'developer').length
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve administrator metrics.' });
  }
};
