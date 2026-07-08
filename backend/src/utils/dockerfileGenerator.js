import fs from 'fs';
import path from 'path';

export const generateDockerfile = (projectDir, framework) => {
  try {
    const dockerfilePath = path.join(projectDir, 'Dockerfile');

    // If Dockerfile already exists, do not overwrite it
    if (fs.existsSync(dockerfilePath)) {
      console.log('Dockerfile already exists in project root. Skipping generation.');
      return null;
    }

    let dockerfileContent = '';

    switch (framework) {
      case 'React':
      case 'Vue':
        // Detect if Vite is used by checking if vite.config.js exists
        const isVite = fs.existsSync(path.join(projectDir, 'vite.config.js')) || 
                       fs.existsSync(path.join(projectDir, 'vite.config.ts'));
        const buildFolder = isVite ? 'dist' : 'build';

        dockerfileContent = `FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/${buildFolder} /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;
        break;

      case 'Angular':
        dockerfileContent = `FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --configuration=production

FROM nginx:alpine
# In Angular, output is usually under dist/project-name. 
# We copy all subfolders of dist to nginx html folder.
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;
        break;

      case 'Express':
      case 'NodeJS':
        let pkgContent = {};
        try {
          const pkgPath = path.join(projectDir, 'package.json');
          if (fs.existsSync(pkgPath)) {
            pkgContent = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
          }
        } catch (e) {}

        const hasStartScript = pkgContent.scripts && pkgContent.scripts.start;
        const entryPoint = pkgContent.main || 'app.js';
        
        dockerfileContent = `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
${hasStartScript ? 'CMD ["npm", "start"]' : `CMD ["node", "${entryPoint}"]`}
`;
        break;

      case 'Python Flask':
        dockerfileContent = `FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt* ./
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; else pip install flask; fi
COPY . .
EXPOSE 5000
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
CMD ["flask", "run"]
`;
        break;

      case 'Django':
        dockerfileContent = `FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt* ./
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi
COPY . .
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
`;
        break;

      case 'HTML CSS JS':
      default:
        dockerfileContent = `FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;
        break;
    }

    fs.writeFileSync(dockerfilePath, dockerfileContent, 'utf-8');
    console.log(`Generated Dockerfile for ${framework} framework.`);
    return dockerfileContent;
  } catch (err) {
    console.error('Error generating Dockerfile:', err);
    return null;
  }
};
