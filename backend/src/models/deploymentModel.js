import { run, get, query } from '../config/db.js';

export const DeploymentModel = {
  findById: async (id) => {
    return await get('SELECT * FROM deployments WHERE id = ?', [id]);
  },

  findByProjectId: async (projectId) => {
    return await query(
      'SELECT * FROM deployments WHERE projectId = ? ORDER BY deploymentTime DESC',
      [projectId]
    );
  },

  findAll: async () => {
    return await query(
      `SELECT d.*, p.projectName FROM deployments d
       JOIN projects p ON d.projectId = p.id
       ORDER BY d.deploymentTime DESC`
    );
  },

  create: async ({
    id,
    projectId,
    status = 'queued',
    commitId = '',
    commitMessage = '',
    dockerImage = '',
    serverIP = '',
    port = null,
    duration = 0,
    version = 1
  }) => {
    await run(
      `INSERT INTO deployments (
        id, projectId, status, commitId, commitMessage, dockerImage, serverIP, port, duration, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, projectId, status, commitId, commitMessage, dockerImage, serverIP, port, duration, version]
    );
    return DeploymentModel.findById(id);
  },

  update: async (id, fields) => {
    const keys = Object.keys(fields);
    if (keys.length === 0) return DeploymentModel.findById(id);

    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = Object.values(fields);
    
    await run(`UPDATE deployments SET ${setClause} WHERE id = ?`, [...values, id]);
    return DeploymentModel.findById(id);
  },

  getNextVersion: async (projectId) => {
    const row = await get('SELECT MAX(version) as maxVer FROM deployments WHERE projectId = ?', [projectId]);
    return (row && row.maxVer ? row.maxVer : 0) + 1;
  },

  findLatestSuccess: async (projectId) => {
    return await get(
      `SELECT * FROM deployments 
       WHERE projectId = ? AND status = 'success' 
       ORDER BY version DESC LIMIT 1`,
      [projectId]
    );
  },

  delete: async (id) => {
    return await run('DELETE FROM deployments WHERE id = ?', [id]);
  }
};
