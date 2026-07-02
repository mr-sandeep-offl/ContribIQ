import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Cpu } from 'lucide-react';
import Button from '../common/Button';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="h-16 border-b border-gray-800 bg-gray-900 px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <Cpu className="text-indigo-500" size={24} />
        <span className="text-xl font-bold tracking-tight text-white">
          SyncScore <span className="text-indigo-400">AI</span>
        </span>
      </div>
      
      {user && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-indigo-400 border border-gray-700">
              <User size={16} />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-semibold text-gray-200 leading-none">{user.name}</span>
              <span className="text-xs text-gray-500 mt-1 capitalize leading-none">{user.role}</span>
            </div>
          </div>
          <div className="h-6 w-px bg-gray-800" />
          <Button 
            variant="ghost" 
            onClick={logout} 
            className="text-gray-400 hover:text-rose-400 flex items-center gap-1.5 px-2 py-1.5"
          >
            <LogOut size={16} />
            <span className="text-xs">Logout</span>
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
