import React, { useState } from 'react';
import { Settings as SettingsIcon, ShieldCheck, Mail, Database, BellRing, Save } from 'lucide-react';

const Settings = () => {
  const [gitToken, setGitToken] = useState('ghp_************************************');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [buildRetention, setBuildRetention] = useState('30');
  const [alertEmail, setAlertEmail] = useState('dev-team@company.com');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold tracking-wide text-gray-100">Global System Preferences</h2>
        <p className="text-xs text-gray-400 font-light mt-0.5">Control pipeline settings and external service integrations.</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-gray-800 shadow-xl">
        <form onSubmit={handleSave} className="space-y-6">
          
          {saved && (
            <div className="p-3 bg-neonGreen/10 border border-neonGreen/20 text-neonGreen rounded-xl text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Preferences saved successfully.</span>
            </div>
          )}

          {/* GitHub integrations settings */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
              <Database className="w-4 h-4 text-neonBlue" /> Repository Authentications
            </h3>
            
            <div className="space-y-1.5 p-4 bg-darkBg/60 border border-gray-800 rounded-xl">
              <label className="text-[11px] font-semibold text-gray-400">GitHub Personal Access Token (PAT)</label>
              <input
                type="password"
                value={gitToken}
                onChange={(e) => setGitToken(e.target.value)}
                placeholder="ghp_..."
                className="w-full px-4 py-2 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:outline-none text-xs font-mono text-gray-300"
              />
              <p className="text-[10px] text-gray-500 font-light">Required to pull code from private repositories.</p>
            </div>
          </div>

          {/* Build Pipeline defaults */}
          <div className="space-y-4 pt-4 border-t border-gray-800/80">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-neonPurple" /> Pipeline Rules
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 p-4 bg-darkBg/60 border border-gray-800 rounded-xl">
                <label className="text-[11px] font-semibold text-gray-400">Build History Retention</label>
                <select
                  value={buildRetention}
                  onChange={(e) => setBuildRetention(e.target.value)}
                  className="w-full px-3 py-2 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:outline-none text-xs text-gray-300 cursor-pointer"
                >
                  <option value="10">Keep last 10 builds</option>
                  <option value="30">Keep last 30 builds (Default)</option>
                  <option value="100">Keep last 100 builds</option>
                  <option value="0">Keep all builds</option>
                </select>
              </div>

              <div className="space-y-1.5 p-4 bg-darkBg/60 border border-gray-800 rounded-xl flex items-center justify-between">
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 block">Clean Build Cache</label>
                  <span className="text-[10px] text-gray-500 font-light">Force rebuild without Docker layers</span>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Docker system builder caches cleared.')}
                  className="px-4 py-2 border border-gray-800 hover:bg-gray-850 rounded-xl text-[10px] font-semibold text-gray-300 transition-all"
                >
                  Purge Cache
                </button>
              </div>
            </div>
          </div>

          {/* Notifications Alert Settings */}
          <div className="space-y-4 pt-4 border-t border-gray-800/80">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
              <BellRing className="w-4 h-4 text-neonGreen" /> Push Notifications
            </h3>

            <div className="space-y-4 p-4 bg-darkBg/60 border border-gray-800 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-200">Email Alerts</span>
                  <p className="text-[10px] text-gray-500 font-light">Dispatches SMTP notifications on build success or deploy failure.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neonGreen" />
                </label>
              </div>

              {emailAlerts && (
                <div className="space-y-1.5 pt-2 border-t border-gray-850/80">
                  <label className="text-[10px] font-semibold text-gray-400 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Emergency Notification Email</label>
                  <input
                    type="email"
                    required
                    value={alertEmail}
                    onChange={(e) => setAlertEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:outline-none text-xs font-mono text-gray-300"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800/40 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-3 bg-gradient-to-r from-neonBlue to-neonPurple hover:opacity-90 rounded-xl text-xs font-bold text-white transition-all shadow-sm"
            >
              <Save className="w-4 h-4" /> Save System Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
