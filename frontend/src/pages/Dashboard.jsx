import React, { useState, useEffect, useMemo } from 'react';
import { getProjects } from '../api/projectApi';
import { getProjectAnalytics } from '../api/analyticsApi';
import StatCard from '../components/common/StatCard';
import ProjectCard from '../components/projects/ProjectCard';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import EmptyState from '../components/common/EmptyState';
import { Folder, Heart, ShieldAlert, CheckCircle, Plus, TrendingUp, AlertCircle } from 'lucide-react';
import Button from '../components/common/Button';
import { useNavigate } from 'react-router-dom';

// Skeleton loader for stat cards
const StatSkeleton = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
    <div className="flex items-center justify-between mb-3">
      <div className="skeleton h-3 w-24 rounded" />
      <div className="skeleton h-9 w-9 rounded-xl" />
    </div>
    <div className="skeleton h-8 w-16 rounded mt-2 mb-1" />
    <div className="skeleton h-2.5 w-28 rounded" />
  </div>
);

// Skeleton loader for project cards
const CardSkeleton = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card min-h-[200px] flex flex-col justify-between">
    <div>
      <div className="flex justify-between mb-3">
        <div className="skeleton h-4 w-36 rounded" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="skeleton h-3 w-full rounded mt-2 mb-1" />
      <div className="skeleton h-3 w-3/4 rounded" />
    </div>
    <div className="pt-4 border-t border-slate-100 flex gap-3">
      <div className="skeleton h-3 w-20 rounded" />
      <div className="skeleton h-3 w-16 rounded" />
    </div>
  </div>
);

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const projectList = await getProjects();
        setProjects(projectList);

        const analyticsPromises = projectList.map(async (project) => {
          try {
            const data = await getProjectAnalytics(project._id);
            return { projectId: project._id, data };
          } catch {
            return { projectId: project._id, data: null };
          }
        });

        const analyticsResults = await Promise.all(analyticsPromises);
        const analyticsMap = {};
        analyticsResults.forEach((res) => {
          if (res.data) analyticsMap[res.projectId] = res.data;
        });
        setAnalytics(analyticsMap);
      } catch {
        setError('Failed to fetch dashboard data. Make sure backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'active').length;
    const healthScores = Object.values(analytics).map((a) => a.healthScore);
    const averageHealthScore =
      healthScores.length > 0
        ? Math.round(healthScores.reduce((sum, s) => sum + s, 0) / healthScores.length)
        : 100;
    const highRiskProjectsCount = Object.values(analytics).filter(
      (a) => a.deadlineRisk === 'high'
    ).length;
    return { totalProjects, activeProjects, averageHealthScore, highRiskProjectsCount };
  }, [projects, analytics]);

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
            <div className="mb-6 flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {[...Array(4)].map((_, i) => <StatSkeleton key={i} />)}
              </div>
              <div className="skeleton h-5 w-36 rounded mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
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
