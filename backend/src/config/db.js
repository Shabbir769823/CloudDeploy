import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve DB path relative to the execution root (which is backend/)
const dbPathRaw = process.env.DB_PATH || '../database/clouddeploy.db';
const dbPath = path.isAbsolute(dbPathRaw) ? dbPathRaw : path.resolve(process.cwd(), dbPathRaw);

// Ensure the target directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initializeDatabase();
  }
});

// Promisify database operations
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

async function initializeDatabase() {
  try {
    // 1. Create Users Table
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'developer',
        twoFactorSecret TEXT,
        twoFactorEnabled INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create Projects Table
    await run(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        projectName TEXT NOT NULL,
        description TEXT,
        githubRepo TEXT NOT NULL,
        branch TEXT DEFAULT 'main',
        framework TEXT,
        language TEXT,
        assignedPort INTEGER,
        serverIP TEXT,
        sshKey TEXT,
        sshUser TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 3. Create Deployments Table
    await run(`
      CREATE TABLE IF NOT EXISTS deployments (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        status TEXT NOT NULL,
        commitId TEXT,
        commitMessage TEXT,
        dockerImage TEXT,
        serverIP TEXT,
        port INTEGER,
        deploymentTime DATETIME DEFAULT CURRENT_TIMESTAMP,
        duration INTEGER,
        version INTEGER DEFAULT 1,
        FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // 4. Create Logs Table
    await run(`
      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        deploymentId TEXT NOT NULL,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(deploymentId) REFERENCES deployments(id) ON DELETE CASCADE
      )
    `);

    // Seed default admin and user if not exists
    const adminExists = await get("SELECT * FROM users WHERE email = 'admin@clouddeploy.com'");
    if (!adminExists) {
      const adminId = 'admin-user-uuid';
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await run(
        "INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)",
        [adminId, 'Admin User', 'admin@clouddeploy.com', hashedPassword, 'admin']
      );
      console.log('Seeded default Admin account: admin@clouddeploy.com / admin123');
    }

    const testUserExists = await get("SELECT * FROM users WHERE email = 'dev@clouddeploy.com'");
    if (!testUserExists) {
      const devId = 'dev-user-uuid';
      const hashedPassword = await bcrypt.hash('dev123', 10);
      await run(
        "INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)",
        [devId, 'Developer User', 'dev@clouddeploy.com', hashedPassword, 'developer']
      );
      console.log('Seeded default Developer account: dev@clouddeploy.com / dev123');
    }
  } catch (err) {
    console.error('Error seeding/initializing database:', err);
  }
}

export default db;
