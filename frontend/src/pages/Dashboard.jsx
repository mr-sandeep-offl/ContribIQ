import React, { useState, useEffect } from 'react';
import { getProjects } from '../api/projectApi';
import { getWorkspaceSummary } from '../api/analyticsApi';
import StatCard from '../components/common/StatCard';
import ProjectCard from '../components/projects/ProjectCard';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import EmptyState from '../components/common/EmptyState';
import { Folder, Heart, ShieldAlert, CheckCircle, Plus, RefreshCw } from 'lucide-react';
import Button from '../components/common/Button';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const [projectList, summaryData] = await Promise.all([
        getProjects(),
        getWorkspaceSummary()
      ]);
      setProjects(projectList);
      setSummary(summaryData);
      setError('');
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setError('');
    fetchDashboardData();
  };

  // Compute aggregated statistics
  const { totalProjects, activeProjects, averageHealthScore, highRiskProjectsCount } = React.useMemo(() => {
    return {
      totalProjects: summary?.totalProjects || 0,
      activeProjects: projects.filter((p) => p.status === 'active').length,
      averageHealthScore: summary?.averageHealthScore ?? 100,
      highRiskProjectsCount: summary?.highRiskProjectsCount || 0
    };
  }, [summary, projects]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-950 text-white">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full text-left">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between mb-8 animate-pulse">
              <div>
                <div className="h-7 bg-gray-800 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-800 rounded w-80"></div>
              </div>
              <div className="h-10 bg-gray-800 rounded w-36"></div>
            </div>

            {/* Stat Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-gray-900 border border-gray-850 rounded-xl p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-4 bg-gray-800 rounded w-24"></div>
                    <div className="h-8 w-8 bg-gray-800 rounded-lg"></div>
                  </div>
                  <div className="h-6 bg-gray-800 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-gray-850 rounded w-32"></div>
                </div>
              ))}
            </div>

            {/* Recent Projects Title Skeleton */}
            <div className="h-6 bg-gray-800 rounded w-44 mb-4 animate-pulse"></div>

            {/* Project Cards Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-56 bg-gray-900 border border-gray-850 rounded-xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-5 bg-gray-800 rounded w-32"></div>
                    <div className="h-5 bg-gray-800 rounded w-16"></div>
                  </div>
                  <div className="space-y-2 mb-6">
                    <div className="h-4 bg-gray-800 rounded w-full"></div>
                    <div className="h-4 bg-gray-800 rounded w-5/6"></div>
                  </div>
                  <div className="pt-4 border-t border-gray-850 flex justify-between">
                    <div className="h-3 bg-gray-800 rounded w-20"></div>
                    <div className="h-3 bg-gray-800 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full text-left">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Workspace Dashboard</h1>
              <p className="text-sm text-gray-400">Track and monitor your project development cycles.</p>
            </div>
            <Button variant="primary" onClick={() => navigate('/projects')} className="flex items-center gap-1.5">
              <Plus size={16} />
              Manage Projects
            </Button>
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

          {totalProjects === 0 && !error ? (
            <EmptyState
              title="No projects found"
              description="Create a project to start logging task shares, contributions, and generating AI summaries."
              actionText="Create Project"
              onAction={() => navigate('/projects')}
            />
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                  title="Total Projects" 
                  value={totalProjects} 
                  icon={Folder} 
                  description="All projects in workspace"
                />
                <StatCard 
                  title="Active Sprints" 
                  value={activeProjects} 
                  icon={CheckCircle} 
                  description="Sprints currently active"
                />
                <StatCard 
                  title="Average Health" 
                  value={`${averageHealthScore}%`} 
                  icon={Heart} 
                  description="Average team health score"
                  trendDirection={averageHealthScore >= 70 ? 'up' : 'down'}
                />
                <StatCard 
                  title="High Risk Sprints" 
                  value={highRiskProjectsCount} 
                  icon={ShieldAlert} 
                  description="Nearing deadline with low progress"
                  trendDirection={highRiskProjectsCount > 0 ? 'down' : 'up'}
                />
              </div>

              {/* Recent Projects */}
              <h2 className="text-lg font-semibold text-white mb-4">Your Recent Projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.slice(0, 6).map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
