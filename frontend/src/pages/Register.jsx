import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cloud, Lock, Mail, User, ShieldAlert, Users } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('developer'); // helper select for presentation

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      await register(name, email, password, role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
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

        {/* Register card */}
        <div className="glass-panel p-8 rounded-2xl border border-gray-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center space-y-1.5 mb-5">
              <h3 className="text-xl font-bold text-gray-100">Create Account</h3>
              <p className="text-xs text-gray-400 font-light">
                Sign up to begin deploying your applications
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Full Name</label>
              <div className="relative">
                <User className="w-4.5 h-4.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:ring-1 focus:ring-neonBlue/30 focus:outline-none text-sm transition-all placeholder-gray-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4.5 h-4.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:ring-1 focus:ring-neonBlue/30 focus:outline-none text-sm transition-all placeholder-gray-600"
                />
              </div>
            </div>

            {/* Role Select for demo ease */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Account Role (Demo Selection)</label>
              <div className="relative">
                <Users className="w-4.5 h-4.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:outline-none text-sm text-gray-300 transition-all appearance-none cursor-pointer"
                >
                  <option value="developer">Developer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Password</label>
              <div className="relative">
                <Lock className="w-4.5 h-4.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:ring-1 focus:ring-neonBlue/30 focus:outline-none text-sm transition-all placeholder-gray-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4.5 h-4.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 bg-darkBg border border-gray-800 rounded-xl focus:border-neonBlue focus:ring-1 focus:ring-neonBlue/30 focus:outline-none text-sm transition-all placeholder-gray-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-neonBlue to-neonPurple hover:opacity-90 rounded-xl font-semibold text-sm tracking-wide transition-all mt-4 hover:shadow-neonBlue disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>

            <div className="text-center pt-1">
              <p className="text-xs text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-neonBlue hover:underline font-semibold">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
