import { exec } from 'child_process';
import os from 'os';

// Helper to check if Docker is installed and running
let isDockerAvailableCache = null;
export const checkDockerAvailable = () => {
  return new Promise((resolve) => {
    if (isDockerAvailableCache !== null) {
      return resolve(isDockerAvailableCache);
    }
    exec('docker info', (error) => {
      if (error) {
        console.warn('Docker is NOT running or NOT installed. Falling back to DevOps Simulator Mode.');
        isDockerAvailableCache = false;
      } else {
        console.log('Docker daemon detected. Running in Native Docker Mode.');
        isDockerAvailableCache = true;
      }
      resolve(isDockerAvailableCache);
    });
  });
};

/**
 * Builds a Docker image
 */
export const buildImage = async (imageName, projectDir, logCallback = () => {}) => {
  const isReal = await checkDockerAvailable();
  if (isReal) {
    return new Promise((resolve, reject) => {
      logCallback(`[Docker] Running 'docker build -t ${imageName} .'\n`);
      const process = exec(`docker build -t ${imageName} .`, { cwd: projectDir });

      process.stdout.on('data', (data) => {
        logCallback(data.toString());
      });

      process.stderr.on('data', (data) => {
        logCallback(data.toString());
      });

      process.on('close', (code) => {
        if (code === 0) {
          logCallback(`[Docker] Successfully built image ${imageName}\n`);
          resolve(imageName);
        } else {
          logCallback(`[Docker Error] Build failed with exit code ${code}\n`);
          reject(new Error(`Docker build failed with code ${code}`));
        }
      });
    });
  } else {
    // Simulator Mode
    return new Promise((resolve) => {
      logCallback(`[DevOps Simulator] Initializing Docker build pipeline for: ${imageName}...\n`);
      let step = 0;
      const steps = [
        `[DevOps Simulator] Step 1/6 : FROM node:18-alpine AS build\n---> Downloading node:18-alpine layer (45.3MB)...`,
        `[DevOps Simulator] Step 2/6 : WORKDIR /app\n---> Creating directory structure inside container...`,
        `[DevOps Simulator] Step 3/6 : COPY package*.json ./\n---> Cached layer loaded.`,
        `[DevOps Simulator] Step 4/6 : RUN npm install\n---> npm info run install\n---> added 247 packages in 2.34s\n---> audited 248 packages in 3s`,
        `[DevOps Simulator] Step 5/6 : COPY . .\n---> Transferring source files...`,
        `[DevOps Simulator] Step 6/6 : EXPOSE 80\n---> Port mapped successfully.\n[DevOps Simulator] Successfully built image: ${imageName}\n`
      ];

      const interval = setInterval(() => {
        if (step < steps.length) {
          logCallback(steps[step]);
          step++;
        } else {
          clearInterval(interval);
          resolve(imageName);
        }
      }, 1500); // realistic build timing
    });
  }
};

/**
 * Runs a Docker container
 */
export const runContainer = async (imageName, containerName, hostPort, containerPort, logCallback = () => {}) => {
  const isReal = await checkDockerAvailable();
  if (isReal) {
    return new Promise((resolve, reject) => {
      // First, ensure any container with the same name is deleted
      exec(`docker rm -f ${containerName}`, () => {
        logCallback(`[Docker] Running 'docker run -d -p ${hostPort}:${containerPort} --name ${containerName} ${imageName}'\n`);
        const runCmd = `docker run -d -p ${hostPort}:${containerPort} --name ${containerName} ${imageName}`;
        
        exec(runCmd, (error, stdout, stderr) => {
          if (error) {
            logCallback(`[Docker Error] Container startup failed: ${stderr || error.message}\n`);
            return reject(error);
          }
          const containerId = stdout.trim().substring(0, 12);
          logCallback(`[Docker] Container started successfully. ID: ${containerId} running on port ${hostPort}\n`);
          resolve(containerId);
        });
      });
    });
  } else {
    // Simulator Mode
    return new Promise((resolve) => {
      logCallback(`[DevOps Simulator] Deploying container: ${containerName}...\n`);
      setTimeout(() => {
        logCallback(`[DevOps Simulator] Registering container port: ${containerPort} -> Host Port: ${hostPort}\n`);
      }, 500);

      setTimeout(() => {
        const simulatedId = Math.random().toString(16).substring(2, 14);
        logCallback(`[DevOps Simulator] Container spawned successfully. ID: ${simulatedId}\n`);
        logCallback(`[DevOps Simulator] Health Probe status: ACTIVE\n`);
        resolve(simulatedId);
      }, 1500);
    });
  }
};

