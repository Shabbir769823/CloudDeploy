import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Bell, Shield, Server } from 'lucide-react';
import io from 'socket.io-client';

const Navbar = ({ title }) => {
  const { user } = useAuth();
  const [sysStatus, setSysStatus] = useState('Online');
  const [serverStats, setServerStats] = useState({ cpu: 0, ram: 0 });

  useEffect(() => {
    // Listen to server:stats globally to show mini CPU/RAM usage in navbar
    const socket = io('/');
    socket.on('server:stats', (data) => {
      setServerStats({ cpu: data.cpu, ram: data.ram });
    });

    socket.on('connect_error', () => {
      setSysStatus('Offline');
    });

    socket.on('connect', () => {
      setSysStatus('Online');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <header className="h-16 border-b border-gray-800 bg-darkCard/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h2 className="text-xl font-bold tracking-wide text-gray-100">{title}</h2>
      </div>

      <div className="flex items-center gap-6">
        {/* System telemetry quick metrics */}
        {sysStatus === 'Online' && (
          <div className="flex items-center gap-4 text-xs font-mono text-gray-400 bg-darkBg/60 px-3 py-1.5 rounded-lg border border-gray-800">
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-neonBlue" />
              <span>CPU: {serverStats.cpu}%</span>
            </div>
            <div className="h-3 w-px bg-gray-800" />
            <div>
              <span>RAM: {serverStats.ram}%</span>
            </div>
          </div>
        )}

        {/* Global Platform Status Indicator */}
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${
            sysStatus === 'Online' ? 'bg-neonGreen animate-pulse shadow-neonGreen' : 'bg-red-500 animate-pulse'
          }`} />
          <span className="text-xs font-mono text-gray-300">
            Engine {sysStatus}
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800/40 rounded-lg transition-all relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-neonBlue rounded-full" />
          </button>
          
          <div className="h-6 w-px bg-gray-800" />

          {/* User profile bubble */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neonBlue to-neonPurple flex items-center justify-center font-bold text-sm text-white">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-sm font-medium text-gray-300 hidden md:block">{user?.name}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
