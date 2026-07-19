import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Zap } from 'lucide-react';

const Navbar = () => {
  const { user } = useAuth();

  return (
    <nav className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-sky-400 shadow-sm">
          <Zap className="text-white" size={16} />
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-900">
          SyncScore <span className="gradient-text">AI</span>
        </span>
      </div>

      {/* User Info */}
      {user && (
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-800 leading-none">{user.name}</span>
            <span className="text-xs text-slate-400 mt-0.5 capitalize leading-none">{user.role}</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center text-white font-semibold text-sm shadow-sm ring-2 ring-white ring-offset-1">
            {user.name?.charAt(0)?.toUpperCase() || <User size={14} />}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
