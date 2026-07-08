import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusSquare, 
  Activity, 
  User, 
  Settings, 
  ShieldAlert, 
  LogOut, 
  Cloud 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Create Project', path: '/projects/create', icon: PlusSquare },
    { name: 'Monitoring', path: '/monitoring', icon: Activity },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-darkCard border-r border-gray-800 flex flex-col justify-between h-screen sticky top-0">
      <div>
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-gray-800">
          <div className="p-2 bg-gradient-to-tr from-neonBlue to-neonPurple rounded-lg text-white">
            <Cloud className="w-6 h-6 animate-float" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wider bg-gradient-to-r from-white via-gray-200 to-neonBlue bg-clip-text text-transparent">
              CloudDeploy
            </h1>
            <span className="text-[10px] text-neonBlue font-mono uppercase tracking-widest glow-text-blue">
              v1.0.0
            </span>
          </div>
        </div>

        {/* User Quick Info */}
        <div className="px-6 py-4 border-b border-gray-800/50 bg-darkBg/30">
          <p className="text-xs text-gray-400">Signed in as</p>
          <p className="text-sm font-semibold truncate text-gray-200">{user?.name}</p>
          <span className={`inline-block text-[9px] font-mono px-2 py-0.5 mt-1 rounded uppercase tracking-wider ${
            isAdmin ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-neonBlue/10 text-neonBlue border border-neonBlue/20'
          }`}>
            {user?.role}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-neonBlue/15 to-transparent text-neonBlue border-l-2 border-neonBlue shadow-neonBlue'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}

          {/* Admin Panel Link */}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-red-500/15 to-transparent text-red-400 border-l-2 border-red-500'
                    : 'text-red-400/70 hover:text-red-400 hover:bg-red-950/20'
                }`
              }
            >
              <ShieldAlert className="w-5 h-5" />
              Admin Control
            </NavLink>
          )}
        </nav>
      </div>

      {/* Logout Action */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
