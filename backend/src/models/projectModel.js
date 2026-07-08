import { run, get, query } from '../config/db.js';

export const ProjectModel = {
  findById: async (id) => {
    return await get('SELECT * FROM projects WHERE id = ?', [id]);
  },

  findByUserId: async (userId) => {
    return await query('SELECT * FROM projects WHERE userId = ? ORDER BY createdAt DESC', [userId]);
  },

  findAll: async () => {
    return await query('SELECT * FROM projects ORDER BY createdAt DESC');
  },

  create: async ({
    id,
    userId,
    projectName,
    description = '',
    githubRepo,
    branch = 'main',
    framework = 'HTML CSS JS',
    language = 'HTML/CSS/JS',
    assignedPort = null,
    serverIP = null,
    sshKey = null,
    sshUser = null
  }) => {
    await run(
      `INSERT INTO projects (
        id, userId, projectName, description, githubRepo, branch, 
        framework, language, assignedPort, serverIP, sshKey, sshUser
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, userId, projectName, description, githubRepo, branch,
        framework, language, assignedPort, serverIP, sshKey, sshUser
      ]
    );
    return ProjectModel.findById(id);
  },

  update: async (id, fields) => {
    const keys = Object.keys(fields);
    if (keys.length === 0) return ProjectModel.findById(id);

    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = Object.values(fields);
    
    await run(`UPDATE projects SET ${setClause} WHERE id = ?`, [...values, id]);
    return ProjectModel.findById(id);
  },

  delete: async (id) => {
    return await run('DELETE FROM projects WHERE id = ?', [id]);
  },

  // Helper to find next available host port
  findAvailablePort: async () => {
    // Port range: 8001 - 8999
    const defaultStartPort = 8001;
    const projects = await query('SELECT assignedPort FROM projects WHERE assignedPort IS NOT NULL');
    const usedPorts = projects.map(p => p.assignedPort);

    let port = defaultStartPort;
    while (usedPorts.includes(port)) {
      port++;
    }
    return port;
  }
};
