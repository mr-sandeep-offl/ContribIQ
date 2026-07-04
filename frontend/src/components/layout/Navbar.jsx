import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Cpu, Bell, Check, BellOff } from 'lucide-react';
import Button from '../common/Button';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/notificationApi';

const Navbar = () => {
  const { user, logout } = useAuth();
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
    <nav className="h-16 border-b border-gray-800 bg-gray-900 px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <Cpu className="text-indigo-500" size={24} />
        <span className="text-xl font-bold tracking-tight text-white">
          SyncScore <span className="text-indigo-400">AI</span>
        </span>
      </div>
      
      {user && (
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all focus:outline-none"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-gray-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-800 bg-gray-900/95 backdrop-blur-md p-4 shadow-2xl z-50 text-left animate-fadeIn">
                <div className="flex items-center justify-between border-b border-gray-850 pb-2 mb-2">
                  <span className="text-sm font-bold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <Check size={13} />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 mt-2 pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 flex flex-col items-center justify-center text-gray-500 text-center">
                      <BellOff size={24} className="mb-2 text-gray-600" />
                      <span className="text-xs">No alerts yet</span>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => !n.read && handleMarkRead(n._id)}
                        className={`p-3 rounded-lg border text-xs transition-all cursor-pointer ${
                          n.read
                            ? 'bg-gray-950/40 border-gray-900 text-gray-500'
                            : 'bg-gray-800/40 border-gray-800 hover:bg-gray-800/60 text-white font-medium'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className="leading-relaxed">{n.message}</p>
                          {!n.read && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500 mt-1" />
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 block mt-1">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-gray-800" />

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
