import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Cloud, 
  Terminal, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  GitBranch, 
  History 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-[#070b13] min-h-screen text-gray-100 selection:bg-neonBlue/30 selection:text-white">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-gray-800/40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-neonBlue to-neonPurple rounded-lg">
            <Cloud className="w-6 h-6 animate-float" />
          </div>
          <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-white via-gray-200 to-neonBlue bg-clip-text text-transparent">
            CloudDeploy
          </span>
        </div>
        <div className="flex gap-4">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-neonBlue to-neonPurple hover:opacity-90 transition-all text-sm font-semibold tracking-wide"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-lg border border-gray-800 hover:border-gray-700 hover:bg-gray-800/20 transition-all text-sm font-semibold"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-neonBlue to-neonPurple hover:opacity-90 transition-all text-sm font-semibold tracking-wide"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center relative overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neonBlue/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-neonPurple/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neonBlue/10 border border-neonBlue/20 text-neonBlue text-xs font-mono tracking-widest uppercase mb-4">
            <Zap className="w-3.5 h-3.5 animate-pulse" /> AI Powered Automated Deployments
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            Deploy Applications to AWS <br/>
            <span className="bg-gradient-to-r from-neonBlue via-cyan-400 to-neonPurple bg-clip-text text-transparent glow-text-blue">
              In One Single Click
            </span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            CloudDeploy handles the complexity of Linux setup, Docker containerization, AWS EC2 configurations, SSL security, and CI/CD triggers automatically.
          </p>

          <div className="pt-6 flex justify-center gap-4">
            <Link
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-neonBlue to-neonPurple text-white font-semibold hover:scale-105 active:scale-95 transition-all shadow-neonBlue"
            >
              Get Started for Free
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 rounded-xl border border-gray-800 hover:bg-gray-800/30 text-gray-300 font-semibold transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Value Prop Cards */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        <div className="glass-panel p-8 rounded-2xl space-y-4 hover:border-neonBlue/30 hover:bg-darkCard/80 transition-all duration-300">
          <div className="p-3 bg-neonBlue/10 text-neonBlue rounded-xl w-fit">
            <GitBranch className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-200">Connect GitHub</h3>
          <p className="text-gray-400 font-light text-sm leading-relaxed">
            Connect public or private repositories. Our platform pulls code instantly, identifies structure, and detects configuration requirements.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl space-y-4 hover:border-neonPurple/30 hover:bg-darkCard/80 transition-all duration-300">
          <div className="p-3 bg-neonPurple/10 text-neonPurple rounded-xl w-fit">
            <Terminal className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-200">Automatic Dockerization</h3>
          <p className="text-gray-400 font-light text-sm leading-relaxed">
            No Dockerfile? No problem. CloudDeploy automatically builds an optimized image based on your runtime framework and exposes the application port.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl space-y-4 hover:border-neonGreen/30 hover:bg-darkCard/80 transition-all duration-300">
          <div className="p-3 bg-neonGreen/10 text-neonGreen rounded-xl w-fit">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-200">Host Telemetry & Monitoring</h3>
          <p className="text-gray-400 font-light text-sm leading-relaxed">
            Monitor container-level performance instantly. Track CPU load, RAM footprint, disk memory, and request traffic logs live.
          </p>
        </div>
      </section>

      {/* Feature highlight */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-gray-800/30">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Eliminate Manual <br/>
              AWS & SSH Configuration
            </h2>
            <p className="text-gray-400 font-light leading-relaxed">
              CloudDeploy SSHes directly into your target EC2 node, runs health checks, sets up reverse proxies, updates system caches, builds images, and executes container triggers under 1 minute.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-neonBlue" />
                <span className="text-sm text-gray-300 font-medium">Automatic Port Mapping & Firewalling</span>
              </div>
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-neonPurple" />
                <span className="text-sm text-gray-300 font-medium">Version Controlled Rollback Mechanism</span>
              </div>
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-neonGreen" />
                <span className="text-sm text-gray-300 font-medium">Socket.io Streamed Real-Time Build Terminal</span>
              </div>
            </div>
          </div>

          {/* Simulated Code Panel */}
          <div className="glass-panel p-6 rounded-2xl border border-gray-800 font-mono text-xs text-gray-400 shadow-2xl relative">
            <div className="flex items-center gap-1.5 border-b border-gray-800/80 pb-4 mb-4">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <span className="h-3 w-3 rounded-full bg-green-500/80" />
              <span className="text-gray-500 ml-2">clouddeploy@aws-ec2:~/pipeline</span>
            </div>
            <p className="text-neonBlue">$ clouddeploy trigger --project-id cd-2938</p>
            <p className="text-gray-400 mt-2">[System] Initializing clone process: git@github.com:dev/react-app.git</p>
            <p className="text-gray-400">[System] Framework detected: React (Vite Engine)</p>
            <p className="text-gray-400">[System] Compiling Dockerfile using Nginx multi-stage configuration...</p>
            <p className="text-neonPurple mt-2">$ docker build -t clouddeploy-app:v12 .</p>
            <p className="text-gray-500">---> Step 1/3 : FROM node:18-alpine AS build</p>
            <p className="text-gray-500">---> Step 2/3 : RUN npm install & npm run build</p>
            <p className="text-gray-500">---> Step 3/3 : COPY --from=build dist/ /usr/share/nginx/html</p>
            <p className="text-neonGreen mt-2">[Docker] Container active on port 8004. Status: Healthy 🚀</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-800/40 text-center text-xs text-gray-500">
        <p>© 2026 CloudDeploy Platform. Built for Final Year CSE DevOps Project.</p>
      </footer>
    </div>
  );
};

export default Home;
