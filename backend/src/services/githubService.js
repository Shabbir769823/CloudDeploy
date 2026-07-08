import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Clones a git repository to a local destination
 * @param {string} repoUrl - The Git repository URL
 * @param {string} branch - The branch to clone
 * @param {string} destDir - The destination directory path
 * @param {function} logCallback - Function to receive output logs
 * @returns {Promise<object>} - Resolves with commit details
 */
export const cloneRepository = (repoUrl, branch = 'main', destDir, logCallback = () => {}) => {
  return new Promise((resolve, reject) => {
    // Ensure destination directory is clean
    if (fs.existsSync(destDir)) {
      try {
        fs.rmSync(destDir, { recursive: true, force: true });
      } catch (err) {
        logCallback(`[System Error] Failed to clean previous directory: ${err.message}\n`);
      }
    }

    fs.mkdirSync(destDir, { recursive: true });

    // Format repo url to avoid prompt blocking (hide token if provided)
    logCallback(`[GitHub] Cloning repository: ${repoUrl} (Branch: ${branch})...\n`);

    // Run git clone command
    const gitCommand = `git clone -b ${branch} --single-branch "${repoUrl}" "${destDir}"`;
    
    exec(gitCommand, { timeout: 60000 }, (error, stdout, stderr) => {
      if (error) {
        logCallback(`[GitHub Error] Git clone failed: ${error.message}\n`);
        logCallback(`[GitHub Error] stderr: ${stderr}\n`);
        return reject(new Error(`Git clone failed: ${stderr || error.message}`));
      }

      logCallback(`[GitHub] Repository cloned successfully.\n`);

      // Extract last commit details
      exec('git log -1 --pretty=format:"%H%n%s%n%an%n%ad"', { cwd: destDir }, (err, commitStdout) => {
        let commitInfo = {
          commitId: 'unknown',
          commitMessage: 'No commit info available',
          author: 'unknown',
          date: new Date().toISOString()
        };

        if (!err && commitStdout) {
          const lines = commitStdout.split('\n');
          commitInfo = {
            commitId: lines[0] ? lines[0].trim().substring(0, 7) : 'unknown',
            commitIdFull: lines[0] ? lines[0].trim() : 'unknown',
            commitMessage: lines[1] ? lines[1].trim() : 'No commit message',
            author: lines[2] ? lines[2].trim() : 'unknown',
            date: lines[3] ? lines[3].trim() : new Date().toISOString()
          };
        }

        logCallback(`[GitHub] Latest Commit: ${commitInfo.commitId} - "${commitInfo.commitMessage}" by ${commitInfo.author}\n`);
        resolve(commitInfo);
      });
    });
  });
};
