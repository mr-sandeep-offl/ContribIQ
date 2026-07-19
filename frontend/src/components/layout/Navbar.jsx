import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Zap, Bell, Check, BellOff } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/notificationApi';

const Navbar = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(notifications.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

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

      {/* User & Notifications */}
      {user && (
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all focus:outline-none"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl z-50 text-left animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <span className="text-sm font-bold text-slate-800">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                    >
                      <Check size={13} />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 mt-2 pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 flex flex-col items-center justify-center text-slate-400 text-center">
                      <BellOff size={24} className="mb-2 text-slate-300" />
                      <span className="text-xs">No alerts yet</span>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => !n.read && handleMarkRead(n._id)}
                        className={`p-3 rounded-lg border text-xs transition-all cursor-pointer ${
                          n.read
                            ? 'bg-slate-50/50 border-slate-100 text-slate-400'
                            : 'bg-blue-50/30 border-blue-100 hover:bg-blue-50/50 text-slate-800 font-medium'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className="leading-relaxed">{n.message}</p>
                          {!n.read && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500 mt-1" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200" />

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-800 leading-none">{user.name}</span>
              <span className="text-xs text-slate-400 mt-0.5 capitalize leading-none">{user.role}</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center text-white font-semibold text-sm shadow-sm ring-2 ring-white ring-offset-1">
              {user.name?.charAt(0)?.toUpperCase() || <User size={14} />}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
