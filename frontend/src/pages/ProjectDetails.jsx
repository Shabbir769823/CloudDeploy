import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { 
  ArrowLeft, 
  Play, 
  Square, 
  RotateCw, 
  Trash2, 
  Terminal as TermIcon, 
  History, 
  Activity, 
  Settings as SettingsIcon,
  GitFork,
  ExternalLink,
  Loader2,
  Calendar,
  AlertTriangle,
  RefreshCcw,
  CheckCircle2
} from 'lucide-react';

const ProjectDetails = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialDepId = searchParams.get('activeDeploymentId') || '';

  const [project, setProject] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [activeTab, setActiveTab] = useState('console');
  
  // Deployment triggers & state
  const [activeDeploymentId, setActiveDeploymentId] = useState(initialDepId);
  const [activeDeployment, setActiveDeployment] = useState(null);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [projectStats, setProjectStats] = useState({ cpu: 0, memory: '0MB / 512MB', memoryPercentage: 0 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const logsEndRef = useRef(null);

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  // Load container statistics periodically
  useEffect(() => {
    if (!project) return;
    
    const fetchStats = async () => {
      try {
        const res = await axios.get(`/api/projects/${projectId}/stats`);
        setProjectStats(res.data);
      } catch (err) {
        // Suppress statistic fetch errors when container is down
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [project]);

  // Handle live logs via Socket.io
  useEffect(() => {
    if (!activeDeploymentId) return;

    // Join room for this deployment
    const socket = io('/');
    socket.emit('join:deployment', activeDeploymentId);

    // Fetch past logs from DB first
    const fetchPastLogs = async () => {
      try {
        setLogsLoading(true);
        const res = await axios.get(`/api/projects/deployments/${activeDeploymentId}/logs`);
        const formatted = res.data.dbLogs.map(l => l.message);
        
        // Append container runtime logs if available
        if (res.data.dockerLogs) {
          formatted.push('\n--- [CONTAINER RUNTIME LOGS] ---\n' + res.data.dockerLogs);
        }
        
        setTerminalLogs(formatted);
      } catch (err) {
        console.error('Failed to load past logs:', err);
      } finally {
        setLogsLoading(false);
      }
    };
    fetchPastLogs();

    // Listen for real-time log emissions
    socket.on('log', (data) => {
      setTerminalLogs(prev => [...prev, data.message]);
    });

    // Listen for deployment status changes
    socket.on('status', async (data) => {
      // Reload deployment info
      try {
        const depRes = await axios.get(`/api/projects/deployments/${activeDeploymentId}/logs`); // we can update active dep status
        fetchProjectDetails(); // reload list & status
      } catch (e) {}
    });

    return () => {
      socket.emit('leave:deployment', activeDeploymentId);
      socket.disconnect();
    };
  }, [activeDeploymentId]);

  // Auto-scroll logs terminal
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const [projRes, historyRes] = await Promise.all([
        axios.get(`/api/projects/${projectId}`),
        axios.get(`/api/projects/${projectId}/history`)
      ]);

      setProject(projRes.data);
      setDeployments(historyRes.data);

      // Find if there is an active/building deployment
      const currentBuilding = historyRes.data.find(d => d.status === 'building' || d.status === 'queued');
      if (currentBuilding) {
        setActiveDeploymentId(currentBuilding.id);
        setActiveDeployment(currentBuilding);
      } else if (historyRes.data.length > 0) {
        // Default to latest deployment logs if none are building
        const latest = historyRes.data[0];
        if (!activeDeploymentId) {
          setActiveDeploymentId(latest.id);
          setActiveDeployment(latest);
        } else {
          const matched = historyRes.data.find(d => d.id === activeDeploymentId);
          setActiveDeployment(matched || latest);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to retrieve project details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    setActionLoading(true);
    try {
      setTerminalLogs([]); // Clear screen
      setActiveTab('console');
      const res = await axios.post(`/api/projects/${projectId}/deploy`);
      setActiveDeploymentId(res.data.id);
      setActiveDeployment(res.data);
      // Refresh history list immediately
      fetchProjectDetails();
    } catch (err) {
      alert('Deployment failed to start: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    if (!confirm('Are you sure you want to stop this container?')) return;
    setActionLoading(true);
    try {
      await axios.post(`/api/projects/${projectId}/stop`);
      alert('Container terminated successfully.');
      fetchProjectDetails();
    } catch (err) {
      alert('Stop action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestart = async () => {
    setActionLoading(true);
    try {
      await axios.post(`/api/projects/${projectId}/restart`);
      alert('Container restarted successfully.');
      fetchProjectDetails();
    } catch (err) {
      alert('Restart action failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRollback = async (depId) => {
    if (!confirm('Are you sure you want to rollback to this version?')) return;
    setActionLoading(true);
    try {
      setTerminalLogs([]);
      setActiveTab('console');
      const res = await axios.post(`/api/projects/${projectId}/rollback`, { targetDeploymentId: depId });
      setActiveDeploymentId(res.data.id);
      setActiveDeployment(res.data);
      fetchProjectDetails();
    } catch (err) {
      alert('Rollback failed to execute.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('WARNING: Deleting this project will permanently stop the running container and delete all database histories. Continue?')) return;
    setActionLoading(true);
    try {
      await axios.delete(`/api/projects/${projectId}`);
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to delete project.');
      setActionLoading(false);
    }
  };

  // Color code console lines
  const parseLogLine = (line, index) => {
    let colorClass = 'text-gray-400';
    
    if (line.includes('[System Error]')) {
      colorClass = 'text-red-500 font-bold';
    } else if (line.includes('[System]')) {
      colorClass = 'text-neonBlue font-semibold';
    } else if (line.includes('[Docker]') || line.includes('[Local Docker]')) {
      colorClass = 'text-cyan-400';
    } else if (line.includes('[GitHub]')) {
      colorClass = 'text-neonPurple';
    } else if (line.includes('successfully') || line.includes('Successfully') || line.includes('ACTIVE') || line.includes('completed')) {
      colorClass = 'text-neonGreen';
    } else if (line.startsWith('--->') || line.startsWith('Step ')) {
      colorClass = 'text-gray-500';
    }
    
    return <p key={index} className={`whitespace-pre-wrap ${colorClass}`}>{line}</p>;
  };

  if (loading && !project) {
    return (
      <div className="h-[80vh] flex items-center justify-center flex-col gap-3 text-gray-400">
        <Loader2 className="w-10 h-10 text-neonBlue animate-spin" />
        <p className="text-sm">Fetching project metrics...</p>
      </div>
    );
  }

  const latestDeployment = deployments[0];
  const isRunning = latestDeployment?.status === 'success';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Back link */}
      <div>
        <Link to="/dashboard" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-neonBlue transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
      </div>

      {/* Header Info Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-wide text-gray-100">{project?.projectName}</h2>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border ${
              latestDeployment?.status === 'success' 
                ? 'bg-neonGreen/10 text-neonGreen border-neonGreen/20 glow-text-green' 
                : latestDeployment?.status === 'building' 
                  ? 'bg-neonBlue/10 text-neonBlue border-neonBlue/20' 
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                latestDeployment?.status === 'success' 
                  ? 'bg-neonGreen' 
                  : latestDeployment?.status === 'building' 
                    ? 'bg-neonBlue animate-pulse' 
                    : 'bg-red-500'
              }`} />
              {latestDeployment?.status === 'success' ? 'Active Container' : latestDeployment?.status || 'Not Deployed'}
            </span>
          </div>
          <p className="text-xs text-gray-400 font-light max-w-xl">{project?.description || 'No description provided'}</p>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs text-gray-500 pt-1 font-mono">
            <div className="flex items-center gap-1.5">
              <GitFork className="w-3.5 h-3.5" />
              <span>{project?.githubRepo.replace('https://github.com/', '')}</span>
              <span className="text-neonPurple">({project?.branch})</span>
            </div>
            {project?.assignedPort && (
              <div>
                <span>Port Mapping: :<strong>{project?.assignedPort}</strong></span>
              </div>
            )}
            <div>
              <span>Environment: <strong>{project?.serverIP ? `AWS EC2 (${project.serverIP})` : 'Local Engine'}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDeploy}
            disabled={actionLoading || latestDeployment?.status === 'building'}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-neonBlue to-neonPurple rounded-xl text-xs font-bold text-white hover:opacity-90 transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" /> Deploy
          </button>
          
          <button
            onClick={handleRestart}
            disabled={actionLoading || !isRunning}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-800 hover:bg-gray-800/30 rounded-xl text-xs font-semibold text-gray-300 transition-all disabled:opacity-50"
            title="Restart Container"
          >
            <RotateCw className="w-4 h-4" /> Restart
          </button>

          <button
            onClick={handleStop}
            disabled={actionLoading || !isRunning}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-800 hover:bg-red-500/5 hover:border-red-500/20 rounded-xl text-xs font-semibold text-red-400 transition-all disabled:opacity-50"
            title="Stop Container"
          >
            <Square className="w-4 h-4" /> Stop
          </button>
        </div>
      </div>

      {/* Main layout: Tab items + stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation tabs */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex border-b border-gray-800 gap-6 text-sm font-medium">
            <button
              onClick={() => setActiveTab('console')}
              className={`pb-3 transition-all ${
                activeTab === 'console' ? 'border-b-2 border-neonBlue text-neonBlue font-semibold glow-text-blue' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="flex items-center gap-1.5"><TermIcon className="w-4 h-4" /> Console Terminal</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 transition-all ${
                activeTab === 'history' ? 'border-b-2 border-neonBlue text-neonBlue font-semibold glow-text-blue' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="flex items-center gap-1.5"><History className="w-4 h-4" /> Deployment History</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-3 transition-all ${
                activeTab === 'settings' ? 'border-b-2 border-neonBlue text-neonBlue font-semibold glow-text-blue' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="flex items-center gap-1.5"><SettingsIcon className="w-4 h-4" /> Config Settings</span>
            </button>
          </div>

          {/* TAB CONTENT: Console Terminal */}
          {activeTab === 'console' && (
            <div className="glass-panel rounded-2xl border border-gray-850 bg-[#060911] shadow-2xl flex flex-col h-[500px]">
              {/* Console header */}
              <div className="p-4 border-b border-gray-800/80 flex items-center justify-between bg-darkCard/40">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <span className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-[10px] text-gray-500 font-mono ml-2">DEPLOYMENT TERMINAL: {activeDeploymentId ? activeDeploymentId.substring(0, 8) : 'Offline'}</span>
                </div>
                <div className="text-[10px] font-mono text-gray-500 flex items-center gap-2">
                  <span>Selected Version: v{activeDeployment?.version || '-'}</span>
                  {activeDeployment?.status === 'building' && <Loader2 className="w-3.5 h-3.5 text-neonBlue animate-spin" />}
                </div>
              </div>

              {/* Shell screen */}
              <div className="p-6 overflow-y-auto flex-1 font-mono text-[11px] leading-relaxed scrollbar-thin">
                {logsLoading ? (
                  <div className="h-full flex items-center justify-center flex-col gap-2 text-gray-500">
                    <Loader2 className="w-6 h-6 text-neonBlue animate-spin" />
                    <span>Loading logs database...</span>
                  </div>
                ) : terminalLogs.length === 0 ? (
                  <p className="text-gray-600 italic">No output logs recorded. Click 'Deploy' to spin up container.</p>
                ) : (
                  <>
                    {terminalLogs.map((line, idx) => parseLogLine(line, idx))}
                    <div ref={logsEndRef} />
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: Deployment History */}
          {activeTab === 'history' && (
            <div className="glass-panel p-6 rounded-2xl border border-gray-850 space-y-4">
              <h3 className="text-sm font-bold text-gray-200">Release Version History</h3>
              <div className="divide-y divide-gray-800/50">
                {deployments.map((dep, idx) => (
                  <div key={dep.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-200">Version {dep.version}</span>
                        <span className={`inline-block text-[9px] px-2 py-0.5 rounded font-mono ${
                          dep.status === 'success' ? 'bg-neonGreen/10 text-neonGreen' : dep.status === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-gray-800 text-gray-400'
                        }`}>
                          {dep.status.toUpperCase()}
                        </span>
                        {idx === 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-neonBlue/10 text-neonBlue border border-neonBlue/20 font-semibold font-mono">LATEST</span>}
                      </div>

                      <div className="text-xs text-gray-400 font-light flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        <span>{new Date(dep.deploymentTime).toLocaleString()}</span>
                        <span>•</span>
                        <span>Duration: {dep.duration ? `${dep.duration}s` : 'Unknown'}</span>
                      </div>

                      {dep.commitMessage && (
                        <p className="text-xs font-mono text-gray-500 italic max-w-lg truncate">
                          Commit: <span className="text-neonPurple">{dep.commitId || '-'}</span> - {dep.commitMessage}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setActiveDeploymentId(dep.id);
                          setActiveDeployment(dep);
                          setActiveTab('console');
                        }}
                        className="px-3.5 py-1.5 border border-gray-800 hover:bg-gray-850 rounded-lg text-[11px] font-semibold text-gray-400 hover:text-gray-200"
                      >
                        Inspect Logs
                      </button>
                      
                      {dep.status === 'success' && idx !== 0 && (
                        <button
                          onClick={() => handleRollback(dep.id)}
                          className="flex items-center gap-1 px-3.5 py-1.5 bg-neonPurple/10 hover:bg-neonPurple/20 border border-neonPurple/20 rounded-lg text-[11px] font-bold text-neonPurple transition-all"
                        >
                          <RefreshCcw className="w-3 h-3" /> Rollback
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT: Config Settings */}
          {activeTab === 'settings' && (
            <div className="glass-panel p-6 rounded-2xl border border-gray-850 space-y-6">
              <div className="space-y-1 pb-4 border-b border-gray-800">
                <h3 className="text-sm font-bold text-gray-200 text-red-400">Danger Zone</h3>
                <p className="text-[11px] text-gray-500">Irreversible settings for this configuration node.</p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-gray-200">Delete Project</h4>
                  <p className="text-[10px] text-gray-400 font-light">Terminates running Docker container and erases SQLite build metadata.</p>
                </div>
                <button
                  onClick={handleDeleteProject}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-xl text-xs font-semibold text-red-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Delete Project
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Container status gauges */}
        <div className="space-y-6">
          {/* Active app site link */}
          {isRunning && (
            <a
              href={`http://${project?.serverIP || 'localhost'}:${project?.assignedPort}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gradient-to-r from-neonBlue/15 to-neonPurple/15 border border-neonBlue/30 hover:border-neonBlue/50 rounded-2xl text-xs text-neonBlue font-semibold transition-all group cursor-pointer shadow-neonBlue/5 shadow-inner"
            >
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4.5 h-4.5 text-neonGreen animate-pulse" /> Launch Live App</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </a>
          )}

          {/* Container performance statistics */}
          <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-5">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-neonBlue" /> Runtime Stats
            </h4>

            {isRunning ? (
              <div className="space-y-4">
                {/* CPU load */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400 font-light">CPU Load</span>
                    <span className="text-neonBlue font-semibold">{projectStats.cpu}%</span>
                  </div>
                  <div className="h-2 bg-darkBg rounded-full overflow-hidden border border-gray-850">
                    <div className="h-full bg-neonBlue shadow-neonBlue transition-all duration-1000" style={{ width: `${projectStats.cpu}%` }} />
                  </div>
                </div>

                {/* Memory footprint */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400 font-light">Memory</span>
                    <span className="text-neonPurple font-semibold">{parseFloat(projectStats.memoryPercentage).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-darkBg rounded-full overflow-hidden border border-gray-850">
                    <div className="h-full bg-neonPurple shadow-neonPurple transition-all duration-1000" style={{ width: `${projectStats.memoryPercentage}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">{projectStats.memory}</p>
                </div>

                <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                  <span>Heartbeat: Active</span>
                  <span>Container IP: local</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500 space-y-2 border border-dashed border-gray-800 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-gray-600 mx-auto" />
                <p className="text-xs font-light">Container is stopped.<br/>Uptime metrics offline.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
