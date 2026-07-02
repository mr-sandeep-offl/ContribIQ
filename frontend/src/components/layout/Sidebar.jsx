import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
  ];

  return (
    <aside className="w-64 border-r border-gray-800 bg-gray-900/50 flex flex-col h-[calc(100vh-4rem)] sticky top-16 left-0">
      <div className="flex-1 py-6 px-4 flex flex-col gap-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/25'
                    : 'text-gray-400 hover:bg-gray-850 hover:text-gray-200 border border-transparent'
                }`
              }
            >
              <Icon size={18} />
              {link.label}
            </NavLink>
          );
        })}
      </div>
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-rose-950/20 hover:text-rose-400 transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
