import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import TaskCard from '../components/tasks/TaskCard';
import EmptyState from '../components/common/EmptyState';
import { getMyTasks } from '../api/taskApi';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchTasks = async () => {
    try {
      const data = await getMyTasks();
      setTasks(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch your assigned tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setError('');
    fetchTasks();
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col bg-gray-950 text-white">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full text-left">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <CheckCircle size={24} className="text-indigo-400" />
                My Assigned Tasks
              </h1>
              <p className="text-sm text-gray-400">All tasks assigned to you across all workspaces.</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-450 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button 
                onClick={handleRetry} 
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 transition-colors text-xs font-semibold text-rose-300"
              >
                <RefreshCw size={12} />
                Retry
              </button>
            </div>
          )}

          {tasks.length === 0 && !error ? (
            <EmptyState
              title="No assigned tasks yet"
              description="You have no tasks assigned to you right now. Take a break!"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {tasks.map(task => (
                <div key={task._id} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block truncate px-1">
                      Project: {task.projectId?.title || 'Unknown Project'}
                    </span>
                  </div>
                  <div 
                    onClick={() => navigate(`/projects/${task.projectId?._id}`)} 
                    className="cursor-pointer"
                  >
                    <TaskCard 
                      task={task} 
                      canModify={false} 
                      onEdit={() => {}} 
                      onDelete={() => {}} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MyTasks;
