import { run, get, query } from '../config/db.js';

export const UserModel = {
  findById: async (id) => {
    return await get('SELECT id, name, email, role, twoFactorEnabled, createdAt FROM users WHERE id = ?', [id]);
  },

  findByEmail: async (email) => {
    return await get('SELECT * FROM users WHERE email = ?', [email]);
  },

  create: async ({ id, name, email, password, role = 'developer' }) => {
    await run(
      'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, password, role]
    );
    return { id, name, email, role };
  },

  updateProfile: async (id, { name, email, password }) => {
    if (password) {
      await run(
        'UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?',
        [name, email, password, id]
      );
    } else {
      await run(
        'UPDATE users SET name = ?, email = ? WHERE id = ?',
        [name, email, id]
      );
    }
    return UserModel.findById(id);
  },

  update2FA: async (id, { secret, enabled }) => {
    await run(
      'UPDATE users SET twoFactorSecret = ?, twoFactorEnabled = ? WHERE id = ?',
      [secret, enabled ? 1 : 0, id]
    );
    return true;
  },

  findAll: async () => {
    return await query('SELECT id, name, email, role, createdAt FROM users');
  },

  delete: async (id) => {
    return await run('DELETE FROM users WHERE id = ?', [id]);
  }
};
