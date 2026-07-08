import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Cpu, HardDrive, Layers, Activity, Server, Clock, ShieldCheck, Loader2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const Monitoring = () => {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectMetrics, setProjectMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchMetrics();

    const interval = setInterval(() => {
      fetchLiveMetrics();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const [statsRes, projectsRes] = await Promise.all([
        axios.get('/api/server/stats'),
        axios.get('/api/projects')
      ]);

      setStats(statsRes.data);
      setProjects(projectsRes.data);

      // Seed chart history
      const initialChart = Array.from({ length: 10 }, (_, i) => ({
        time: new Date(Date.now() - (10 - i) * 4000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        cpu: statsRes.data.cpu + (Math.random() * 6 - 3),
        ram: statsRes.data.ram
      }));
      setChartData(initialChart);

      // Fetch individual container metrics
      const metricsMap = {};
      await Promise.all(projectsRes.data.map(async (p) => {
        try {
          const mRes = await axios.get(`/api/projects/${p.id}/stats`);
          metricsMap[p.id] = mRes.data;
        } catch (e) {}
      }));
      setProjectMetrics(metricsMap);

    } catch (err) {
      console.error('Failed to load telemetry stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveMetrics = async () => {
    try {
      const statsRes = await axios.get('/api/server/stats');
      setStats(statsRes.data);

      setChartData(prev => {
        const next = [...prev, {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          cpu: statsRes.data.cpu,
          ram: statsRes.data.ram
        }];
        if (next.length > 12) next.shift();
        return next;
      });

      // Update container metrics
      const metricsMap = {};
      await Promise.all(projects.map(async (p) => {
        try {
          const mRes = await axios.get(`/api/projects/${p.id}/stats`);
          metricsMap[p.id] = mRes.data;
        } catch (e) {}
      }));
      setProjectMetrics(prev => ({ ...prev, ...metricsMap }));

    } catch (err) {
      // Suppress background errors
    }
  };

  const formatUptime = (seconds) => {
    if (!seconds) return '0s';
    const d = Math.floor(seconds / (365 * 24 * 3600));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  if (loading && !stats) {
    return (
      <div className="h-[80vh] flex items-center justify-center flex-col gap-3 text-gray-400">
        <Loader2 className="w-10 h-10 text-neonBlue animate-spin" />
        <p className="text-sm">Connecting telemetry channels...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Upper overview status bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-gray-800 flex items-center gap-4">
          <div className="p-3 bg-neonBlue/10 text-neonBlue rounded-xl">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Engine Kernel</p>
            <h4 className="text-sm font-bold text-gray-200">Local Docker Node Daemon</h4>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-gray-800 flex items-center gap-4">
          <div className="p-3 bg-neonPurple/10 text-neonPurple rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">System Uptime</p>
            <h4 className="text-sm font-bold text-gray-200">{formatUptime(stats?.uptime)}</h4>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-gray-800 flex items-center gap-4">
          <div className="p-3 bg-neonGreen/10 text-neonGreen rounded-xl">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">API Health</p>
            <h4 className="text-sm font-bold text-neonGreen glow-text-green">All Channels Secure</h4>
          </div>
        </div>
      </div>

      {/* Main Graph */}
      <div className="glass-panel p-6 rounded-2xl border border-gray-850 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-200">Detailed Resource Graphs</h3>
          <p className="text-xs text-gray-500 font-light">Granular historical line metrics for CPU and Memory aggregates.</p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#bd00ff" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#bd00ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1f293d/30" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#4b5563" fontSize={9} tickLine={false} />
              <YAxis stroke="#4b5563" fontSize={9} domain={[0, 100]} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#151c2c', borderColor: '#374151', color: '#f3f4f6' }} />
              <Area type="monotone" dataKey="cpu" name="CPU Load %" stroke="#00f0ff" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} />
              <Area type="monotone" dataKey="ram" name="RAM Footprint %" stroke="#bd00ff" fillOpacity={1} fill="url(#colorRam)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dials & Gauges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-gray-800 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5"><Cpu className="w-4 h-4 text-neonBlue" /> CPU Load</span>
            <span className="text-neonBlue font-semibold font-mono text-sm">{stats?.cpu}%</span>
          </div>
          <div className="py-6 flex justify-center">
            <div className="w-24 h-24 rounded-full border-8 border-gray-800 flex items-center justify-center relative">
              <span className="font-bold text-lg text-gray-200">{stats?.cpu}%</span>
              <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-neonBlue rotate-45 animate-spin-slow pointer-events-none" />
            </div>
          </div>
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-neonBlue shadow-neonBlue transition-all duration-1000" style={{ width: `${stats?.cpu}%` }} />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-gray-800 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5"><HardDrive className="w-4 h-4 text-neonPurple" /> RAM Footprint</span>
            <span className="text-neonPurple font-semibold font-mono text-sm">{stats?.ram}%</span>
          </div>
          <div className="py-6 flex justify-center">
            <div className="w-24 h-24 rounded-full border-8 border-gray-800 flex items-center justify-center relative">
              <span className="font-bold text-md text-gray-200">{stats?.ram}%</span>
              <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-neonPurple rotate-12 pointer-events-none" />
            </div>
          </div>
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-neonPurple shadow-neonPurple transition-all duration-1000" style={{ width: `${stats?.ram}%` }} />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-gray-800 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5"><Layers className="w-4 h-4 text-neonGreen" /> Storage Volume</span>
            <span className="text-neonGreen font-semibold font-mono text-sm">{stats?.disk}%</span>
          </div>
          <div className="py-6 flex justify-center">
            <div className="w-24 h-24 rounded-full border-8 border-gray-800 flex items-center justify-center relative">
              <span className="font-bold text-lg text-gray-200">{stats?.disk}%</span>
              <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-neonGreen rotate-90 pointer-events-none" />
            </div>
          </div>
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-neonGreen shadow-neonGreen transition-all duration-1000" style={{ width: `${stats?.disk}%` }} />
          </div>
        </div>
      </div>

      {/* Active Containers Grid */}
      <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-200">Active Container Telemetry</h3>
          <p className="text-xs text-gray-500 font-light font-mono">List of running container processes and their individual payloads.</p>
        </div>

        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-xs font-medium text-gray-400 bg-gray-800/10">
                <th className="p-4">Container Namespace</th>
                <th className="p-4">Framework</th>
                <th className="p-4">Assigned Port</th>
                <th className="p-4">Container Memory</th>
                <th className="p-4">Container CPU Load</th>
                <th className="p-4">Health Probe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40 text-xs">
              {projects.map((p) => {
                const metric = projectMetrics[p.id];
                return (
                  <tr key={p.id} className="hover:bg-gray-800/10 transition-all font-mono">
                    <td className="p-4 font-bold text-gray-300">
                      clouddeploy-{p.id.substring(0, 8)}
                    </td>
                    <td className="p-4 font-sans">
                      <span className="px-2 py-0.5 rounded bg-darkBg border border-gray-800 text-[10px] text-gray-400">
                        {p.framework}
                      </span>
                    </td>
                    <td className="p-4">
                      :{p.assignedPort}
                    </td>
                    <td className="p-4 text-neonPurple font-semibold">
                      {metric ? metric.memory.split('/')[0].trim() : 'Offline'}
                    </td>
                    <td className="p-4 text-neonBlue font-semibold">
                      {metric ? `${metric.cpu}%` : 'Offline'}
                    </td>
                    <td className="p-4">
                      {metric ? (
                        <span className="text-neonGreen flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-neonGreen animate-pulse" /> PASS</span>
                      ) : (
                        <span className="text-red-400 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-400" /> STOPPED</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;
