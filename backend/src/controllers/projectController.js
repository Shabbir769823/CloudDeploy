import { ProjectModel } from '../models/projectModel.js';
import { cloneRepository } from '../services/githubService.js';
import { detectFramework } from '../utils/frameworkDetector.js';
import { stopAndRemoveContainer } from '../services/dockerService.js';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

export const createProject = async (req, res) => {
  const { 
    projectName, 
    description, 
    githubRepo, 
    branch = 'main', 
    framework = 'auto', 
    serverIP, 
    sshKey, 
    sshUser 
  } = req.body;

  if (!projectName || !githubRepo) {
    return res.status(400).json({ error: 'Project name and GitHub Repository URL are required.' });
  }

  const projectId = crypto.randomUUID();
  const tempDir = path.resolve(process.cwd(), `../uploads/temp_${projectId}`);

  try {
    let finalFramework = framework;
    let finalLanguage = 'HTML/CSS/JS';

    // Auto-detect framework
    if (framework === 'auto' || !framework) {
      console.log(`[Project Wizard] Triggering temp clone to auto-detect framework...`);
      try {
        await cloneRepository(githubRepo, branch, tempDir);
        const detection = detectFramework(tempDir);
        finalFramework = detection.framework;
        finalLanguage = detection.language;
      } catch (err) {
        console.warn('Auto framework detection failed, using fallback static HTML.', err.message);
        finalFramework = 'HTML CSS JS';
        finalLanguage = 'HTML/CSS/JS';
      } finally {
        // Clean up temp dir
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      }
    } else {
      // Map explicit framework to language
      const langMap = {
        'HTML CSS JS': 'HTML/CSS/JS',
        'React': 'JavaScript',
        'Angular': 'TypeScript',
        'Vue': 'JavaScript',
        'NodeJS': 'JavaScript',
        'Express': 'JavaScript',
        'Python Flask': 'Python',
        'Django': 'Python'
      };
      finalLanguage = langMap[framework] || 'JavaScript';
    }

    // Allocate an unused port
    const assignedPort = await ProjectModel.findAvailablePort();

    const newProject = await ProjectModel.create({
      id: projectId,
      userId: req.user.id,
      projectName,
      description,
      githubRepo,
      branch,
      framework: finalFramework,
      language: finalLanguage,
      assignedPort,
      serverIP: serverIP || null,
      sshKey: sshKey || null,
      sshUser: sshUser || null
    });

    res.status(201).json(newProject);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project.' });
  }
};

export const listProjects = async (req, res) => {
  try {
    const projects = await ProjectModel.findByUserId(req.user.id);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list projects.' });
  }
};

export const getProject = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await ProjectModel.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Check ownership
    if (project.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to view this project.' });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve project details.' });
  }
};

export const deleteProject = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await ProjectModel.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Check ownership
    if (project.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this project.' });
    }

    // Stop and delete container if it exists
    const containerName = `clouddeploy-${id}`;
    await stopAndRemoveContainer(containerName);

    // Delete project files if any
    const projectDir = path.resolve(process.cwd(), `../uploads/${id}`);
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }

    await ProjectModel.delete(id);
    res.json({ success: true, message: 'Project and all active containers deleted.' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Failed to delete project.' });
  }
};
