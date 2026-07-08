import { run, query } from '../config/db.js';

export const LogModel = {
  create: async ({ id, deploymentId, type = 'build', message }) => {
    await run(
      'INSERT INTO logs (id, deploymentId, type, message) VALUES (?, ?, ?, ?)',
      [id, deploymentId, type, message]
    );
    return { id, deploymentId, type, message };
  },

  findByDeploymentId: async (deploymentId, type = null) => {
    if (type) {
      return await query(
        'SELECT * FROM logs WHERE deploymentId = ? AND type = ? ORDER BY timestamp ASC',
        [deploymentId, type]
      );
    }
    return await query(
      'SELECT * FROM logs WHERE deploymentId = ? ORDER BY timestamp ASC',
      [deploymentId]
    );
  },

  deleteByDeploymentId: async (deploymentId) => {
    return await run('DELETE FROM logs WHERE deploymentId = ?', [deploymentId]);
  }
};
