import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import {
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} from '../api/projectApi';
import {
  createTask,
  getTasksByProject,
  updateTask,
  deleteTask,
} from '../api/taskApi';
import {
  addContribution,
  getContributionsByProject,
} from '../api/contributionApi';
import { getProjectAnalytics } from '../api/analyticsApi';
import { generateAISummary } from '../api/aiApi';
import {
  getGitHubStatus,
  getRepository,
  getCommits,
  getContributors,
  getBranches,
  getPullRequests,
  getIssues,
  syncGitHub,
} from '../api/githubApi';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatDate';

// Components
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import TaskCard from '../components/tasks/TaskCard';
import ContributionCard from '../components/contributions/ContributionCard';

// Recharts
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

import {
  LayoutDashboard,
  ListTodo,
  Users,
  BarChart3,
  BrainCircuit,
  Plus,
  Trash2,
  Settings,
  GitBranch,
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity,
  RefreshCw,
  ExternalLink,
  GitPullRequest,
  CircleDot,
  Copy,
  Star,
  GitFork,
  Eye,
  Code2,
  Shield,
  TrendingUp,
  Lightbulb,
  ChevronRight,
  BookOpen,
  GitCommit,
  User,
  Tag,
  AlertTriangle,
} from 'lucide-react';

// GitHub SVG icon
const GithubIcon = ({ size = 16, className = '' }) => (
  <svg height={size} width={size} className={className} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

// â”€â”€ GitHub URL normalizer (display only â€” validation done on backend)
const normalizeDisplayUrl = (rawUrl) => {
  if (!rawUrl) return '';
  try {
    return rawUrl.trim().replace(/\/$/, '').replace(/\.git$/, '');
  } catch {
    return rawUrl;
  }
};

const COLORS = ['#2563eb', '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const selectCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] transition-all';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit project
  const [editProjectModal, setEditProjectModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('college');
  const [editDeadline, setEditDeadline] = useState('');
  const [editRepoUrl, setEditRepoUrl] = useState('');
  const [editStatus, setEditStatus] = useState('planning');

  // Tasks
  const [tasks, setTasks] = useState([]);
  const [taskModal, setTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [taskStatus, setTaskStatus] = useState('todo');

  // Contributions
  const [contributions, setContributions] = useState([]);
  const [contribModal, setContribModal] = useState(false);
  const [contribTitle, setContribTitle] = useState('');
  const [contribDesc, setContribDesc] = useState('');
  const [contribType, setContribType] = useState('code');
  const [contribImpact, setContribImpact] = useState(5);

  // Members
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');

  // Analytics
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // AI Summary
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // GitHub state
  const [gitStatus, setGitStatus]       = useState(null);
  const [repoData, setRepoData]         = useState(null);
  const [commits, setCommits]           = useState([]);
  const [contributors, setContributors] = useState([]);
  const [branches, setBranches]         = useState([]);
  const [pullRequests, setPullRequests] = useState(null);
  const [issues, setIssues]             = useState(null);
  const [ghLoading, setGhLoading]       = useState(false);
  const [ghSections, setGhSections]     = useState({});
  const [importLoading, setImportLoading] = useState(false);
  const [copySuccess, setCopySuccess]   = useState(false);
  const [githubError, setGithubError]   = useState('');
  const [syncMessage, setSyncMessage]   = useState('');

  const isOwner = useMemo(() => project && project.createdBy?._id === user?._id, [project, user]);

  // Fetch all GitHub data for the project
  const fetchAllGitHubData = useCallback(async () => {
    try {
      setGhLoading(true);
      setGithubError('');
      const status = await getGitHubStatus(id);
      setGitStatus(status);

      if (!status?.validUrl) return; // no valid repo â€“ stop here

      // Fetch all sections in parallel; handle each independently
      const results = await Promise.allSettled([
        getRepository(id),
        getCommits(id),
        getContributors(id),
        getBranches(id),
        getPullRequests(id),
        getIssues(id),
      ]);

      const [repoR, commitsR, contribR, branchR, prR, issueR] = results;

      setRepoData(repoR.status === 'fulfilled' ? repoR.value : null);
      setCommits(commitsR.status === 'fulfilled' ? commitsR.value.commits : []);
      setContributors(contribR.status === 'fulfilled' ? contribR.value.contributors : []);
      setBranches(branchR.status === 'fulfilled' ? branchR.value.branches : []);
      setPullRequests(prR.status === 'fulfilled' ? prR.value : null);
      setIssues(issueR.status === 'fulfilled' ? issueR.value : null);

      // Collect section errors
      const sectionErrors = {};
      if (repoR.status === 'rejected') sectionErrors.repo = repoR.reason?.response?.data?.message || repoR.reason?.message;
      if (commitsR.status === 'rejected') sectionErrors.commits = commitsR.reason?.response?.data?.message || commitsR.reason?.message;
      if (contribR.status === 'rejected') sectionErrors.contributors = contribR.reason?.response?.data?.message || contribR.reason?.message;
      setGhSections(sectionErrors);

    } catch (err) {
      setGithubError(err.response?.data?.message || err.message || 'Failed to load GitHub data.');
    } finally {
      setGhLoading(false);
    }
  }, [id]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const data = await getProjectAnalytics(id);
      setAnalytics(data);
    } catch {
      console.error('Failed to get analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [id]);

  const fetchProjectData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProjectById(id);
      setProject(data);
      setEditTitle(data.title);
      setEditDescription(data.description || '');
      setEditCategory(data.category);
      setEditDeadline(data.deadline ? data.deadline.substring(0, 10) : '');
      setEditRepoUrl(data.repoUrl || '');
      setEditStatus(data.status);

      const [taskList, contribList] = await Promise.all([
        getTasksByProject(id),
        getContributionsByProject(id),
      ]);
      setTasks(taskList);
      setContributions(contribList);
      fetchAllGitHubData();
      fetchAnalytics();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch project details.');
    } finally {
      setLoading(false);
    }
  }, [id, fetchAllGitHubData, fetchAnalytics]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Project actions
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const updated = await updateProject(id, {
        title: editTitle, description: editDescription, category: editCategory,
        deadline: editDeadline, repoUrl: editRepoUrl, status: editStatus,
      });
      setProject(updated);
      setSuccess('Project updated successfully.');
      setEditProjectModal(false);
      fetchProjectData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update project.');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete this project? This action is permanent.')) return;
    try {
      await deleteProject(id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete project.');
    }
  };

  // Task actions
  const handleCreateOrUpdateTask = useCallback(async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editingTask) {
        await updateTask(editingTask._id, {
          title: taskTitle, description: taskDesc,
          assignedTo: taskAssignee || undefined,
          priority: taskPriority, deadline: taskDeadline, status: taskStatus,
        });
      } else {
        await createTask(id, {
          title: taskTitle, description: taskDesc,
          assignedTo: taskAssignee || undefined,
          priority: taskPriority, deadline: taskDeadline,
        });
      }
      setTaskTitle(''); setTaskDesc(''); setTaskAssignee('');
      setTaskPriority('medium'); setTaskDeadline('');
      setEditingTask(null); setTaskModal(false);
      const list = await getTasksByProject(id);
      setTasks(list);
      fetchAnalytics();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process task.');
    }
  }, [editingTask, taskTitle, taskDesc, taskAssignee, taskPriority, taskDeadline, taskStatus, id, fetchAnalytics]);

  const handleEditTaskClick = useCallback((task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskAssignee(task.assignedTo?._id || '');
    setTaskPriority(task.priority);
    setTaskDeadline(task.deadline ? task.deadline.substring(0, 10) : '');
    setTaskStatus(task.status);
    setTaskModal(true);
  }, []);

  const handleDeleteTask = useCallback(async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      const list = await getTasksByProject(id);
      setTasks(list);
      fetchAnalytics();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task.');
    }
  }, [id, fetchAnalytics]);

  // Contribution actions
  const handleAddContribution = async (e) => {
    e.preventDefault(); setError('');
    try {
      await addContribution(id, {
        title: contribTitle, description: contribDesc,
        type: contribType, impactScore: Number(contribImpact), source: 'manual',
      });
      setContribTitle(''); setContribDesc(''); setContribType('code');
      setContribImpact(5); setContribModal(false);
      const list = await getContributionsByProject(id);
      setContributions(list);
      fetchAnalytics();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log contribution.');
    }
  };

  // Member actions
  const handleAddMember = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      await addMember(id, { email: memberEmail, role: memberRole });
      setMemberEmail('');
      setSuccess('Member added successfully.');
      fetchProjectData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member.');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await removeMember(id, userId);
      setSuccess('Member removed successfully.');
      fetchProjectData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  // AI Summary
  const handleGenerateAISummary = async () => {
    try {
      setAiLoading(true); setError('');
      const data = await generateAISummary(id);
      setAiSummary(data);
    } catch {
      setError('Failed to generate summary.');
    } finally {
      setAiLoading(false);
    }
  };

  // GitHub Sync
  const handleGitHubSync = async () => {
    try {
      setImportLoading(true);
      setGithubError('');
      setSyncMessage('');
      const result = await syncGitHub(id);
      setSyncMessage(result.message || `Imported ${result.imported} commit(s).`);
      // Refresh contributions and GitHub data
      const list = await getContributionsByProject(id);
      setContributions(list);
      fetchAllGitHubData();
    } catch (err) {
      setGithubError(
        err.response?.data?.message ||
        'Unable to sync repository. Check that the repository URL is valid and the repo is public (or GITHUB_TOKEN is set).'
      );
    } finally {
      setImportLoading(false);
    }
  };

  const handleRefreshGitHub = () => {
    setGithubError('');
    setSyncMessage('');
    fetchAllGitHubData();
  };

  const handleCopyUrl = () => {
    const url = gitStatus?.normalizedUrl || gitStatus?.repoUrl || repoData?.htmlUrl;
    if (url) {
      navigator.clipboard.writeText(url).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      });
    }
  };

  // Real-data AI insights generated from fetched data
  const githubInsights = useMemo(() => {
    const items = [];
    if (!gitStatus?.validUrl) return items;

    const recentCommits = commits.filter((c) => {
      if (!c.date) return false;
      const days = (Date.now() - new Date(c.date).getTime()) / (1000 * 60 * 60 * 24);
      return days <= 7;
    });
    if (recentCommits.length > 0) {
      items.push({ type: 'info', text: `${recentCommits.length} commit(s) were made in the last 7 days.` });
    }

    const openPRs = pullRequests?.counts?.open ?? 0;
    if (openPRs > 0) {
      items.push({ type: 'warning', text: `There are ${openPRs} open pull request(s) awaiting review.` });
    }

    const openIssues = issues?.counts?.open ?? 0;
    if (openIssues > 0) {
      items.push({ type: 'warning', text: `The repository has ${openIssues} unresolved issue(s).` });
    }

    if (contributors.length > 0) {
      items.push({ type: 'success', text: `The most active contributor is ${contributors[0].login} with ${contributors[0].contributions} contribution(s).` });
    }

    if (branches.length > 0) {
      items.push({ type: 'info', text: `Repository has ${branches.length} branch(es). Default: ${repoData?.defaultBranch || 'main'}.` });
    }

    if (repoData?.openIssues === 0 && pullRequests?.counts?.open === 0) {
      items.push({ type: 'success', text: 'No open issues or pull requests â€” repository is clean.' });
    }

    if (gitStatus?.lastImportedAt) {
      items.push({ type: 'success', text: 'Commits were previously synchronized. Run Sync to import the latest.' });
    } else {
      items.push({ type: 'info', text: 'Click Sync GitHub to import commits as contribution records.' });
    }

    return items.slice(0, 6);
  }, [gitStatus, commits, pullRequests, issues, contributors, branches, repoData]);

  // â”€â”€ Loading State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (loading) {
    return (
      <div className="flex h-screen flex-col bg-slate-50">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-10 w-10 mx-auto animate-spin rounded-full border-3 border-blue-600 border-t-transparent mb-4" />
            <p className="text-sm text-slate-500">Loading project...</p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview',       label: 'Overview',       icon: LayoutDashboard },
    { id: 'tasks',          label: 'Task Board',     icon: ListTodo },
    { id: 'contributions',  label: 'Contributions',  icon: Activity },
    { id: 'members',        label: 'Members',        icon: Users },
    { id: 'analytics',      label: 'Analytics',      icon: BarChart3 },
    { id: 'ai-summary',     label: 'AI Summary',     icon: BrainCircuit },
    { id: 'github',         label: 'GitHub',         icon: GithubIcon },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <div className="flex flex-1 animate-fadeIn">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto w-full text-left">

          {/* â”€â”€ Project Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{project.title}</h1>
                <Badge variant={project.status === 'completed' ? 'success' : project.status === 'active' ? 'info' : 'secondary'}>
                  {project.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">{project.description}</p>
            </div>
            {isOwner && (
              <div className="flex gap-2.5">
                <Button variant="outline" onClick={() => setEditProjectModal(true)} className="flex items-center gap-1.5">
                  <Settings size={14} />
                  Settings
                </Button>
                <Button variant="danger" onClick={handleDeleteProject} className="flex items-center gap-1.5">
                  <Trash2 size={14} />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {/* â”€â”€ Alerts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {error && (
            <div className="mb-5 flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-5 flex items-center gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              <CheckCircle2 size={15} className="shrink-0" />
              {success}
            </div>
          )}

          {/* â”€â”€ Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="flex border-b border-slate-200 gap-1 mb-7 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              OVERVIEW TAB
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeInUp">
              <div className="lg:col-span-2 space-y-5">
                {/* Project Parameters */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                  <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
                    <BookOpen size={15} className="text-blue-600" />
                    Project Parameters
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Category</span>
                      <span className="text-sm font-semibold text-slate-800 capitalize">{project.category}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Deadline</span>
                      <span className="text-sm font-semibold text-slate-800">{formatDate(project.deadline)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">GitHub</span>
                      {project.repoUrl ? (
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
                        >
                          <GithubIcon size={13} />
                          Repository Link
                          <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span className="text-sm text-slate-400">Not Connected</span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Created By</span>
                      <span className="text-sm font-semibold text-slate-800">
                        {project.createdBy?.name}
                        <span className="text-slate-400 font-normal"> ({project.createdBy?.email})</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Analytics Overview Cards */}
                {analytics && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Sprint Health', value: `${analytics.healthScore}%`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { label: 'Progress',      value: `${analytics.projectProgressPercentage}%`, color: 'text-blue-600', bg: 'bg-blue-50' },
                      {
                        label: 'Risk Rating',
                        value: analytics.deadlineRisk,
                        color: analytics.deadlineRisk === 'high' ? 'text-red-600' : analytics.deadlineRisk === 'medium' ? 'text-amber-600' : 'text-emerald-600',
                        bg: analytics.deadlineRisk === 'high' ? 'bg-red-50' : analytics.deadlineRisk === 'medium' ? 'bg-amber-50' : 'bg-emerald-50',
                      },
                    ].map((m, i) => (
                      <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-2">{m.label}</span>
                        <span className={`text-2xl font-extrabold capitalize ${m.color}`}>{m.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Members sidebar card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card h-fit">
                <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <Users size={15} className="text-blue-600" />
                  Sprint Contributors
                </h3>
                <div className="space-y-3">
                  {project.members.map((member) => (
                    <div key={member.user._id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {member.user.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-slate-800 block leading-none">{member.user.name}</span>
                          <span className="text-xs text-slate-400 capitalize mt-0.5 block">{member.projectRole}</span>
                        </div>
                      </div>
                      {member.user.githubUsername && (
                        <a
                          href={`https://github.com/${member.user.githubUsername}`}
                          target="_blank" rel="noreferrer"
                          className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                        >
                          <GithubIcon size={14} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              TASK BOARD TAB
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {activeTab === 'tasks' && (
            <div className="animate-fadeInUp">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Task Board</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{tasks.length} task{tasks.length !== 1 ? 's' : ''} total</p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => {
                    setEditingTask(null); setTaskTitle(''); setTaskDesc('');
                    setTaskAssignee(''); setTaskPriority('medium'); setTaskDeadline('');
                    setTaskModal(true);
                  }}
                  className="flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  Add Task
                </Button>
              </div>

              {tasks.length === 0 ? (
                <EmptyState
                  title="No tasks on the board"
                  description="Build out your sprint workflow by creating task items."
                  actionText="Add Task"
                  onAction={() => setTaskModal(true)}
                  icon={ListTodo}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onEdit={handleEditTaskClick}
                      onDelete={handleDeleteTask}
                      canModify={isOwner || task.createdBy === user._id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              CONTRIBUTIONS TAB
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {activeTab === 'contributions' && (
            <div className="animate-fadeInUp">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Contribution History</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{contributions.length} contribution{contributions.length !== 1 ? 's' : ''} logged</p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => setContribModal(true)}
                  className="flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  Log Contribution
                </Button>
              </div>

              {contributions.length === 0 ? (
                <EmptyState
                  title="No contributions logged"
                  description="Record manual contributions (meetings, reviews) or pull them from GitHub."
                  actionText="Log Contribution"
                  onAction={() => setContribModal(true)}
                  icon={Activity}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {contributions.map((c) => (
                    <ContributionCard key={c._id} contribution={c} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              MEMBERS TAB
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {activeTab === 'members' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeInUp">
              <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-card text-left">
                <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <Users size={15} className="text-blue-600" />
                  Active Project Members
                </h3>
                <div className="space-y-1">
                  {project.members.map((member) => (
                    <div
                      key={member.user._id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {member.user.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800">{member.user.name}</span>
                            <Badge variant="info" className="capitalize">{member.projectRole}</Badge>
                          </div>
                          <span className="text-xs text-slate-400">{member.user.email}</span>
                        </div>
                      </div>
                      {isOwner && member.user._id !== user._id && (
                        <Button
                          variant="ghost"
                          onClick={() => handleRemoveMember(member.user._id)}
                          className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {isOwner && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card h-fit text-left">
                  <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
                    <Plus size={15} className="text-blue-600" />
                    Invite Member
                  </h3>
                  <form onSubmit={handleAddMember} className="flex flex-col gap-4">
                    <Input
                      label="User Email"
                      id="memberEmail"
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="teammate@example.com"
                      required
                    />
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="memberRole" className="text-sm font-semibold text-slate-700">
                        Project Role
                      </label>
                      <select
                        id="memberRole"
                        value={memberRole}
                        onChange={(e) => setMemberRole(e.target.value)}
                        className={selectCls}
                      >
                        <option value="member">Member</option>
                        <option value="reviewer">Reviewer</option>
                      </select>
                    </div>
                    <Button type="submit" variant="primary" className="mt-1 py-2.5">
                      Add to Project
                    </Button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              ANALYTICS TAB
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {activeTab === 'analytics' && (
            <div className="animate-fadeInUp">
              {analyticsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                      <div className="skeleton h-3 w-20 rounded mb-3" />
                      <div className="skeleton h-8 w-16 rounded mb-1" />
                      <div className="skeleton h-2.5 w-28 rounded" />
                    </div>
                  ))}
                </div>
              ) : !analytics ? (
                <EmptyState
                  title="Analytics not available"
                  description="Log tasks or contributions to populate project metrics."
                  icon={BarChart3}
                />
              ) : (
                <div className="space-y-6">
                  {/* Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Project Progress</span>
                      <span className="text-3xl font-extrabold text-slate-900">{analytics.projectProgressPercentage}%</span>
                      <p className="text-xs text-slate-400 mt-1">{analytics.completedTasks}/{analytics.totalTasks} Tasks</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Health Score</span>
                      <span className="text-3xl font-extrabold text-blue-600">{analytics.healthScore}/100</span>
                      <p className="text-xs text-slate-400 mt-1">Deducted for overdue / inactive</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Overdue Tasks</span>
                      <span className="text-3xl font-extrabold text-red-500">{analytics.overdueTasks}</span>
                      <p className="text-xs text-slate-400 mt-1">Pending past deadline</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Deadline Risk</span>
                      <Badge
                        variant={analytics.deadlineRisk === 'high' ? 'danger' : analytics.deadlineRisk === 'medium' ? 'warning' : 'success'}
                        className="mt-2 text-xs px-3 py-1"
                      >
                        {analytics.deadlineRisk} Risk
                      </Badge>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                      <h3 className="text-sm font-bold text-slate-900 mb-5">Task Overview</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: 'Total', count: analytics.totalTasks },
                              { name: 'Done', count: analytics.completedTasks },
                              { name: 'Pending', count: analytics.pendingTasks },
                              { name: 'Overdue', count: analytics.overdueTasks },
                            ]}
                            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                          >
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                            <YAxis stroke="#94a3b8" fontSize={11} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#1e293b', fontSize: '12px' }}
                            />
                            <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                      <h3 className="text-sm font-bold text-slate-900 mb-5">Workload Distribution</h3>
                      {analytics.memberContributionPercentages.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-sm text-slate-400">
                          No contributions logged yet.
                        </div>
                      ) : (
                        <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-6">
                          <div className="w-full sm:w-1/2 h-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={analytics.memberContributionPercentages}
                                  dataKey="contributionPercentage"
                                  nameKey="user.name"
                                  cx="50%" cy="50%"
                                  outerRadius={80}
                                >
                                  {analytics.memberContributionPercentages.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#1e293b', fontSize: '12px' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="w-full sm:w-1/2 flex flex-col gap-2 text-left">
                            {analytics.memberContributionPercentages.map((contrib, idx) => (
                              <div key={contrib.user._id} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                <span className="text-xs text-slate-600 truncate max-w-[70%]">{contrib.user.name}</span>
                                <span className="text-xs font-bold text-slate-900 ml-auto">{contrib.contributionPercentage}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inactive Members */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <AlertCircle size={14} className="text-amber-500" />
                      Inactivity Alert
                      <span className="text-xs text-slate-400 font-normal">(No activity in last 5 days)</span>
                    </h3>
                    {analytics.inactiveMembers.length === 0 ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <p className="text-sm text-emerald-700 font-medium">All sprint members are active!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {analytics.inactiveMembers.map((member) => (
                          <div key={member._id} className="rounded-xl border border-red-100 bg-red-50 p-4">
                            <span className="text-sm font-bold text-slate-800 block">{member.name}</span>
                            <span className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1">
                              <Clock size={11} />
                              Inactive for 5+ days
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              AI SUMMARY TAB
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {activeTab === 'ai-summary' && (
            <div className="max-w-3xl mx-auto text-left space-y-5 animate-fadeInUp">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">AI Project Intelligence</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Synthesize sprint data into text reports and recommendations.</p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleGenerateAISummary}
                  loading={aiLoading}
                  className="flex items-center gap-1.5"
                >
                  <BrainCircuit size={15} />
                  Generate Report
                </Button>
              </div>

              {aiSummary ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
                  <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-purple-500 flex items-center justify-center">
                        <BrainCircuit className="text-white" size={15} />
                      </div>
                      <span className="font-bold text-slate-900 text-sm">SyncScore AI Summary</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      Generated {formatDate(aiSummary.generatedAt)}
                    </span>
                  </div>
                  <p className="text-base text-slate-700 font-medium leading-relaxed italic">
                    "{aiSummary.summary}"
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-14 text-center bg-white">
                  <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 p-5 mb-5">
                    <BrainCircuit size={32} className="text-blue-600" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-2">No summary generated yet</h4>
                  <p className="text-sm text-slate-500 max-w-sm mb-6">
                    Click the button above to parse sprint data and generate an AI text intelligence report.
                  </p>
                  <Button variant="primary" onClick={handleGenerateAISummary} loading={aiLoading}>
                    Generate AI Report
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              GITHUB DASHBOARD TAB
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {activeTab === 'github' && (
            <div className="space-y-6 animate-fadeInUp">

              {/* Error Banner */}
              {githubError && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold mb-0.5">GitHub Error</p>
                    <p className="text-red-600 text-xs">{githubError}</p>
                  </div>
                  <button onClick={handleRefreshGitHub} className="text-xs underline text-red-600 hover:text-red-700">Retry</button>
                </div>
              )}

              {/* Sync Success Message */}
              {syncMessage && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                  <CheckCircle2 size={15} className="shrink-0" />
                  {syncMessage}
                </div>
              )}

              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <GithubIcon size={18} className="text-slate-700" />
                    GitHub Dashboard
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {repoData?.fullName ||
                      (gitStatus?.normalizedUrl ? normalizeDisplayUrl(gitStatus.normalizedUrl) : 'No repository connected')}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleRefreshGitHub}
                    disabled={ghLoading}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={ghLoading ? 'animate-spin' : ''} />
                    Refresh
                  </button>

                  <button
                    onClick={handleGitHubSync}
                    disabled={importLoading || !gitStatus?.validUrl}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    <GitBranch size={13} />
                    {importLoading ? 'Syncing...' : 'Sync GitHub'}
                  </button>

                  {repoData?.htmlUrl && (
                    <a
                      href={repoData.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      <ExternalLink size={13} />
                      View Repository
                    </a>
                  )}

                  {repoData?.htmlUrl && (
                    <a
                      href={`${repoData.htmlUrl}/pulls`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      <GitPullRequest size={13} />
                      Pull Requests
                    </a>
                  )}

                  {repoData?.htmlUrl && (
                    <a
                      href={`${repoData.htmlUrl}/issues`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      <CircleDot size={13} />
                      Issues
                    </a>
                  )}

                  <button
                    onClick={handleCopyUrl}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    {copySuccess
                      ? <CheckCircle2 size={13} className="text-emerald-600" />
                      : <Copy size={13} />}
                    {copySuccess ? 'Copied!' : 'Copy URL'}
                  </button>
                </div>
              </div>

              {/* â”€â”€ No Valid Repo â”€â”€ */}
              {!gitStatus?.validUrl && !ghLoading && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
                  <div className="rounded-2xl bg-slate-100 p-5 inline-flex mb-4">
                    <GithubIcon size={28} className="text-slate-500" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-2">No valid GitHub repository connected</h4>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto mb-5">
                    {project?.repoUrl
                      ? 'The repository URL saved in this project is not a valid GitHub URL. Please correct it in Settings.'
                      : 'No repository URL is configured for this project. Add one in Settings to enable the GitHub Dashboard.'}
                  </p>
                  <button
                    onClick={() => { setEditProjectModal(true); }}
                    className="inline-flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all font-semibold"
                  >
                    <Settings size={14} />
                    Update Repository in Settings
                  </button>
                </div>
              )}

              {/* â”€â”€ Loading Skeletons â”€â”€ */}
              {ghLoading && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                        <div className="skeleton h-3 w-16 rounded mb-3" />
                        <div className="skeleton h-7 w-12 rounded" />
                      </div>
                    ))}
                  </div>
                  <div className="skeleton h-48 w-full rounded-2xl" />
                  <div className="skeleton h-36 w-full rounded-2xl" />
                </div>
              )}

              {/* â”€â”€ Connected + valid repo â”€â”€ */}
              {gitStatus?.validUrl && !ghLoading && (
                <>
                  {/* Connection status bar */}
                  <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                    gitStatus.connected ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                  }`}>
                    {gitStatus.connected
                      ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      : <AlertCircle size={16} className="text-amber-600 shrink-0" />}
                    <div className="flex-1 text-sm font-medium">
                      <span className={gitStatus.connected ? 'text-emerald-700' : 'text-amber-700'}>
                        {gitStatus.connected ? 'Repository connected' : 'Repository configured but not yet synced'}
                      </span>
                      {gitStatus.normalizedUrl && (
                        <a
                          href={gitStatus.normalizedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-xs text-blue-600 hover:underline"
                        >
                          {gitStatus.normalizedUrl}
                        </a>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      Last sync: {gitStatus.lastImportedAt ? formatDate(gitStatus.lastImportedAt) : 'Never'}
                    </span>
                  </div>

                  {/* â”€â”€ Repository Stats Row â”€â”€ */}
                  {repoData && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { icon: Star,      label: 'Stars',       value: repoData.stars ?? 'â€”',       color: 'text-amber-600', bg: 'bg-amber-50' },
                        { icon: GitFork,   label: 'Forks',       value: repoData.forks ?? 'â€”',       color: 'text-blue-600',  bg: 'bg-blue-50' },
                        { icon: Eye,       label: 'Watchers',    value: repoData.watchers ?? 'â€”',    color: 'text-sky-600',   bg: 'bg-sky-50' },
                        { icon: CircleDot, label: 'Open Issues', value: repoData.openIssues ?? 'â€”',  color: 'text-red-500',   bg: 'bg-red-50' },
                      ].map((stat, i) => {
                        const StatIcon = stat.icon;
                        return (
                          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                            <div className={`inline-flex p-2 rounded-lg ${stat.bg} mb-3`}>
                              <StatIcon size={14} className={stat.color} />
                            </div>
                            <div className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* â”€â”€ Repository Overview + Health â”€â”€ */}
                  {repoData && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                        <h4 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
                          <Code2 size={14} className="text-blue-600" />
                          Repository Overview
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          {[
                            { label: 'Repository',      value: repoData.name },
                            { label: 'Owner',           value: repoData.owner },
                            { label: 'Visibility',      value: repoData.private ? 'Private' : 'Public',
                              badge: repoData.private ? 'warning' : 'success' },
                            { label: 'Default Branch',  value: repoData.defaultBranch },
                            { label: 'Language',        value: repoData.language || 'Not available' },
                            { label: 'Last Updated',    value: repoData.pushedAt ? formatDate(repoData.pushedAt) : 'Not available' },
                          ].map((item, idx) => (
                            <div key={idx}>
                              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">{item.label}</span>
                              {item.badge
                                ? <Badge variant={item.badge}>{item.value}</Badge>
                                : <span className="text-sm font-semibold text-slate-800">{item.value ?? 'Not available'}</span>}
                            </div>
                          ))}
                        </div>
                        {repoData.description && (
                          <div className="mt-5 pt-4 border-t border-slate-100">
                            <p className="text-xs text-slate-500 leading-relaxed">{repoData.description}</p>
                          </div>
                        )}
                      </div>

                      {/* Health Score */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card flex flex-col items-center justify-center text-center">
                        <div className="relative w-32 h-32 mb-4">
                          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                            <circle
                              cx="18" cy="18" r="15.9" fill="none"
                              stroke={analytics?.healthScore >= 80 ? '#10b981' : analytics?.healthScore >= 50 ? '#2563eb' : '#ef4444'}
                              strokeWidth="3"
                              strokeDasharray={`${analytics?.healthScore ?? 0} 100`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-3xl font-extrabold ${
                              (analytics?.healthScore ?? 0) >= 80 ? 'text-emerald-600' :
                              (analytics?.healthScore ?? 0) >= 50 ? 'text-blue-600' : 'text-red-500'
                            }`}>
                              {analytics?.healthScore ?? 'â€”'}%
                            </span>
                          </div>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                          <Shield size={14} className="text-blue-600" />
                          Sprint Health
                        </h4>
                        <p className="text-xs text-slate-500 max-w-[140px]">
                          Based on task completion, overdue items, and team activity
                        </p>
                      </div>
                    </div>
                  )}

                  {/* â”€â”€ Latest Commits â”€â”€ */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                    <h4 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
                      <GitBranch size={14} className="text-blue-600" />
                      Latest Commits
                      {commits.length > 0 && (
                        <span className="ml-auto text-xs font-normal text-slate-400">{commits.length} shown</span>
                      )}
                    </h4>
                    {ghSections.commits ? (
                      <p className="text-xs text-red-500">{ghSections.commits}</p>
                    ) : commits.length === 0 ? (
                      <p className="text-sm text-slate-400">No commits found in this repository.</p>
                    ) : (
                      <div className="space-y-2">
                        {commits.map((commit) => (
                          <div key={commit.sha} className="flex items-start justify-between gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                            <div className="flex items-start gap-3 min-w-0">
                              {commit.authorAvatar ? (
                                <img src={commit.authorAvatar} alt={commit.author} className="h-7 w-7 rounded-full shrink-0" />
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                  <User size={13} className="text-slate-500" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate leading-snug">{commit.message}</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {commit.author} Â· {commit.date ? formatDate(commit.date) : 'â€”'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <code className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{commit.shortSha}</code>
                              <a
                                href={commit.htmlUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                              >
                                <ExternalLink size={11} />
                                View
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* â”€â”€ Pull Requests + Issues â”€â”€ */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    {/* Pull Requests */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                      <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <GitPullRequest size={14} className="text-blue-600" />
                        Pull Requests
                      </h4>
                      {pullRequests && (
                        <div className="flex gap-4 mb-4">
                          {[
                            { label: 'Open',   count: pullRequests.counts.open,   color: 'text-emerald-600 bg-emerald-50' },
                            { label: 'Closed', count: pullRequests.counts.closed, color: 'text-slate-600 bg-slate-100' },
                            { label: 'Merged', count: pullRequests.counts.merged, color: 'text-purple-600 bg-purple-50' },
                          ].map((s) => (
                            <div key={s.label} className={`rounded-xl px-3 py-1.5 text-xs font-bold ${s.color}`}>
                              {s.count} {s.label}
                            </div>
                          ))}
                        </div>
                      )}
                      {!pullRequests ? (
                        <p className="text-xs text-slate-400">No pull request data available.</p>
                      ) : pullRequests.prs.length === 0 ? (
                        <p className="text-sm text-slate-400">No pull requests found.</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {pullRequests.prs.slice(0, 15).map((pr) => (
                            <div key={pr.number} className="flex items-start justify-between gap-2 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate">#{pr.number} {pr.title}</p>
                                <p className="text-xs text-slate-400">{pr.author} Â· {pr.updatedAt ? formatDate(pr.updatedAt) : 'â€”'}</p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                                  pr.state === 'open' ? 'bg-emerald-50 text-emerald-700' :
                                  pr.state === 'merged' ? 'bg-purple-50 text-purple-700' :
                                  'bg-slate-100 text-slate-600'
                                }`}>{pr.state}</span>
                                <a href={pr.htmlUrl} target="_blank" rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700">
                                  <ExternalLink size={11} />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Issues */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                      <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <CircleDot size={14} className="text-red-500" />
                        Issues
                      </h4>
                      {issues && (
                        <div className="flex gap-4 mb-4">
                          {[
                            { label: 'Open',   count: issues.counts.open,   color: 'text-red-600 bg-red-50' },
                            { label: 'Closed', count: issues.counts.closed, color: 'text-slate-600 bg-slate-100' },
                          ].map((s) => (
                            <div key={s.label} className={`rounded-xl px-3 py-1.5 text-xs font-bold ${s.color}`}>
                              {s.count} {s.label}
                            </div>
                          ))}
                        </div>
                      )}
                      {!issues ? (
                        <p className="text-xs text-slate-400">No issue data available.</p>
                      ) : issues.issues.length === 0 ? (
                        <p className="text-sm text-slate-400">No issues found.</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {issues.issues.slice(0, 15).map((issue) => (
                            <div key={issue.number} className="flex items-start justify-between gap-2 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate">#{issue.number} {issue.title}</p>
                                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                  {issue.labels.slice(0, 3).map((lbl) => (
                                    <span key={lbl.name}
                                      className="text-xs px-1.5 py-0.5 rounded-full font-medium border"
                                      style={{ borderColor: `#${lbl.color}44`, backgroundColor: `#${lbl.color}18`, color: `#${lbl.color}` }}
                                    >{lbl.name}</span>
                                  ))}
                                  <span className="text-xs text-slate-400">{issue.author} Â· {issue.updatedAt ? formatDate(issue.updatedAt) : 'â€”'}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                                  issue.state === 'open' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
                                }`}>{issue.state}</span>
                                <a href={issue.htmlUrl} target="_blank" rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700">
                                  <ExternalLink size={11} />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* â”€â”€ Contributors + Branches â”€â”€ */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    {/* Contributors */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                      <h4 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
                        <Users size={14} className="text-blue-600" />
                        Contributors
                      </h4>
                      {ghSections.contributors ? (
                        <p className="text-xs text-red-500">{ghSections.contributors}</p>
                      ) : contributors.length === 0 ? (
                        <p className="text-sm text-slate-400">No contributor data found.</p>
                      ) : (
                        <div className="space-y-2">
                          {contributors.map((c) => (
                            <div key={c.login} className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-2.5">
                                {c.avatar
                                  ? <img src={c.avatar} alt={c.login} className="h-7 w-7 rounded-full" />
                                  : <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center"><User size={13} /></div>}
                                <span className="text-sm font-semibold text-slate-800">{c.login}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-blue-600">{c.contributions} commits</span>
                                <a href={c.profileUrl} target="_blank" rel="noopener noreferrer"
                                  className="text-xs text-slate-400 hover:text-blue-600">
                                  <ExternalLink size={11} />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Branches */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                      <h4 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
                        <GitBranch size={14} className="text-sky-600" />
                        Branches
                        {branches.length > 0 && <span className="text-xs font-normal text-slate-400 ml-auto">{branches.length} total</span>}
                      </h4>
                      {branches.length === 0 ? (
                        <p className="text-sm text-slate-400">No branches found.</p>
                      ) : (
                        <div className="space-y-2">
                          {branches.map((b) => (
                            <div key={b.name} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50">
                              <div className="flex items-center gap-2">
                                <GitBranch size={12} className="text-slate-400" />
                                <span className="text-xs font-semibold text-slate-800">{b.name}</span>
                                {repoData?.defaultBranch === b.name && (
                                  <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">default</span>
                                )}
                                {b.protected && (
                                  <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">protected</span>
                                )}
                              </div>
                              {b.sha && <code className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">{b.sha}</code>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* â”€â”€ AI GitHub Insights (real data only) â”€â”€ */}
                  {githubInsights.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                      <h4 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
                        <Lightbulb size={14} className="text-amber-500" />
                        GitHub Insights
                        <span className="text-xs font-normal text-slate-400 ml-1">(generated from real data)</span>
                      </h4>
                      <div className="space-y-3">
                        {githubInsights.map((insight, idx) => {
                          const cfg = {
                            success: { cls: 'bg-emerald-50 border-emerald-100 text-emerald-700', icon: CheckCircle2, iconCls: 'text-emerald-500' },
                            warning: { cls: 'bg-amber-50 border-amber-100 text-amber-700',   icon: AlertCircle,  iconCls: 'text-amber-500'   },
                            info:    { cls: 'bg-blue-50 border-blue-100 text-blue-700',       icon: TrendingUp,   iconCls: 'text-blue-500'    },
                          }[insight.type] || { cls: 'bg-slate-50 border-slate-100 text-slate-700', icon: TrendingUp, iconCls: 'text-slate-400' };
                          const InsightIcon = cfg.icon;
                          return (
                            <div key={idx} className={`flex items-start gap-3 p-4 rounded-xl border ${cfg.cls}`}>
                              <InsightIcon size={14} className={`${cfg.iconCls} shrink-0 mt-0.5`} />
                              <p className="text-xs leading-relaxed font-medium">{insight.text}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}




          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              MODALS
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}

          {/* Edit Project Modal */}
          <Modal isOpen={editProjectModal} onClose={() => setEditProjectModal(false)} title="Configure Project Settings">
            <form onSubmit={handleUpdateProject} className="flex flex-col gap-4 text-left">
              <Input label="Project Title" id="editTitle" value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)} required />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="editDescription" className="text-sm font-semibold text-slate-700">Description</label>
                <textarea id="editDescription" value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)} rows={3}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] transition-all resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="editCategory" className="text-sm font-semibold text-slate-700">Category</label>
                  <select id="editCategory" value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)} className={selectCls}>
                    <option value="college">College Project</option>
                    <option value="corporate">Corporate Sprint</option>
                    <option value="personal">Personal Project</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="editStatus" className="text-sm font-semibold text-slate-700">Status</label>
                  <select id="editStatus" value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)} className={selectCls}>
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Deadline" id="editDeadline" type="date" value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)} required />
                <Input label="GitHub Repository URL" id="editRepoUrl" type="url" value={editRepoUrl}
                  onChange={(e) => setEditRepoUrl(e.target.value)} />
              </div>
              <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-slate-100">
                <Button variant="outline" onClick={() => setEditProjectModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Save Changes</Button>
              </div>
            </form>
          </Modal>

          {/* Task Modal */}
          <Modal isOpen={taskModal} onClose={() => setTaskModal(false)}
            title={editingTask ? 'Edit Task' : 'Add Task'}>
            <form onSubmit={handleCreateOrUpdateTask} className="flex flex-col gap-4 text-left">
              <Input label="Task Title" id="taskTitle" value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="E.g., Design database schema" required />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="taskDesc" className="text-sm font-semibold text-slate-700">Description</label>
                <textarea id="taskDesc" value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)} rows={2}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="taskAssignee" className="text-sm font-semibold text-slate-700">Assignee</label>
                  <select id="taskAssignee" value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)} className={selectCls}>
                    <option value="">Unassigned</option>
                    {project.members.map((m) => (
                      <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="taskPriority" className="text-sm font-semibold text-slate-700">Priority</label>
                  <select id="taskPriority" value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)} className={selectCls}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Deadline" id="taskDeadline" type="date" value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)} required />
                {editingTask && (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="taskStatus" className="text-sm font-semibold text-slate-700">Status</label>
                    <select id="taskStatus" value={taskStatus}
                      onChange={(e) => setTaskStatus(e.target.value)} className={selectCls}>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-slate-100">
                <Button variant="outline" onClick={() => setTaskModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">
                  {editingTask ? 'Save Task' : 'Create Task'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Contribution Modal */}
          <Modal isOpen={contribModal} onClose={() => setContribModal(false)} title="Log Contribution">
            <form onSubmit={handleAddContribution} className="flex flex-col gap-4 text-left">
              <Input label="Contribution Title" id="contribTitle" value={contribTitle}
                onChange={(e) => setContribTitle(e.target.value)}
                placeholder="E.g., Added OAuth helper classes" required />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="contribDesc" className="text-sm font-semibold text-slate-700">Description</label>
                <textarea id="contribDesc" value={contribDesc}
                  onChange={(e) => setContribDesc(e.target.value)}
                  placeholder="Details of contribution made..." rows={2}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="contribType" className="text-sm font-semibold text-slate-700">Type</label>
                  <select id="contribType" value={contribType}
                    onChange={(e) => setContribType(e.target.value)} className={selectCls}>
                    <option value="code">Code Development</option>
                    <option value="documentation">Documentation</option>
                    <option value="task">Task Accomplishment</option>
                    <option value="meeting">Meeting Participation</option>
                    <option value="review">Peer Review</option>
                    <option value="manual">Manual Work</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="contribImpact" className="text-sm font-semibold text-slate-700">
                    Impact Weight (1â€“10)
                  </label>
                  <input id="contribImpact" type="number" min={1} max={10}
                    value={contribImpact}
                    onChange={(e) => setContribImpact(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none" required />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-slate-100">
                <Button variant="outline" onClick={() => setContribModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Record Contribution</Button>
              </div>
            </form>
          </Modal>

        </main>
      </div>
    </div>
  );
};

export default ProjectDetails;
