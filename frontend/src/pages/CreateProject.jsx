import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Cloud, 
  ArrowLeft, 
  GitBranch, 
  Settings, 
  Server, 
  Key, 
  User, 
  HelpCircle,
  Loader2,
  Terminal,
  Compass
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CreateProject = () => {
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [framework, setFramework] = useState('auto');
  
  // AWS EC2 deployment toggles & fields
  const [useAWS, setUseAWS] = useState(false);
  const [serverIP, setServerIP] = useState('');
  const [sshUser, setSshUser] = useState('ubuntu');
  const [sshKey, setSshKey] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!projectName.trim() || !githubRepo.trim()) {
      return setError('Project Name and Git Repository URL are required.');
    }

    setLoading(true);
    try {
      const payload = {
        projectName,
        description,
        githubRepo,
        branch,
        framework,
        serverIP: useAWS ? serverIP : null,
        sshUser: useAWS ? sshUser : null,
        sshKey: useAWS ? sshKey : null
      };

      const res = await axios.post('/api/projects', payload);
      // Automatically navigate to project page to deploy
      navigate(`/projects/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initialize project configuration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link to="/dashboard" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-neonBlue transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-wide text-gray-100">Configure Deployment Pipeline</h2>
        <p className="text-xs text-gray-400 font-light mt-1">Connect your code and provision target settings.</p>
      </div>

      {/* Form Card */}
      <div className="glass-panel p-8 rounded-2xl border border-gray-800 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
              {error}
            </div>
          )}

          {/* Project Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Project Identifier Name</label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="my-awesome-app"
                className="w-full px-4 py-2.5 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:outline-none text-sm transition-all placeholder-gray-700"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Product website frontend layer"
                className="w-full px-4 py-2.5 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:outline-none text-sm transition-all placeholder-gray-700"
              />
            </div>
          </div>

          {/* Github URL details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">GitHub Git Repository URL</label>
              <div className="relative">
                <Compass className="w-4.5 h-4.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  placeholder="https://github.com/username/repository.git"
                  className="w-full pl-10 pr-4 py-2.5 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:outline-none text-sm transition-all placeholder-gray-700 font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Git Target Branch</label>
              <div className="relative">
                <GitBranch className="w-4.5 h-4.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="w-full pl-10 pr-4 py-2.5 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:outline-none text-sm transition-all placeholder-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Framework Detect selection */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-300">Target Framework</label>
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" /> Auto Detect compiles a temp clone check
              </span>
            </div>
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className="w-full px-4 py-2.5 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:outline-none text-xs text-gray-300 cursor-pointer"
            >
              <option value="auto">✨ Automatic Framework Detection (Recommended)</option>
              <option value="HTML CSS JS">HTML / CSS / JS Static Site</option>
              <option value="React">React (SPA)</option>
              <option value="Angular">Angular (SPA)</option>
              <option value="Vue">Vue (SPA)</option>
              <option value="NodeJS">Node.js (Generic backend)</option>
              <option value="Express">Express.js (API backend)</option>
              <option value="Python Flask">Python Flask API</option>
              <option value="Django">Python Django API</option>
            </select>
          </div>

          {/* AWS EC2 remote deployment expander */}
          <div className="border-t border-gray-800/80 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-gray-200">Deploy to AWS EC2 Cloud</h4>
                <p className="text-[11px] text-gray-500">Deploys code remotely via secure SSH shell commands rather than running on the local host</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAWS}
                  onChange={(e) => setUseAWS(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neonBlue peer-checked:after:bg-white" />
              </label>
            </div>

            {useAWS && (
              <div className="space-y-4 p-5 rounded-2xl bg-darkBg/60 border border-gray-800/80 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-400 flex items-center gap-1"><Server className="w-3.5 h-3.5 text-neonBlue" /> Public Server IP Address</label>
                    <input
                      type="text"
                      required={useAWS}
                      value={serverIP}
                      onChange={(e) => setServerIP(e.target.value)}
                      placeholder="54.210.44.12"
                      className="w-full px-4 py-2 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:outline-none text-xs font-mono text-gray-300"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-400 flex items-center gap-1"><User className="w-3.5 h-3.5 text-neonPurple" /> SSH Username</label>
                    <input
                      type="text"
                      required={useAWS}
                      value={sshUser}
                      onChange={(e) => setSshUser(e.target.value)}
                      placeholder="ubuntu"
                      className="w-full px-4 py-2 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:outline-none text-xs font-mono text-gray-300"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-gray-400 flex items-center gap-1"><Key className="w-3.5 h-3.5 text-neonBlue" /> SSH Private Key (PEM format)</label>
                  <textarea
                    rows={4}
                    required={useAWS}
                    value={sshKey}
                    onChange={(e) => setSshKey(e.target.value)}
                    placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;MIIEowIBAAKCAQEA0yX...&#10;-----END RSA PRIVATE KEY-----"
                    className="w-full p-4 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:outline-none text-xs font-mono text-gray-300"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-800/40 flex justify-end gap-3">
            <Link
              to="/dashboard"
              className="px-6 py-3 border border-gray-800 hover:bg-gray-800/30 rounded-xl text-xs font-semibold transition-all text-gray-400 hover:text-gray-200"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-6 py-3 bg-gradient-to-r from-neonBlue to-neonPurple hover:opacity-90 rounded-xl text-xs font-bold text-white transition-all shadow-sm hover:shadow-neonBlue disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Auto Detecting Framework...
                </>
              ) : (
                'Save and Go to Console'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