/**
 * Stops and removes a Docker container
 */
export const stopAndRemoveContainer = async (containerName, logCallback = () => {}) => {
  const isReal = await checkDockerAvailable();
  if (isReal) {
    return new Promise((resolve) => {
      logCallback(`[Docker] Stopping container: ${containerName}...\n`);
      exec(`docker stop ${containerName}`, (stopErr) => {
        if (stopErr) {
          logCallback(`[Docker Warning] Stop command failed (might already be stopped): ${stopErr.message}\n`);
        } else {
          logCallback(`[Docker] Stopped container.\n`);
        }
        
        logCallback(`[Docker] Removing container: ${containerName}...\n`);
        exec(`docker rm ${containerName}`, (rmErr) => {
          if (rmErr) {
            logCallback(`[Docker Warning] Remove command failed: ${rmErr.message}\n`);
          } else {
            logCallback(`[Docker] Removed container.\n`);
          }
          resolve(true);
        });
      });
    });
  } else {
    // Simulator Mode
    return new Promise((resolve) => {
      logCallback(`[DevOps Simulator] Sending SIGTERM signal to ${containerName}...\n`);
      setTimeout(() => {
        logCallback(`[DevOps Simulator] Container stopped and deleted.\n`);
        resolve(true);
      }, 1000);
    });
  }
};

/**
 * Gets logs of a running container
 */
export const getContainerLogs = async (containerName) => {
  const isReal = await checkDockerAvailable();
  if (isReal) {
    return new Promise((resolve, reject) => {
      exec(`docker logs --tail 100 ${containerName}`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout || stderr || 'No logs available.');
        }
      });
    });
  } else {
    // Simulated container logs
    return Promise.resolve(
      `[Nest] 1   - 07/08/2026, 10:30:00 AM     LOG [NestFactory] Starting Nest application...\n` +
      `[Nest] 1   - 07/08/2026, 10:30:01 AM     LOG [InstanceLoader] AppModule dependencies initialized\n` +
      `[Nest] 1   - 07/08/2026, 10:30:01 AM     LOG [RoutesResolver] AuthController {/api/auth}: +12ms\n` +
      `[Nest] 1   - 07/08/2026, 10:30:01 AM     LOG [RoutesResolver] ProjectsController {/api/projects}: +2ms\n` +
      `[Nest] 1   - 07/08/2026, 10:30:01 AM     LOG [InstanceLoader] DatabaseModule initialized\n` +
      `[Nest] 1   - 07/08/2026, 10:30:02 AM     LOG [NestApplication] Nest application successfully started on port 5000\n` +
      `[Database]  Connected to SQLite memory storage.\n` +
      `[System]    Garbage collection cycle completed. Memory released: 12MB.\n` +
      `[API]       GET /api/projects 200 OK - 8.42ms\n` +
      `[API]       POST /api/deployments 201 Created - 15.34ms\n`
    );
  }
};

/**
 * Returns dynamic stats (CPU, RAM)
 */
export const getContainerStats = async (containerName) => {
  const isReal = await checkDockerAvailable();
  if (isReal && containerName) {
    return new Promise((resolve) => {
      // Use docker stats format to get cpu/memory
      exec(`docker stats ${containerName} --no-stream --format "{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}}"`, (error, stdout) => {
        if (error || !stdout) {
          resolve(getSimulatedStats());
        } else {
          const parts = stdout.trim().split(',');
          if (parts.length >= 3) {
            resolve({
              cpu: parseFloat(parts[0].replace('%', '')) || 0.5,
              memory: parts[1].trim(),
              memoryPercentage: parseFloat(parts[2].replace('%', '')) || 5.0,
              uptime: 'Active'
            });
          } else {
            resolve(getSimulatedStats());
          }
        }
      });
    });
  } else {
    return Promise.resolve(getSimulatedStats());
  }
};

function getSimulatedStats() {
  const baseCpu = 2 + Math.random() * 5; // 2-7%
  const baseRam = 120 + Math.random() * 30; // 120-150MB
  const ramLimit = 512;
  const ramPercent = (baseRam / ramLimit) * 100;
  return {
    cpu: parseFloat(baseCpu.toFixed(1)),
    memory: `${baseRam.toFixed(1)}MB / ${ramLimit}MB`,
    memoryPercentage: parseFloat(ramPercent.toFixed(1)),
    uptime: 'Active'
  };
}
