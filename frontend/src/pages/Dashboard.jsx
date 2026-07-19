import React, { useState, useEffect, useMemo } from 'react';
import { getProjects } from '../api/projectApi';
import { getWorkspaceSummary } from '../api/analyticsApi';
import StatCard from '../components/common/StatCard';
import ProjectCard from '../components/projects/ProjectCard';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import EmptyState from '../components/common/EmptyState';
import { Folder, Heart, ShieldAlert, CheckCircle, Plus, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import Button from '../components/common/Button';
import { useNavigate } from 'react-router-dom';

// Skeleton loader for stat cards
const StatSkeleton = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="h-3 bg-slate-200 rounded w-24" />
      <div className="h-8 w-8 bg-slate-200 rounded-lg" />
    </div>
    <div className="h-6 bg-slate-200 rounded w-16 mb-2" />
    <div className="h-3 bg-slate-200 rounded w-32" />
  </div>
);

// Skeleton loader for project cards
const CardSkeleton = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card min-h-[200px] flex flex-col justify-between animate-pulse">
    <div>
      <div className="flex justify-between mb-3">
        <div className="h-4 bg-slate-200 rounded w-36" />
        <div className="h-5 bg-slate-200 rounded-full w-16" />
      </div>
      <div className="h-3 bg-slate-200 rounded w-full mt-2 mb-1" />
      <div className="h-3 bg-slate-200 rounded w-3/4" />
    </div>
    <div className="pt-4 border-t border-slate-100 flex gap-3">
      <div className="h-3 bg-slate-200 rounded w-20" />
      <div className="h-3 bg-slate-200 rounded w-16" />
    </div>
  </div>
);

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
  const stats = useMemo(() => {
    return {
      totalProjects: summary?.totalProjects || 0,
      activeProjects: projects.filter((p) => p.status === 'active').length,
      averageHealthScore: summary?.averageHealthScore ?? 100,
      highRiskProjectsCount: summary?.highRiskProjectsCount || 0
    };
  }, [summary, projects]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto w-full text-left page-enter">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Workspace Dashboard
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Track and monitor your project development cycles.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/projects')}
              className="flex items-center gap-1.5"
            >
              <Plus size={16} />
              Manage Projects
            </Button>
          </div>

          {error && (
            <div className="mb-6 flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
              <button 
                onClick={handleRetry} 
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 transition-colors text-xs font-semibold text-red-700"
              >
                <RefreshCw size={12} />
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {[...Array(4)].map((_, i) => <StatSkeleton key={i} />)}
              </div>
              <div className="h-5 bg-slate-200 rounded w-36 mb-4 animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
              </div>
            </>
          ) : projects.length === 0 ? (
            <EmptyState
              title="No projects found"
              description="Create a project to start logging task shares, contributions, and generating AI summaries."
              actionText="Create Project"
              onAction={() => navigate('/projects')}
            />
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <StatCard
                  title="Total Projects"
                  value={stats.totalProjects}
                  icon={Folder}
                  description="All projects in workspace"
                  color="blue"
                />
                <StatCard
                  title="Active Sprints"
                  value={stats.activeProjects}
                  icon={CheckCircle}
                  description="Sprints currently active"
                  color="emerald"
                  trendDirection={stats.activeProjects > 0 ? 'up' : 'down'}
                />
                <StatCard
                  title="Average Health"
                  value={`${stats.averageHealthScore}%`}
                  icon={Heart}
                  description="Average team health score"
                  color="sky"
                  trendDirection={stats.averageHealthScore >= 70 ? 'up' : 'down'}
                />
                <StatCard
                  title="High Risk Sprints"
                  value={stats.highRiskProjectsCount}
                  icon={ShieldAlert}
                  description="Nearing deadline with low progress"
                  color={stats.highRiskProjectsCount > 0 ? 'red' : 'emerald'}
                  trendDirection={stats.highRiskProjectsCount > 0 ? 'down' : 'up'}
                />
              </div>

              {/* Recent Projects */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-600" />
                  Your Recent Projects
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/projects')}
                  className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1"
                >
                  View all →
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
