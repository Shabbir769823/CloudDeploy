import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { 
  Plus, 
  Search, 
  Cpu, 
  HardDrive, 
  Layers, 
  Activity, 
  GitPullRequest, 
  Settings, 
  Trash2, 
  ExternalLink,
  Loader2,
  Terminal,
  Play,
  ShieldAlert
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const DashboardPage = () => {
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Dashboard stats & live telemetry
  const [summary, setSummary] = useState({
    totalProjects: 0,
    activeDeployments: 0,
    failedDeployments: 0,
    runningContainers: 0
  });

  const [telemetry, setTelemetry] = useState({ cpu: 0, ram: 0, disk: 42.6 });
  const [historyData, setHistoryData] = useState([]); // for live AreaChart

  useEffect(() => {
    fetchDashboardData();

    // Configure socket to receive live server metrics
    const socket = io('/');
    socket.on('server:stats', (data) => {
      setTelemetry({ cpu: data.cpu, ram: data.ram, disk: data.disk });
      
      // Update historical chart data (keep last 12 points)
      setHistoryData(prev => {
        const next = [...prev, {
          time: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          cpu: data.cpu,
          ram: data.ram
        }];
        if (next.length > 12) next.shift();
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [projectsRes, statsRes] = await Promise.all([
        axios.get('/api/projects'),
        axios.get('/api/server/stats')
      ]);

      setProjects(projectsRes.data);
      setSummary(statsRes.data.summary);
      setTelemetry({ cpu: statsRes.data.cpu, ram: statsRes.data.ram, disk: statsRes.data.disk });

      // Initialize chart with empty/default points
      const initialPoints = Array.from({ length: 8 }, (_, i) => ({
        time: new Date(Date.now() - (8 - i) * 3000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        cpu: statsRes.data.cpu + (Math.random() * 4 - 2),
        ram: statsRes.data.ram
      }));
      setHistoryData(initialPoints);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDeploy = async (projectId) => {
    try {
      const res = await axios.post(`/api/projects/${projectId}/deploy`);
      // Navigate to project log console
      navigate(`/projects/${projectId}?activeDeploymentId=${res.data.id}`);
    } catch (err) {
      alert('Failed to trigger deployment: ' + (err.response?.data?.error || err.message));
    }
  };

  const filteredProjects = projects.filter(p => 
    p.projectName.toLowerCase().includes(search.toLowerCase()) ||
    p.framework.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Upper Widgets section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Projects Card */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-neonBlue shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Projects</p>
            <h3 className="text-3xl font-bold text-gray-100">{summary.totalProjects}</h3>
          </div>
          <div className="p-3 bg-neonBlue/10 text-neonBlue rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Running Containers */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-neonGreen shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Active Deployments</p>
            <h3 className="text-3xl font-bold text-neonGreen glow-text-green">{summary.activeDeployments}</h3>
          </div>
          <div className="p-3 bg-neonGreen/10 text-neonGreen rounded-xl">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Failed Deployments */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-red-500 shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Failed Builds</p>
            <h3 className="text-3xl font-bold text-red-400">{summary.failedDeployments}</h3>
          </div>
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Host Memory */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-neonPurple shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Host RAM Load</p>
            <h3 className="text-3xl font-bold text-neonPurple glow-text-purple">{telemetry.ram}%</h3>
          </div>
          <div className="p-3 bg-neonPurple/10 text-neonPurple rounded-xl">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Live Server Monitoring Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-gray-200">Engine Metrics History</h4>
              <p className="text-xs text-gray-400 font-light">Real-time CPU and Memory utilization of the deployment host</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-neonBlue font-mono glow-text-blue">
              <span className="h-2 w-2 rounded-full bg-neonBlue animate-pulse" /> LIVE STREAM
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#bd00ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#bd00ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#4b5563" fontSize={10} tickLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} domain={[0, 100]} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#151c2c', borderColor: '#374151', color: '#f3f4f6' }} />
                <Area type="monotone" dataKey="cpu" name="CPU %" stroke="#00f0ff" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} />
                <Area type="monotone" dataKey="ram" name="RAM %" stroke="#bd00ff" fillOpacity={1} fill="url(#colorRam)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time server telemetry cards */}
        <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-6 flex flex-col justify-between">
          <h4 className="text-sm font-bold text-gray-200">Resource Gauges</h4>
          
          <div className="space-y-4">
            {/* CPU Gauge */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-medium flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-neonBlue" /> CPU Load</span>
                <span className="text-neonBlue font-semibold font-mono">{telemetry.cpu}%</span>
              </div>
              <div className="h-2.5 bg-darkBg rounded-full overflow-hidden border border-gray-800">
                <div className="h-full bg-gradient-to-r from-neonBlue to-cyan-400 transition-all duration-1000 shadow-neonBlue" style={{ width: `${telemetry.cpu}%` }} />
              </div>
            </div>

            {/* RAM Gauge */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-medium flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-neonPurple" /> RAM Footprint</span>
                <span className="text-neonPurple font-semibold font-mono">{telemetry.ram}%</span>
              </div>
              <div className="h-2.5 bg-darkBg rounded-full overflow-hidden border border-gray-800">
                <div className="h-full bg-gradient-to-r from-neonPurple to-pink-500 transition-all duration-1000 shadow-neonPurple" style={{ width: `${telemetry.ram}%` }} style={{ width: `${telemetry.ram}%` }} />
              </div>
            </div>

            {/* Disk Gauge */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-medium flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-neonGreen" /> Storage Volume</span>
                <span className="text-neonGreen font-semibold font-mono">{telemetry.disk}%</span>
              </div>
              <div className="h-2.5 bg-darkBg rounded-full overflow-hidden border border-gray-800">
                <div className="h-full bg-gradient-to-r from-neonGreen to-emerald-400 transition-all duration-1000 shadow-neonGreen" style={{ width: `${telemetry.disk}%` }} />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800/60 text-xs text-gray-500 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-neonGreen animate-pulse" /> Telemetry signals are active and synchronized.
          </div>
        </div>
      </div>

      {/* Projects List Section */}
      <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-md font-bold text-gray-100">User Projects</h4>
            <p className="text-xs text-gray-400 font-light">Manage and review your active codebases</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:outline-none text-xs w-48 focus:w-60 transition-all"
              />
            </div>
            <Link
              to="/projects/create"
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-neonBlue to-neonPurple rounded-xl text-xs font-semibold text-white hover:opacity-90 shadow-sm"
            >
              <Plus className="w-4.5 h-4.5" /> Create Project
            </Link>
          </div>
        </div>

        {/* Table grid */}
        {loading ? (
          <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-neonBlue animate-spin" />
            <p className="text-xs">Gathering project lists...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-gray-800 rounded-xl">
            <p className="text-sm text-gray-500">No projects found. Create one to begin!</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-xs font-medium text-gray-400 bg-gray-800/10">
                  <th className="p-4">Project Details</th>
                  <th className="p-4">Framework</th>
                  <th className="p-4">GitHub Repository</th>
                  <th className="p-4">Assigned Port</th>
                  <th className="p-4">Destination Host</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40 text-xs">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-800/10 transition-all">
                    <td className="p-4">
                      <div className="space-y-1">
                        <Link to={`/projects/${project.id}`} className="font-bold text-gray-200 hover:text-neonBlue text-sm transition-all">
                          {project.projectName}
                        </Link>
                        <p className="text-gray-500 font-light truncate max-w-xs">{project.description || 'No description provided'}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded bg-darkBg border border-gray-800 font-mono text-[10px] text-gray-300">
                        {project.framework}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-gray-400 max-w-xs truncate">
                        <GitPullRequest className="w-3.5 h-3.5 text-neonPurple" />
                        <span className="truncate">{project.githubRepo.replace('https://github.com/', '')}</span>
                        <span className="text-[10px] text-gray-500">({project.branch})</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-gray-300">
                      {project.assignedPort ? `:${project.assignedPort}` : '-'}
                    </td>
                    <td className="p-4 text-gray-400 font-mono">
                      {project.serverIP || 'Local Engine'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Quick View */}
                        <Link
                          to={`/projects/${project.id}`}
                          className="p-1.5 text-gray-400 hover:text-neonBlue hover:bg-neonBlue/5 rounded-lg border border-transparent hover:border-neonBlue/10 transition-all"
                          title="View Controls"
                        >
                          <Terminal className="w-4 h-4" />
                        </Link>
                        
                        {/* Trigger Deploy */}
                        <button
                          onClick={() => handleQuickDeploy(project.id)}
                          className="p-1.5 text-neonGreen hover:bg-neonGreen/5 rounded-lg border border-transparent hover:border-neonGreen/10 transition-all"
                          title="Trigger Quick Deploy"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
