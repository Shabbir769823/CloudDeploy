# CloudDeploy – AI Powered Automated Deployment Platform

**CloudDeploy** is a web-based DevOps automation platform that simplifies application deployment. It automates Git pulling, framework detection, Docker containerization, AWS EC2 SSH dispatch, real-time logging, and system-wide monitoring through a high-end dark-mode user dashboard.

---

## 🚀 Key Features

- **Full User Authentication System**: Register, Login, Profile credentials, and **Two-Factor Authentication (2FA)**.
- **Smart Project Creation**: Simply connect a GitHub repository. CloudDeploy pulls the codebase, auto-detects the framework, and automatically provisions an available host port.
- **Dynamic Containerization Engine**: Automatically generates optimized Dockerfiles for various stacks (React, Vue, Node, Flask, Django) if one doesn't exist, builds, and launches them.
- **Dual Deployment Pipelines**:
  1. **Local Mode**: Builds sibling containers directly on the host machine using mounted Docker socket integrations.
  2. **AWS EC2 Mode**: SSHes into remote cloud servers, clones codebases, builds images, and spawns containers securely.
- **Live Terminal & Streamed Logs**: Emits real-time build and deploy terminal prints via **Socket.io** channels.
- **Resource Analytics**: Integrates Recharts to render live server CPU and memory usage.
- **One-Click Rollbacks**: Revert running containers to cached versions of previous successful deployments instantly.
- **Email Notifications**: Automatically alerts developers of build successes and deployment issues.
- **Admin Control Center**: Access restricted dashboards to view all registered users and manage active containers globally.
- **Infrastructure-as-Code (Terraform)**: Pre-configured configurations to provision AWS EC2 runners automatically.
- **Prometheus Monitoring**: Metric collectors pre-configured to monitor system nodes.

---

## 🏗️ Architecture

```
                       Browser (React UI)
                              │
                    ┌─────────▼─────────┐
                    │  Nginx Proxy Gateway
                    │     (Port 80)     │
                    └────┬───────────┬──┘
            /api & WS    │           │   Static Assets
        ┌────────────────┘           └──────────────┐
┌───────▼───────┐                            ┌──────▼──────┐
│ Express API   │                            │ Vite React  │
│  (Port 5000)  │                            │  (Port 3000)│
└───────┬───────┘                            └─────────────┘
        │
        ├───────────────┬────────────────┬──────────────┐
┌───────▼───────┐┌──────▼──────┐  ┌──────▼──────┐┌──────▼──────┐
│ SQLite DB     ││ Docker Socket│  │ SSH2        ││ Nodemailer  │
│ (Metadata/Logs││ (Host engine)│  │ (AWS EC2)   ││ (Mail Alert)│
└───────────────┘└─────────────┘  └─────────────┘└─────────────┘
```

---

## 📂 Project Structure

```
CloudDeploy/
├── backend/                  # Express.js REST API & Services
│   ├── src/
│   │   ├── config/           # SQLite connection & database seeders
│   │   ├── controllers/      # Route controllers (Auth, Projects, Deployments, Admin)
│   │   ├── models/           # DB schema accessors (User, Project, Deployment, Log)
│   │   ├── routes/           # REST endpoints mapping
│   │   ├── services/         # Docker, SSH, GitHub, and Mailer integrations
│   │   ├── utils/            # Framework detector, Dockerfile compiler
│   │   └── app.js            # Entry point, Socket.io setup, & live broadcaster
│   ├── package.json
│   └── .env
├── frontend/                 # React UI + Tailwind Dashboard
│   ├── src/
│   │   ├── components/       # Layouts (Sidebar, Navbar)
│   │   ├── pages/            # Core dashboard modules (Console, Analytics, Profile, Admin)
│   │   ├── context/          # Auth session manager
│   │   ├── App.jsx           # Routes and security barriers
│   │   └── index.css         # Glassmorphic themes & custom filters
│   ├── package.json
│   └── vite.config.js
├── terraform/                # Infrastructure-as-Code (AWS EC2 provisioning)
├── prometheus/               # Prometheus analytics scraper
├── nginx/                    # Reverse-proxy config mapping
└── docker-compose.yml        # Multi-container orchestration
```

---

## 🔑 Default Seeded Accounts

For testing and presentation convenience, the SQLite database is automatically seeded with two active roles:

1. **Administrator (Admin Dashboard)**:
   - **Email**: `admin@clouddeploy.com`
   - **Password**: `admin123`
2. **Developer (Standard Dashboard)**:
   - **Email**: `dev@clouddeploy.com`
   - **Password**: `dev123`

---

## ⚙️ How to Run the Project

### Prerequisites
1. **Node.js** (v18+)
2. **Git** (for code pull integrations)
3. **Docker & Docker Compose** (highly recommended)

### Option A: Complete Microservices Run (Via Docker Compose)
To run the entire ecosystem (Frontend, Backend, Nginx Proxy, and Prometheus Monitoring) in one command:
```bash
docker-compose up --build
```
Once active, the services are available at:
- **CloudDeploy Portal (Nginx Gateway)**: [http://localhost](http://localhost) (Port 80)
- **Vite React UI Server**: [http://localhost:3000](http://localhost:3000)
- **Express API Endpoint**: [http://localhost:5000](http://localhost:5000)
- **Prometheus Monitoring Server**: [http://localhost:9090](http://localhost:9090)

---

### Option B: Local Running (For Development)

If you wish to run the frontend and backend manually without Docker Compose:

#### 1. Start Express Backend
```bash
cd backend
npm install
npm run start
```
The backend database (`database/clouddeploy.db`) will initialize automatically.

#### 2. Start React Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ Presentation Tips for Final-Year CSE Project

1. **Demonstrate Framework Detection**: Create a project, input a public React/Node repo (e.g., `https://github.com/octocat/Spoon-Knife.git`), select **✨ Automatic Framework Detection**, and watch it resolve structural properties automatically.
2. **Mounting Docker Socket**: Highlight that by mounting `/var/run/docker.sock`, CloudDeploy operates similarly to industry DevOps tools like Portainer. It is containerized itself but spawns sibling containers on the host machine.
3. **Showcase Resiliency (Simulator Mode)**: Explain that if Docker is down or remote EC2 connections are throttled, the application falls back gracefully to high-fidelity console simulators to prevent presentation failures.
4. **Highlight Terraform**: Point out the Infrastructure-as-Code scripts (`terraform/`) to prove how easy it is to scale this runner architecture globally on AWS.
