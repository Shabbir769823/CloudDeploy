import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cloud, Lock, Mail, ShieldAlert, Key } from 'lucide-react';

const Login = () => {
  const { login, verify2FA } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 2FA state
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorUserId, setTwoFactorUserId] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.twoFactorRequired) {
        setTwoFactorRequired(true);
        setTwoFactorUserId(result.userId);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verify2FA(twoFactorUserId, twoFactorCode);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid 2FA code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#070b13] min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-neonBlue/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-neonPurple/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand logo header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-2.5 bg-gradient-to-tr from-neonBlue to-neonPurple rounded-xl text-white">
            <Cloud className="w-6 h-6 animate-float" />
          </div>
          <span className="text-2xl font-bold tracking-wider bg-gradient-to-r from-white via-gray-200 to-neonBlue bg-clip-text text-transparent">
            CloudDeploy
          </span>
        </div>

        {/* Auth card */}
        <div className="glass-panel p-8 rounded-2xl border border-gray-800 shadow-2xl">
          {!twoFactorRequired ? (
            // Standard login form
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center space-y-1.5 mb-6">
                <h3 className="text-xl font-bold text-gray-100">Welcome Back</h3>
                <p className="text-xs text-gray-400 font-light">
                  Sign in to access your deployment dashboard
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4.5 h-4.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:ring-1 focus:ring-neonBlue/30 focus:outline-none text-sm transition-all placeholder-gray-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-gray-300">Password</label>
                  <Link to="/forgot-password" className="text-[11px] text-neonBlue hover:underline">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4.5 h-4.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:ring-1 focus:ring-neonBlue/30 focus:outline-none text-sm transition-all placeholder-gray-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-neonBlue to-neonPurple hover:opacity-90 rounded-xl font-semibold text-sm tracking-wide transition-all mt-4 hover:shadow-neonBlue disabled:opacity-50"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-gray-500">
                  New to CloudDeploy?{' '}
                  <Link to="/register" className="text-neonBlue hover:underline font-semibold">
                    Create Account
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            // 2FA code input panel
            <form onSubmit={handle2FAVerify} className="space-y-5">
              <div className="text-center space-y-1.5 mb-6">
                <h3 className="text-xl font-bold text-gray-100">2-Factor Verification</h3>
                <p className="text-xs text-gray-400 font-light">
                  Please enter the 6-digit authentication code
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">Security Code</label>
                <div className="relative">
                  <Key className="w-4.5 h-4.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder="Enter 6-digit code (e.g. 123456)"
                    className="w-full pl-10 pr-4 py-2.5 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:ring-1 focus:ring-neonBlue/30 focus:outline-none text-sm transition-all placeholder-gray-600 text-center tracking-[0.5em] font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-neonBlue to-neonPurple hover:opacity-90 rounded-xl font-semibold text-sm tracking-wide transition-all mt-4 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <button
                type="button"
                onClick={() => setTwoFactorRequired(false)}
                className="w-full py-2.5 border border-gray-800 hover:bg-gray-800/30 rounded-xl text-xs text-gray-400 transition-all"
              >
                Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
