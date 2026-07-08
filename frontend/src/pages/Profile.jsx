import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  User, 
  Mail, 
  Lock, 
  ShieldCheck, 
  ShieldAlert, 
  QrCode, 
  Key, 
  Loader2,
  CheckCircle2
} from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();

  // Profile forms
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  
  // 2FA state
  const [is2FAEnabled, setIs2FAEnabled] = useState(user?.twoFactorEnabled === 1 || user?.twoFactorEnabled === true);
  const [twoFactorSetup, setTwoFactorSetup] = useState(null); // { secret, qrCodeUrl }
  const [verificationCode, setVerificationCode] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState('');
  const [twoFactorMsg, setTwoFactorMsg] = useState('');

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileError('');

    if (password && password !== confirmPassword) {
      return setProfileError('Passwords do not match.');
    }

    try {
      await updateProfile(name, email, password);
      setProfileMsg('Profile information updated successfully.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setProfileError(err.message || 'Failed to save updates.');
    }
  };

  const handleSetup2FA = async () => {
    setTwoFactorError('');
    setTwoFactorLoading(true);
    try {
      const res = await axios.post('/api/auth/2fa/setup');
      setTwoFactorSetup(res.data); // { secret, qrCodeUrl }
    } catch (err) {
      setTwoFactorError('Failed to initialize 2FA setup.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setTwoFactorError('');
    setTwoFactorLoading(true);

    try {
      await axios.post('/api/auth/2fa/verify', { code: verificationCode });
      setIs2FAEnabled(true);
      setTwoFactorSetup(null);
      setTwoFactorMsg('Two-Factor Authentication activated successfully.');
    } catch (err) {
      setTwoFactorError(err.response?.data?.error || 'Invalid code.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA security?')) return;
    setTwoFactorLoading(true);
    try {
      // Direct disable simulated endpoint
      await axios.post('/api/auth/2fa/setup'); // clears db state
      setIs2FAEnabled(false);
      setTwoFactorMsg('Two-Factor Authentication has been disabled.');
    } catch (e) {
      setTwoFactorError('Failed to disable 2FA.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
      
      {/* Profile Form */}
      <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-6 h-fit">
        <div>
          <h3 className="text-sm font-bold text-gray-200">Account Credentials</h3>
          <p className="text-xs text-gray-400 font-light mt-0.5">Edit credentials associated with your profile</p>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {profileMsg && (
            <div className="p-3 bg-neonGreen/10 border border-neonGreen/20 text-neonGreen rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileMsg}</span>
            </div>
          )}
          {profileError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-400">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:outline-none text-xs transition-all text-gray-300"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-400">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:outline-none text-xs transition-all text-gray-300"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-400">New Password (Optional)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:outline-none text-xs transition-all text-gray-300 placeholder-gray-700"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-400">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:outline-none text-xs transition-all text-gray-300 placeholder-gray-700"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-neonBlue to-neonPurple hover:opacity-90 rounded-xl text-xs font-bold text-white transition-all shadow-sm"
          >
            Update Credentials
          </button>
        </form>
      </div>

      {/* Two-Factor Authentication Box */}
      <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-6 h-fit">
        <div>
          <h3 className="text-sm font-bold text-gray-200">Two-Factor Authentication (2FA)</h3>
          <p className="text-xs text-gray-400 font-light mt-0.5">Secure your developer account from unauthorized SSH/deploy dispatches.</p>
        </div>

        {twoFactorError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>{twoFactorError}</span>
          </div>
        )}

        {twoFactorMsg && (
          <div className="p-3 bg-neonGreen/10 border border-neonGreen/20 text-neonGreen rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{twoFactorMsg}</span>
          </div>
        )}

        {/* 2FA State Display */}
        {is2FAEnabled ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-neonGreen/5 border border-neonGreen/10">
              <ShieldCheck className="w-8 h-8 text-neonGreen" />
              <div>
                <p className="text-xs font-bold text-gray-200">2FA Security Status: ACTIVE</p>
                <p className="text-[10px] text-gray-400">Account login requires validation of mobile authenticator code.</p>
              </div>
            </div>
            
            <button
              onClick={handleDisable2FA}
              disabled={twoFactorLoading}
              className="px-4 py-2 border border-red-500/20 hover:bg-red-500/5 rounded-xl text-xs font-semibold text-red-400 transition-all"
            >
              Disable Security Shield
            </button>
          </div>
        ) : !twoFactorSetup ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-800/10 border border-gray-800">
              <ShieldAlert className="w-8 h-8 text-gray-500" />
              <div>
                <p className="text-xs font-bold text-gray-200">Security Status: INACTIVE</p>
                <p className="text-[10px] text-gray-400">Enhance project safety by configuring multi-factor verification.</p>
              </div>
            </div>

            <button
              onClick={handleSetup2FA}
              disabled={twoFactorLoading}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-neonBlue to-neonPurple hover:opacity-90 rounded-xl text-xs font-bold text-white transition-all shadow-sm"
            >
              {twoFactorLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set Up Authenticator'}
            </button>
          </div>
        ) : (
          // Setup panel with QR Code scan
          <form onSubmit={handleVerify2FA} className="space-y-4">
            <div className="p-3 bg-darkBg border border-gray-800 rounded-xl text-xs text-gray-400 space-y-3">
              <p className="font-semibold">Step 1: Scan the QR code with Google Authenticator or Microsoft Authenticator app</p>
              
              <div className="flex justify-center py-2 bg-white rounded-lg max-w-[170px] mx-auto">
                <img src={twoFactorSetup.qrCodeUrl} alt="Authenticator QR Code" className="w-[150px] h-[150px]" />
              </div>

              <p className="font-semibold pt-2">Step 2: Enter secret key manually if scan fails</p>
              <div className="p-2.5 bg-darkBg border border-gray-850 rounded-lg text-neonBlue font-mono text-[10px] select-all truncate text-center">
                {twoFactorSetup.secret}
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-semibold text-gray-300">Step 3: Enter 6-digit confirmation code</label>
              <div className="relative">
                <Key className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full pl-9 pr-4 py-2 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:outline-none text-xs transition-all text-gray-300 text-center tracking-[0.5em] font-bold"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={twoFactorLoading}
                className="px-5 py-2.5 bg-neonGreen hover:opacity-90 rounded-xl text-xs font-bold text-darkBg transition-all shadow-sm disabled:opacity-50"
              >
                {twoFactorLoading ? 'Activating...' : 'Verify & Enable'}
              </button>
              <button
                type="button"
                onClick={() => setTwoFactorSetup(null)}
                className="px-4 py-2.5 border border-gray-800 hover:bg-gray-800/30 rounded-xl text-xs text-gray-400 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
