import fs from 'fs';
import path from 'path';

export const detectFramework = (projectDir) => {
  try {
    const files = fs.readdirSync(projectDir);

    // 1. Check for Node.js (package.json)
    if (files.includes('package.json')) {
      const pkgPath = path.join(projectDir, 'package.json');
      const pkgContent = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      const deps = { ...(pkgContent.dependencies || {}), ...(pkgContent.devDependencies || {}) };

      if (deps['react']) {
        return { framework: 'React', language: 'JavaScript' };
      }
      if (deps['@angular/core']) {
        return { framework: 'Angular', language: 'TypeScript' };
      }
      if (deps['vue']) {
        return { framework: 'Vue', language: 'JavaScript' };
      }
      if (deps['express']) {
        return { framework: 'Express', language: 'JavaScript' };
      }
      return { framework: 'NodeJS', language: 'JavaScript' };
    }

    // 2. Check for Python (manage.py, requirements.txt, app.py)
    if (files.includes('manage.py')) {
      return { framework: 'Django', language: 'Python' };
    }

    const hasPythonFiles = files.some(f => f.endsWith('.py'));
    const hasRequirements = files.includes('requirements.txt');
    if (hasRequirements) {
      const reqPath = path.join(projectDir, 'requirements.txt');
      const reqContent = fs.readFileSync(reqPath, 'utf-8').toLowerCase();
      if (reqContent.includes('flask')) {
        return { framework: 'Python Flask', language: 'Python' };
      }
      if (reqContent.includes('django')) {
        return { framework: 'Django', language: 'Python' };
      }
      return { framework: 'Python Flask', language: 'Python' }; // fallback Python
    }

    if (hasPythonFiles && (files.includes('app.py') || files.includes('main.py'))) {
      return { framework: 'Python Flask', language: 'Python' };
    }

    // 3. Check for Static HTML/CSS/JS
    if (files.includes('index.html')) {
      return { framework: 'HTML CSS JS', language: 'HTML/CSS/JS' };
    }

    // Default Fallback
    return { framework: 'HTML CSS JS', language: 'HTML/CSS/JS' };
  } catch (err) {
    console.error('Error during framework detection:', err);
    return { framework: 'HTML CSS JS', language: 'HTML/CSS/JS' };
  }
};
