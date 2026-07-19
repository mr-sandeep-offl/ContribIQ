import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, MessageSquare, LogOut, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { logout, user } = useAuth();

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderOpen },
    { to: '/ai-assistant', label: 'AI Assistant', icon: MessageSquare },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-[calc(100vh-4rem)] sticky top-16 left-0 shadow-sm">
      <div className="flex-1 py-6 px-3 flex flex-col gap-1">
        {links.map((link, idx) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              style={{ animationDelay: `${idx * 60}ms` }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 animate-slideInLeft ${
                  isActive
                    ? 'sidebar-link-active'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon size={18} />
              {link.label}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom User + Logout */}
      <div className="p-3 border-t border-slate-200">
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize truncate">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
