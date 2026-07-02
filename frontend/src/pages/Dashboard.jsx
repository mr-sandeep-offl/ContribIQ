import React, { useState, useEffect } from 'react';
import { getProjects } from '../api/projectApi';
import { getProjectAnalytics } from '../api/analyticsApi';
import StatCard from '../components/common/StatCard';
import ProjectCard from '../components/projects/ProjectCard';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import EmptyState from '../components/common/EmptyState';
import { Folder, Heart, ShieldAlert, CheckCircle, Plus } from 'lucide-react';
import Button from '../components/common/Button';
import { useNavigate } from 'react-router-dom';

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

        // Fetch analytics for each project in parallel
        const analyticsPromises = projectList.map(async (project) => {
          try {
            const data = await getProjectAnalytics(project._id);
            return { projectId: project._id, data };
          } catch (err) {
            console.error(`Error loading analytics for project ${project._id}:`, err);
            return { projectId: project._id, data: null };
          }
        });

        const analyticsResults = await Promise.all(analyticsPromises);
        const analyticsMap = {};
        analyticsResults.forEach((res) => {
          if (res.data) analyticsMap[res.projectId] = res.data;
        });
        setAnalytics(analyticsMap);
      } catch (err) {
        setError('Failed to fetch dashboard data. Make sure backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Compute aggregated statistics
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;

  const healthScores = Object.values(analytics).map((a) => a.healthScore);
  const averageHealthScore = healthScores.length > 0 
    ? Math.round(healthScores.reduce((sum, s) => sum + s, 0) / healthScores.length)
    : 100;

  const highRiskProjectsCount = Object.values(analytics).filter(
    (a) => a.deadlineRisk === 'high'
  ).length;

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
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-450 text-sm">
              {error}
            </div>
          )}

          {totalProjects === 0 ? (
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
