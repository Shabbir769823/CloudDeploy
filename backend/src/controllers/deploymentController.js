import { ProjectModel } from '../models/projectModel.js';
import { DeploymentModel } from '../models/deploymentModel.js';
import { LogModel } from '../models/logModel.js';
import { UserModel } from '../models/userModel.js';
import { cloneRepository } from '../services/githubService.js';
import { generateDockerfile } from '../utils/dockerfileGenerator.js';
import { buildImage, runContainer, stopAndRemoveContainer, getContainerLogs } from '../services/dockerService.js';
import { deployToEC2 } from '../services/sshService.js';
import { SocketService } from '../services/socketService.js';
import { sendDeploymentSuccessEmail, sendDeploymentFailureEmail } from '../services/emailService.js';
import crypto from 'crypto';
import path from 'path';

// Helper to write logs to DB & emit to Sockets
const writeLog = async (deploymentId, message, type = 'build') => {
  const cleanMessage = message.endsWith('\n') ? message : message + '\n';
  
  // Write to DB
  await LogModel.create({
    id: crypto.randomUUID(),
    deploymentId,
    type,
    message: cleanMessage
  });

  // Emit to socket room
  SocketService.emitLog(deploymentId, cleanMessage);
};

export const deployProject = async (req, res) => {
  const { id: projectId } = req.params;

  try {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Check permissions
    if (project.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const version = await DeploymentModel.getNextVersion(projectId);
    const deploymentId = crypto.randomUUID();
    const serverIP = project.serverIP || 'Localhost';
    const port = project.assignedPort;
    const dockerImage = `clouddeploy-${projectId.substring(0, 8)}:v${version}`;

    // Create deployment in DB
    const newDeployment = await DeploymentModel.create({
      id: deploymentId,
      projectId,
      status: 'queued',
      dockerImage,
      serverIP,
      port,
      version
    });

    // Send response back immediately
    res.json(newDeployment);

    // Run the deployment pipeline asynchronously
    runDeploymentPipeline(project, newDeployment, req.user);

  } catch (err) {
    console.error('Deployment request error:', err);
    res.status(500).json({ error: 'Failed to queue deployment.' });
  }
};

// Async deployment logic
const runDeploymentPipeline = async (project, deployment, user) => {
  const startTime = Date.now();
  const deploymentId = deployment.id;
  const projectId = project.id;
  const projectDir = path.resolve(process.cwd(), `../uploads/${projectId}`);

  try {
    // 1. Set status to building
    await DeploymentModel.update(deploymentId, { status: 'building' });
    SocketService.emitStatus(deploymentId, 'building');

    await writeLog(deploymentId, `[System] Starting Deployment Pipeline (Version ${deployment.version})`);
    await writeLog(deploymentId, `[System] Destination Host: ${project.serverIP ? project.serverIP : 'Local Engine'}`);

    // 2. Clone GitHub repository
    const commitInfo = await cloneRepository(project.githubRepo, project.branch, projectDir, (log) => {
      writeLog(deploymentId, log, 'build');
    });

    // Save commit info
    await DeploymentModel.update(deploymentId, {
      commitId: commitInfo.commitId,
      commitMessage: commitInfo.commitMessage
    });

    // 3. Generate Dockerfile if not exists
    await writeLog(deploymentId, `[Framework] Checking Dockerfile status...`);
    const generated = generateDockerfile(projectDir, project.framework);
    if (generated) {
      await writeLog(deploymentId, `[Framework] No Dockerfile detected. Generated default config for: ${project.framework}\n`);
    } else {
      await writeLog(deploymentId, `[Framework] Custom Dockerfile detected in project root.\n`);
    }

    const containerName = `clouddeploy-${projectId}`;

    // 4. Decide on AWS EC2 SSH Deployment or Local Docker Deployment
    if (project.serverIP && project.sshUser) {
      // remote AWS EC2 SSH deployment
      await writeLog(deploymentId, `[AWS EC2] Dispatching build & deploy script to AWS EC2 instance: ${project.serverIP}...`);
      
      const serverConfig = {
        host: project.serverIP,
        username: project.sshUser,
        privateKey: project.sshKey || null,
        password: null // Or support password auth
      };

      const deployParams = {
        repoUrl: project.githubRepo,
        branch: project.branch,
        imageName: deployment.dockerImage,
        containerName,
        hostPort: project.assignedPort,
        containerPort: project.framework === 'Express' || project.framework === 'NodeJS' || project.framework === 'Python Flask' ? 5000 : 80
      };

      await deployToEC2(serverConfig, deployParams, (log) => {
        writeLog(deploymentId, log, 'deploy');
      });

    } else {
      // Local Docker deployment
      await writeLog(deploymentId, `[Local Docker] Building container image: ${deployment.dockerImage}...`);
      await buildImage(deployment.dockerImage, projectDir, (log) => {
        writeLog(deploymentId, log, 'build');
      });

      await writeLog(deploymentId, `[Local Docker] Deploying container: ${containerName}...`);
      
      // Determine container internal port
      const containerPort = (project.framework === 'Express' || project.framework === 'NodeJS' || project.framework === 'Python Flask') ? 5000 : 80;
      
      await runContainer(
        deployment.dockerImage,
        containerName,
        project.assignedPort,
        containerPort,
        (log) => {
          writeLog(deploymentId, log, 'deploy');
        }
      );
    }

    // 5. Update database to success
    const duration = Math.round((Date.now() - startTime) / 1000);
    await DeploymentModel.update(deploymentId, { status: 'success', duration });
    SocketService.emitStatus(deploymentId, 'success');
    await writeLog(deploymentId, `[System] Deployment completed successfully in ${duration}s!`);

    // Fetch user details for notification
    const userDetails = await UserModel.findById(project.userId);
    if (userDetails) {
      await sendDeploymentSuccessEmail(
        userDetails.email,
        userDetails.name,
        project.projectName,
        deployment.version,
        project.serverIP || 'localhost',
        project.assignedPort
      );
    }

  } catch (err) {
    console.error('Deployment flow error:', err);
    const duration = Math.round((Date.now() - startTime) / 1000);
    await DeploymentModel.update(deploymentId, { status: 'failed', duration });
    SocketService.emitStatus(deploymentId, 'failed');
    await writeLog(deploymentId, `[System Error] Deployment pipeline crashed!`);
    await writeLog(deploymentId, `[System Error] Details: ${err.message}`);

    const userDetails = await UserModel.findById(project.userId);
    if (userDetails) {
      await sendDeploymentFailureEmail(
        userDetails.email,
        userDetails.name,
        project.projectName,
        err.message
      );
    }
  }
};

export const stopDeployment = async (req, res) => {
  const { id: projectId } = req.params;
  const containerName = `clouddeploy-${projectId}`;

  try {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    await stopAndRemoveContainer(containerName, (log) => {
      console.log(log);
    });

    res.json({ success: true, message: 'Deployment stopped and container removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to stop deployment.' });
  }
};

export const restartDeployment = async (req, res) => {
  const { id: projectId } = req.params;

  try {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const latestDeployment = await DeploymentModel.findLatestSuccess(projectId);
    if (!latestDeployment) {
      return res.status(400).json({ error: 'No successful deployment available to restart.' });
    }

    const containerName = `clouddeploy-${projectId}`;
    const containerPort = (project.framework === 'Express' || project.framework === 'NodeJS' || project.framework === 'Python Flask') ? 5000 : 80;

    await stopAndRemoveContainer(containerName);
    await runContainer(latestDeployment.dockerImage, containerName, project.assignedPort, containerPort);

    res.json({ success: true, message: 'Deployment restarted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to restart deployment.' });
  }
};

export const rollbackDeployment = async (req, res) => {
  const { id: projectId } = req.params;
  const { targetDeploymentId } = req.body;

  try {
    const project = await ProjectModel.findById(projectId);
    const targetDeployment = await DeploymentModel.findById(targetDeploymentId);

    if (!project || !targetDeployment) {
      return res.status(404).json({ error: 'Project or Target Deployment not found.' });
    }

    if (targetDeployment.projectId !== projectId || targetDeployment.status !== 'success') {
      return res.status(400).json({ error: 'Invalid rollback target.' });
    }

    const version = await DeploymentModel.getNextVersion(projectId);
    const deploymentId = crypto.randomUUID();

    const rollbackDep = await DeploymentModel.create({
      id: deploymentId,
      projectId,
      status: 'queued',
      dockerImage: targetDeployment.dockerImage,
      serverIP: project.serverIP || 'Localhost',
      port: project.assignedPort,
      version,
      commitId: targetDeployment.commitId,
      commitMessage: `Rollback to v${targetDeployment.version}: ${targetDeployment.commitMessage}`
    });

    res.json(rollbackDep);

    // Rollback pipeline in background
    setTimeout(async () => {
      await DeploymentModel.update(deploymentId, { status: 'building' });
      SocketService.emitStatus(deploymentId, 'building');

      await writeLog(deploymentId, `[System] Initiating Rollback Pipeline...`);
      await writeLog(deploymentId, `[System] Deploying cached image: ${targetDeployment.dockerImage} (Previous Version: v${targetDeployment.version})`);

      const containerName = `clouddeploy-${projectId}`;
      const containerPort = (project.framework === 'Express' || project.framework === 'NodeJS' || project.framework === 'Python Flask') ? 5000 : 80;

      try {
        await stopAndRemoveContainer(containerName, (log) => writeLog(deploymentId, log, 'deploy'));
        
        await runContainer(
          targetDeployment.dockerImage,
          containerName,
          project.assignedPort,
          containerPort,
          (log) => writeLog(deploymentId, log, 'deploy')
        );

        await DeploymentModel.update(deploymentId, { status: 'success' });
        SocketService.emitStatus(deploymentId, 'success');
        await writeLog(deploymentId, `[System] Rollback completed successfully. Project is live.`);
      } catch (e) {
        await DeploymentModel.update(deploymentId, { status: 'failed' });
        SocketService.emitStatus(deploymentId, 'failed');
        await writeLog(deploymentId, `[System Error] Rollback execution failed: ${e.message}`);
      }
    }, 500);

  } catch (err) {
    res.status(500).json({ error: 'Failed to process rollback.' });
  }
};

export const getLogs = async (req, res) => {
  const { deploymentId } = req.params;

  try {
    const logs = await LogModel.findByDeploymentId(deploymentId);
    
    // Check if the deployment is active and has real docker logs
    const deployment = await DeploymentModel.findById(deploymentId);
    let dockerLogs = '';
    if (deployment && deployment.status === 'success') {
      try {
        dockerLogs = await getContainerLogs(`clouddeploy-${deployment.projectId}`);
      } catch (err) {}
    }

    res.json({
      dbLogs: logs,
      dockerLogs
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs.' });
  }
};

export const getHistory = async (req, res) => {
  const { id: projectId } = req.params;

  try {
    const history = await DeploymentModel.findByProjectId(projectId);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch deployment history.' });
  }
};
