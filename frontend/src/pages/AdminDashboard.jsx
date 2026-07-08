import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Users, 
  Layers, 
  Activity, 
  Trash2, 
  ShieldAlert, 
  Calendar, 
  Server,
  Loader2,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [statsRes, usersRes, depsRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/users'),
        axios.get('/api/admin/deployments')
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setDeployments(depsRes.data);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to retrieve administrator payload data.');
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateDeployment = async (depId) => {
    if (!confirm('Are you sure you want to stop and delete this deployment container globally?')) return;
    try {
      await axios.delete(`/api/admin/deployments/${depId}`);
      alert('Deployment terminated successfully.');
      fetchAdminData(); // Reload list
    } catch (err) {
      alert('Failed to terminate deployment.');
    }
  };

  if (loading && !stats) {
    return (
      <div className="h-[80vh] flex items-center justify-center flex-col gap-3 text-gray-400">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
        <p className="text-sm">Accessing administrator control vaults...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Global overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-red-500 shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Global Users</p>
            <h3 className="text-3xl font-bold text-gray-100">{stats?.totalUsers}</h3>
          </div>
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-neonBlue shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Global Projects</p>
            <h3 className="text-3xl font-bold text-gray-100">{stats?.totalProjects}</h3>
          </div>
          <div className="p-3 bg-neonBlue/10 text-neonBlue rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-neonGreen shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Global Deployments</p>
            <h3 className="text-3xl font-bold text-neonGreen glow-text-green">{stats?.totalDeployments}</h3>
          </div>
          <div className="p-3 bg-neonGreen/10 text-neonGreen rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-neonPurple shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Admin Staff</p>
            <h3 className="text-3xl font-bold text-neonPurple glow-text-purple">{stats?.roles.adminCount}</h3>
          </div>
          <div className="p-3 bg-neonPurple/10 text-neonPurple rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid: User Control & Deployments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* User list */}
        <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4 lg:col-span-1 h-fit">
          <div>
            <h3 className="text-sm font-bold text-gray-200">Registered Users</h3>
            <p className="text-xs text-gray-500 font-light">List of active system accounts</p>
          </div>

          <div className="divide-y divide-gray-850 max-h-[400px] overflow-y-auto pr-1">
            {users.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between gap-4">
                <div className="space-y-0.5 truncate">
                  <p className="text-xs font-bold text-gray-200 truncate">{u.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-semibold tracking-wider ${
                  u.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-neonBlue/10 text-neonBlue border border-neonBlue/20'
                }`}>
                  {u.role.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Global deployments monitor */}
        <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4 lg:col-span-2">
          <div>
            <h3 className="text-sm font-bold text-gray-200">Global Deployment Control Vault</h3>
            <p className="text-xs text-gray-500 font-light">Erase metadata records and forcibly stop active developer container layers</p>
          </div>

          {deployments.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500 border border-dashed border-gray-800 rounded-xl">
              No deployments are currently indexed.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-850 text-xs font-semibold text-gray-400 bg-gray-800/10">
                    <th className="p-3">Project Details</th>
                    <th className="p-3">Host Port</th>
                    <th className="p-3">Docker Tag</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850 text-xs">
                  {deployments.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-850/20 transition-all font-mono">
                      <td className="p-3 font-sans">
                        <div className="space-y-0.5">
                          <p className="font-bold text-gray-300">{d.projectName}</p>
                          <p className="text-[10px] text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(d.deploymentTime).toLocaleDateString()}</p>
                        </div>
                      </td>
                      <td className="p-3 font-bold text-gray-400">
                        {d.port ? `:${d.port}` : '-'}
                      </td>
                      <td className="p-3 text-[10px] text-gray-500 truncate max-w-[120px]" title={d.dockerImage}>
                        {d.dockerImage}
                      </td>
                      <td className="p-3 font-sans">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] ${
                          d.status === 'success' ? 'bg-neonGreen/10 text-neonGreen' : d.status === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-gray-800 text-gray-400'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleTerminateDeployment(d.id)}
                          className="p-1.5 text-red-400 hover:bg-red-500/5 hover:border-red-500/25 border border-transparent rounded-lg transition-all"
                          title="Forcibly Terminate Container"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
