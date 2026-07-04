import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { 
  getProjectById, 
  updateProject, 
  deleteProject, 
  addMember, 
  removeMember,
  updateMemberRole,
  getProjectActivities
} from '../api/projectApi';
import { 
  createTask, 
  getTasksByProject, 
  updateTask, 
  deleteTask,
  addTaskComment,
  deleteTaskComment,
  addTaskAttachment,
  deleteTaskAttachment
} from '../api/taskApi';
import { 
  addContribution, 
  getContributionsByProject, 
  getContributionsSummary 
} from '../api/contributionApi';
import { getProjectAnalytics } from '../api/analyticsApi';
import { 
  generateAISummary, 
  getChatHistory, 
  askAssistant, 
  getDailySummary, 
  getSprintPlan, 
  exportReport 
} from '../api/aiApi';
import { importMockContributions, getGitHubStatus } from '../api/githubApi';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatDate';

// Common Components
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import TaskCard from '../components/tasks/TaskCard';
import ContributionCard from '../components/contributions/ContributionCard';
import KanbanBoard from '../components/tasks/KanbanBoard';

// Recharts components for Analytics UI
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
  Legend 
} from 'recharts';

import { 
  Layout, 
  ListTodo, 
  History, 
  Users, 
  BarChart3, 
  BrainCircuit, 
  Plus, 
  Trash2, 
  Settings, 
  GitBranch, 
  ShieldAlert, 
  Heart,
  Calendar,
  Layers,
  MessageSquare,
  Paperclip,
  Clock,
  ArrowRight,
  UserCheck,
  FileText,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

const Github = ({ size = 16, className = "" }) => (
  <svg
    height={size}
    width={size}
    className={className}
    viewBox="0 0 16 16"
    fill="currentColor"
  >
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('college');
  const [editDeadline, setEditDeadline] = useState('');
  const [editRepoUrl, setEditRepoUrl] = useState('');
  const [editStatus, setEditStatus] = useState('planning');

  const [tasks, setTasks] = useState([]);
  const [taskModal, setTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [taskStatus, setTaskStatus] = useState('todo');

  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [detailEstimatedHours, setDetailEstimatedHours] = useState(0);
  const [detailActualHours, setDetailActualHours] = useState(0);
  const [detailLabels, setDetailLabels] = useState('');
  const [detailDependencies, setDetailDependencies] = useState([]);

  const [contributions, setContributions] = useState([]);
  const [contribModal, setContribModal] = useState(false);
  const [contribTitle, setContribTitle] = useState('');
  const [contribDesc, setContribDesc] = useState('');
  const [contribType, setContribType] = useState('code');
  const [contribImpact, setContribImpact] = useState(5);

  const [activities, setActivities] = useState([]);

  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');

  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  
  // AI Assistant State
  const [chatHistory, setChatHistory] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sprintPlan, setSprintPlan] = useState(null);
  const [sprintPlanLoading, setSprintPlanLoading] = useState(false);
  const [reportType, setReportType] = useState('Sprint');
  const [reportFormat, setReportFormat] = useState('pdf');
  
  const [selectedGithubCommit, setSelectedGithubCommit] = useState(null);

  const [gitStatus, setGitStatus] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  const isOwner = project && project.createdBy?._id === user?._id;

  const fetchProjectData = async () => {
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

      const [taskList, contribList, activityList, historyList] = await Promise.all([
        getTasksByProject(id),
        getContributionsByProject(id),
        getProjectActivities(id).catch(() => []),
        getChatHistory(id).catch(() => [])
      ]);
      setTasks(taskList);
      setContributions(contribList);
      setActivities(activityList);
      setChatHistory(historyList || []);
      setActivities(activityList);

      fetchGitHubStatus();
      fetchAnalytics();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch project details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGitHubStatus = async () => {
    try {
      const status = await getGitHubStatus(id);
      setGitStatus(status);
    } catch (err) {
      console.error('Failed to get GitHub status:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const data = await getProjectAnalytics(id);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to get analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchActivitiesData = async () => {
    try {
      const list = await getProjectActivities(id);
      setActivities(list);
    } catch (err) {
      console.error('Failed to load activities:', err);
    }
  };

  const handleAskAssistantSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    try {
      setChatLoading(true);
      const res = await askAssistant(id, chatMessage);
      setChatHistory(prev => [...prev, res.userMessage, res.aiMessage]);
      setChatMessage('');
    } catch (err) {
      console.error('Failed to ask assistant:', err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleGenerateSprintPlan = async () => {
    try {
      setSprintPlanLoading(true);
      const plan = await getSprintPlan(id);
      setSprintPlan(plan);
    } catch (err) {
      console.error('Failed to generate sprint plan:', err);
    } finally {
      setSprintPlanLoading(false);
    }
  };

  const handleExportReport = () => {
    window.open(exportReport(id, reportType, reportFormat), '_blank');
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const handleRetry = () => {
    setError('');
    fetchProjectData();
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const updated = await updateProject(id, {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        deadline: editDeadline,
        repoUrl: editRepoUrl,
        status: editStatus
      });
      setProject(updated);
      setSuccess('Project settings updated successfully.');
      fetchProjectData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update project.');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete this project? This action is permanent.')) return;
    setError('');
    try {
      await deleteProject(id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete project.');
    }
  };

  const handleCreateOrUpdateTask = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingTask) {
        await updateTask(editingTask._id, {
          title: taskTitle,
          description: taskDesc,
          assignedTo: taskAssignee || undefined,
          priority: taskPriority,
          deadline: taskDeadline,
          status: taskStatus,
        });
      } else {
        await createTask(id, {
          title: taskTitle,
          description: taskDesc,
          assignedTo: taskAssignee || undefined,
          priority: taskPriority,
          deadline: taskDeadline,
        });
      }

      setTaskTitle('');
      setTaskDesc('');
      setTaskAssignee('');
      setTaskPriority('medium');
      setTaskDeadline('');
      setEditingTask(null);
      setTaskModal(false);

      const list = await getTasksByProject(id);
      setTasks(list);
      fetchAnalytics();
      fetchActivitiesData();
      setSuccess(editingTask ? 'Task updated.' : 'Task created.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process task.');
    }
  };

  const handleEditTaskClick = (task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskAssignee(task.assignedTo?._id || '');
    setTaskPriority(task.priority);
    setTaskDeadline(task.deadline ? task.deadline.substring(0, 10) : '');
    setTaskStatus(task.status);
    setTaskModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      const list = await getTasksByProject(id);
      setTasks(list);
      fetchAnalytics();
      fetchActivitiesData();
      setSuccess('Task deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task.');
    }
  };

  const handleSaveTaskDetails = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateTask(selectedTask._id, {
        estimatedHours: Number(detailEstimatedHours),
        actualHours: Number(detailActualHours),
        labels: detailLabels.split(',').map((l) => l.trim()).filter(Boolean),
        dependencies: detailDependencies,
      });
      setSelectedTask(updated);
      const list = await getTasksByProject(id);
      setTasks(list);
      fetchAnalytics();
      fetchActivitiesData();
      setSuccess('Task inspector attributes updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save inspector details.');
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    const previousTasks = [...tasks];
    setTasks(tasks.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)));
    try {
      await updateTask(taskId, { status: newStatus });
      fetchAnalytics();
      fetchActivitiesData();
    } catch (err) {
      setTasks(previousTasks);
      setError(err.response?.data?.message || 'Failed to update task column status.');
    }
  };

  const handleTaskCardClick = (task) => {
    setSelectedTask(task);
    setDetailEstimatedHours(task.estimatedHours || 0);
    setDetailActualHours(task.actualHours || 0);
    setDetailLabels(task.labels ? task.labels.join(', ') : '');
    setDetailDependencies(task.dependencies || []);
    setShowDetailModal(true);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    try {
      const updated = await addTaskComment(selectedTask._id, { text: newCommentText });
      setSelectedTask(updated);
      setNewCommentText('');
      const list = await getTasksByProject(id);
      setTasks(list);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post comment.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const updated = await deleteTaskComment(selectedTask._id, commentId);
      setSelectedTask(updated);
      const list = await getTasksByProject(id);
      setTasks(list);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete comment.');
    }
  };

  const handleAddAttachment = async (e) => {
    e.preventDefault();
    if (!newAttachmentName.trim() || !newAttachmentUrl.trim()) return;
    try {
      const updated = await addTaskAttachment(selectedTask._id, {
        name: newAttachmentName,
        url: newAttachmentUrl,
      });
      setSelectedTask(updated);
      setNewAttachmentName('');
      setNewAttachmentUrl('');
      const list = await getTasksByProject(id);
      setTasks(list);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to link attachment.');
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      const updated = await deleteTaskAttachment(selectedTask._id, attachmentId);
      setSelectedTask(updated);
      const list = await getTasksByProject(id);
      setTasks(list);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete attachment.');
    }
  };

  const handleAddContribution = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await addContribution(id, {
        title: contribTitle,
        description: contribDesc,
        type: contribType,
        impactScore: Number(contribImpact),
        source: 'manual',
      });
      setContribTitle('');
      setContribDesc('');
      setContribType('code');
      setContribImpact(5);
      setContribModal(false);
      const list = await getContributionsByProject(id);
      setContributions(list);
      fetchAnalytics();
      fetchActivitiesData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log contribution.');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await addMember(id, {
        email: memberEmail,
        role: memberRole
      });
      setMemberEmail('');
      setSuccess('Teammate invited successfully.');
      fetchProjectData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member.');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    setError('');
    try {
      await removeMember(id, userId);
      setSuccess('Member removed.');
      fetchProjectData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateMemberRole(id, userId, { role: newRole });
      setSuccess('Member role updated.');
      fetchProjectData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change role.');
    }
  };

  const handleGenerateAISummary = async () => {
    try {
      setAiLoading(true);
      setError('');
      const data = await generateAISummary(id);
      setAiSummary(data);
    } catch (err) {
      setError('Failed to generate summary.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleMockImport = async () => {
    try {
      setImportLoading(true);
      setError('');
      await importMockContributions(id);
      setSuccess('Imported commits from GitHub!');
      fetchProjectData();
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed.');
    } finally {
      setImportLoading(false);
    }
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

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const upcomingDeadlines = tasks
    .filter((t) => t.status !== 'completed' && new Date(t.deadline) >= new Date())
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="flex flex-1 animate-fadeIn">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full text-left">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8 border-b border-gray-900 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-white">{project.title}</h1>
                <Badge variant={project.status === 'completed' ? 'success' : 'default'}>
                  {project.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mt-2 max-w-2xl leading-relaxed">{project.description}</p>
            </div>
            <div className="flex items-center gap-3 bg-gray-900 border border-gray-850 px-4 py-2 rounded-xl">
              <span className="text-xs text-gray-500 font-semibold uppercase">Category:</span>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">{project.category}</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm flex items-center justify-between">
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

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm animate-fadeIn">
              {success}
            </div>
          )}

          <div className="flex border-b border-gray-850 gap-6 mb-8 overflow-x-auto shrink-0 scrollbar-none">
            {[
              { id: 'overview', label: 'Overview', icon: Layout },
              { id: 'tasks', label: 'Tasks', icon: ListTodo },
              { id: 'kanban', label: 'Kanban Board', icon: Layers },
              { id: 'members', label: 'Members', icon: Users },
              { id: 'timeline', label: 'Timeline', icon: History },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'ai-assistant', label: 'AI Assistant', icon: BrainCircuit },
              { id: 'reports', label: 'Reports', icon: FileText },
              { id: 'github', label: 'GitHub', icon: Github },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setError('');
                    setSuccess('');
                  }}
                  className={`flex items-center gap-2 pb-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-400 font-bold scale-[1.02]'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-xl border border-gray-850 bg-gray-900/40 p-6">
                  <h3 className="text-base font-semibold text-white mb-4">Project Parameters</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <span className="text-xs text-gray-500 font-semibold block uppercase">Category</span>
                      <span className="text-sm font-medium text-gray-200 mt-1 block capitalize">{project.category}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-semibold block uppercase">Delivery Deadline</span>
                      <span className="text-sm font-medium text-gray-200 mt-1 block">{formatDate(project.deadline)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-semibold block uppercase">Created By</span>
                      <span className="text-sm font-medium text-gray-200 mt-1 block">{project.createdBy?.name} ({project.createdBy?.email})</span>
                    </div>
                  </div>
                </div>

                {analytics && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="rounded-xl border border-gray-850 bg-gray-900/60 p-5 flex flex-col justify-between relative overflow-hidden group">
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-indigo-500" />
                      <span className="text-xs text-gray-500 font-semibold uppercase">Sprint Health</span>
                      <span className="text-3xl font-extrabold mt-2 text-white block group-hover:text-indigo-400 transition-colors">
                        {analytics.healthScore}%
                      </span>
                    </div>
                    <div className="rounded-xl border border-gray-850 bg-gray-900/60 p-5 flex flex-col justify-between relative overflow-hidden group">
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-emerald-500" />
                      <span className="text-xs text-gray-500 font-semibold uppercase">Completion</span>
                      <span className="text-3xl font-extrabold mt-2 text-white block group-hover:text-emerald-400 transition-colors">
                        {analytics.projectProgressPercentage}%
                      </span>
                    </div>
                    <div className="rounded-xl border border-gray-850 bg-gray-900/60 p-5 flex flex-col justify-between relative overflow-hidden group">
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-rose-500" />
                      <span className="text-xs text-gray-500 font-semibold uppercase">Deadline Risk</span>
                      <span className={`text-3xl font-extrabold mt-2 capitalize block ${
                        analytics.deadlineRisk === 'high' ? 'text-rose-455' : analytics.deadlineRisk === 'medium' ? 'text-amber-450' : 'text-emerald-400'
                      }`}>
                        {analytics.deadlineRisk}
                      </span>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-gray-850 bg-gray-900/40 p-6">
                  <h3 className="text-base font-semibold text-white mb-4">Upcoming Deadlines</h3>
                  {upcomingDeadlines.length === 0 ? (
                    <p className="text-sm text-gray-500">No upcoming task deadlines.</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingDeadlines.map((task) => (
                        <div
                          key={task._id}
                          onClick={() => handleTaskCardClick(task)}
                          className="p-3 rounded-lg border border-gray-850 bg-gray-950/40 hover:bg-gray-950 flex items-center justify-between cursor-pointer transition-all hover:border-gray-800"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${
                              task.priority === 'critical' ? 'bg-rose-500' : task.priority === 'high' ? 'bg-amber-500' : 'bg-indigo-500'
                            }`} />
                            <span className="text-sm font-semibold text-gray-200">{task.title}</span>
                          </div>
                          <span className="text-xs text-rose-400 font-medium">
                            Due {formatDate(task.deadline)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-gray-850 bg-gray-900/40 p-6 flex flex-col max-h-[350px]">
                  <h3 className="text-base font-semibold text-white mb-4">Recent Workspace Activity</h3>
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                    {activities.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4">No recent activity logs.</p>
                    ) : (
                      activities.slice(0, 8).map((act) => (
                        <div key={act._id} className="text-xs flex flex-col border-b border-gray-900/80 pb-2">
                          <span className="text-gray-300 font-medium leading-relaxed">{act.content}</span>
                          <span className="text-[10px] text-gray-500 mt-1 block">
                            by {act.userId?.name} • {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-850 bg-indigo-950/10 p-6 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-indigo-400 mb-3">
                    <BrainCircuit size={18} />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Quick AI Summary</h3>
                  </div>
                  {aiSummary ? (
                    <p className="text-xs text-gray-300 italic leading-relaxed">
                      "{aiSummary.summary}"
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-400">Generate an immediate narrative synthesis of sprint telemetry.</p>
                      <Button variant="primary" onClick={handleGenerateAISummary} loading={aiLoading} className="w-full text-xs py-1.5">
                        Generate Quick Summary
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Sprint Tasks ({tasks.length})</h3>
                <Button variant="primary" onClick={() => { setEditingTask(null); setTaskModal(true); }} className="flex items-center gap-1">
                  <Plus size={16} />
                  Add Task
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onEdit={handleEditTaskClick}
                    onDelete={handleDeleteTask}
                    onDetailsClick={() => handleTaskCardClick(task)}
                    canModify={isOwner || task.createdBy === user._id}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'kanban' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Interactive Kanban Board</h3>
                <span className="text-xs text-gray-500 font-medium">Drag and drop cards across columns to update task progress.</span>
              </div>
              <KanbanBoard
                tasks={tasks}
                onTaskDrop={handleTaskStatusChange}
                onCardClick={handleTaskCardClick}
                members={project.members}
              />
            </div>
          )}

          {activeTab === 'members' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 rounded-xl border border-gray-850 bg-gray-900/40 p-6 text-left">
                <h3 className="text-base font-semibold text-white mb-6">Workspace Collaborators</h3>
                <div className="space-y-4">
                  {project.members.map((member) => {
                    const isMemberInactive = analytics?.inactiveMembers?.some((im) => im._id === member.user._id);
                    const workloadScoreObj = analytics?.memberContributionPercentages?.find((m) => m.user._id === member.user._id);
                    const workloadPercentage = workloadScoreObj ? workloadScoreObj.contributionPercentage : 0;

                    return (
                      <div key={member.user._id} className="flex items-center justify-between border-b border-gray-900 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3.5">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-650 to-purple-650 flex items-center justify-center font-bold text-sm text-white shrink-0 shadow">
                            {getInitials(member.user.name)}
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-200 leading-none">{member.user.name}</span>
                              <Badge variant={isMemberInactive ? 'warning' : 'success'} className="text-[9px] px-1.5">
                                {isMemberInactive ? 'Inactive' : 'Active'}
                              </Badge>
                            </div>
                            <span className="text-xs text-gray-500 mt-1 block leading-none">{member.user.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-gray-500 uppercase font-semibold">Impact Share</span>
                            <span className="text-sm font-bold text-indigo-400 mt-1">{workloadPercentage}%</span>
                          </div>

                          <div className="flex flex-col text-left">
                            <span className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Project Role</span>
                            {isOwner && member.user._id !== user._id ? (
                              <select
                                value={member.projectRole || 'member'}
                                onChange={(e) => handleRoleChange(member.user._id, e.target.value)}
                                className="rounded bg-gray-950 border border-gray-850 px-2 py-0.5 text-xs text-gray-300"
                              >
                                <option value="member">Member</option>
                                <option value="reviewer">Reviewer</option>
                                <option value="team_leader">Team Leader</option>
                              </select>
                            ) : (
                              <span className="text-xs font-medium text-gray-300 capitalize">
                                {member.projectRole}
                              </span>
                            )}
                          </div>

                          {isOwner && member.user._id !== user._id && (
                            <Button 
                              variant="ghost" 
                              onClick={() => handleRemoveMember(member.user._id)}
                              className="text-gray-500 hover:text-rose-500 p-1.5"
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {isOwner && (
                <div className="rounded-xl border border-gray-850 bg-gray-900 p-6 h-fit text-left">
                  <h3 className="text-base font-semibold text-white mb-4">Invite Team Member</h3>
                  <form onSubmit={handleAddMember} className="flex flex-col gap-4">
                    <Input
                      label="User Email"
                      id="memberEmail"
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="e.g. co-worker@college.edu"
                      required
                    />

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="memberRole" className="text-sm font-medium text-gray-300">
                        Project Role
                      </label>
                      <select
                        id="memberRole"
                        value={memberRole}
                        onChange={(e) => setMemberRole(e.target.value)}
                        className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-white"
                      >
                        <option value="member">Member</option>
                        <option value="reviewer">Reviewer</option>
                        <option value="team_leader">Team Leader</option>
                      </select>
                    </div>

                    <Button type="submit" variant="primary" className="mt-2 py-2">
                      Invite to Project
                    </Button>
                  </form>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Contribution History</h3>
                  <p className="text-sm text-gray-400">Activity and manual logs showing impact weights and work types.</p>
                </div>
                <Button variant="primary" onClick={() => setContribModal(true)} className="flex items-center gap-1">
                  <Plus size={16} />
                  Log Contribution
                </Button>
              </div>

              {contributions.length === 0 ? (
                <EmptyState
                  title="No contributions logged"
                  description="Record manual project contributions or synchronize them from GitHub commits."
                  actionText="Log Contribution"
                  onAction={() => setContribModal(true)}
                />
              ) : (
                <div className="relative border-l border-gray-850 pl-6 ml-4 space-y-6 py-2 text-left">
                  {contributions.map((c) => {
                    let externalUrl = null;
                    let hashMatch = null;
                    let isMock = false;

                    if (c.source === 'github') {
                      hashMatch = c.title.match(/GitHub Commit ([\w\d]+)/i);
                      // If it contains "imported via", it's likely a generated mock by the backend githubService
                      isMock = c.description.includes('(imported via');
                      
                      if (hashMatch && hashMatch[1] && project?.repoUrl && !isMock) {
                        const cleanRepo = project.repoUrl.replace(/\.git\/?$/, '').replace(/\/$/, '');
                        externalUrl = `${cleanRepo}/commit/${hashMatch[1]}`;
                      }
                    }

                    const handleCardClick = () => {
                      if (c.source === 'github') {
                        setSelectedGithubCommit({
                          ...c,
                          hash: hashMatch ? hashMatch[1] : 'Unknown',
                          externalUrl,
                          isMock
                        });
                      }
                    };

                    return (
                      <div key={c._id} className="relative group">
                        <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 border-2 border-indigo-500 text-white shrink-0 z-10 group-hover:scale-110 transition-transform" />
                        
                        <div 
                          onClick={handleCardClick}
                          className={`block p-4 rounded-xl border border-gray-850 bg-gray-900/35 hover:bg-gray-900/60 transition-colors ${c.source === 'github' ? 'cursor-pointer hover:border-indigo-500/50 group/card' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold text-indigo-400 capitalize bg-indigo-950/40 border border-indigo-900/50 px-2 py-0.5 rounded">
                                  {c.type}
                                </span>
                                {isMock && (
                                  <Badge variant="warning" className="text-[10px] px-1.5 py-0 border border-amber-500/30">
                                    Demo Data
                                  </Badge>
                                )}
                                <h4 className="text-sm font-bold text-gray-150 leading-none flex items-center gap-1.5">
                                  {c.title}
                                  {c.source === 'github' && <ExternalLink size={12} className="text-gray-500 group-hover/card:text-indigo-400 transition-colors" />}
                                </h4>
                              </div>
                              <p className="text-xs text-gray-400 mt-2 leading-relaxed line-clamp-2">{c.description}</p>
                            </div>
                            
                            <div className="text-right shrink-0 flex flex-col items-end">
                              <span className="text-xs font-bold text-emerald-400">+{c.impactScore} Impact</span>
                              <span className="text-[10px] text-gray-500 mt-2 block">
                                {new Date(c.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              {analyticsLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                </div>
              ) : !analytics ? (
                <EmptyState
                  title="Analytics not ready"
                  description="Complete tasks or log contribution events to display metric summaries."
                />
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="rounded-xl border border-gray-850 bg-gray-900 p-6 relative">
                      <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
                      <span className="text-xs font-semibold text-gray-500 block uppercase">Project Progress</span>
                      <span className="text-3xl font-extrabold text-white mt-2 block">{analytics.projectProgressPercentage}%</span>
                      <span className="text-xs text-gray-500 mt-2 block">{analytics.completedTasks} / {analytics.totalTasks} Tasks Completed</span>
                    </div>

                    <div className="rounded-xl border border-gray-850 bg-gray-900 p-6 relative">
                      <div className="absolute top-0 left-0 w-full h-1 bg-purple-500" />
                      <span className="text-xs font-semibold text-gray-500 block uppercase">Team Health Score</span>
                      <span className="text-3xl font-extrabold text-white mt-2 block">{analytics.healthScore}/100</span>
                      <span className="text-xs text-gray-500 mt-2 block">Deductions for overdue work and inactive users</span>
                    </div>

                    <div className="rounded-xl border border-gray-850 bg-gray-900 p-6 relative">
                      <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
                      <span className="text-xs font-semibold text-gray-500 block uppercase">Overdue Tasks</span>
                      <span className="text-3xl font-extrabold text-rose-550 mt-2 block">{analytics.overdueTasks}</span>
                      <span className="text-xs text-gray-500 mt-2 block">Pending items past deadline</span>
                    </div>

                    <div className="rounded-xl border border-gray-850 bg-gray-900 p-6 relative">
                      <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
                      <span className="text-xs font-semibold text-gray-500 block uppercase">Risk Rating</span>
                      <Badge variant={analytics.deadlineRisk === 'high' ? 'danger' : analytics.deadlineRisk === 'medium' ? 'warning' : 'success'} className="mt-3 text-xs px-2.5 py-1">
                        {analytics.deadlineRisk} Risk
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="rounded-xl border border-gray-850 bg-gray-900/40 p-6">
                      <h3 className="text-base font-semibold text-white mb-6">Task Telemetry</h3>
                      <div className="h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: 'Total', count: analytics.totalTasks },
                            { name: 'Completed', count: analytics.completedTasks },
                            { name: 'Pending', count: analytics.pendingTasks },
                            { name: 'Overdue', count: analytics.overdueTasks }
                          ]}>
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', color: '#fff' }} />
                            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-850 bg-gray-900/40 p-6">
                      <h3 className="text-base font-semibold text-white mb-6">Contribution Weight</h3>
                      <div className="h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={analytics.memberContributionPercentages} dataKey="contributionPercentage" nameKey="user.name" cx="50%" cy="50%" outerRadius={80}>
                              {analytics.memberContributionPercentages.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', color: '#fff' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai-assistant' && (
            <div className="max-w-3xl mx-auto text-left space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">AI Project Assistant</h3>
                  <p className="text-sm text-gray-400">Ask questions about sprint workload, risk vectors, or top contributors.</p>
                </div>
                <Button variant="outline" onClick={handleGenerateSprintPlan} disabled={sprintPlanLoading}>
                  {sprintPlanLoading ? 'Generating...' : 'Auto-Generate Sprint Plan'}
                </Button>
              </div>

              {sprintPlan && (
                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-6 space-y-4">
                  <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">AI Recommended Sprint Plan</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {sprintPlan.length === 0 ? (
                      <p className="text-xs text-gray-400">No pending tasks to assign.</p>
                    ) : sprintPlan.map(task => (
                      <div key={task.taskId} className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-semibold text-white">{task.taskTitle}</span>
                          <Badge variant={task.priority === 'high' || task.priority === 'critical' ? 'danger' : 'primary'} className="text-[10px] px-2 py-0.5">{task.priority}</Badge>
                        </div>
                        <p className="text-xs text-indigo-300 font-medium">Re-assign to: {task.recommendedAssigneeName || 'Unassigned'}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{task.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-gray-850 bg-gray-900/60 p-6 h-[400px] flex flex-col justify-between">
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">AI</div>
                    <div className="p-3.5 rounded-xl bg-gray-950 text-xs text-gray-300 max-w-[80%] border border-gray-850 shadow-sm whitespace-pre-wrap">
                      Hello! I'm your Project Intelligence Assistant. I have full context on the team's contribution weights, tasks backlog, and deadline delays. How can I help you today?
                    </div>
                  </div>
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center font-bold text-[10px] ${msg.sender === 'user' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                        {msg.sender === 'user' ? 'ME' : 'AI'}
                      </div>
                      <div className={`p-3.5 rounded-xl text-xs max-w-[80%] whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-950 text-gray-300 border border-gray-850 shadow-sm'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">AI</div>
                      <div className="p-3.5 rounded-xl bg-gray-950 text-xs text-gray-400 border border-gray-850 shadow-sm">
                        <span className="animate-pulse">Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleAskAssistantSubmit} className="border-t border-gray-850 pt-4 flex gap-3">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Ask about project velocity or workloads..."
                    className="flex-1 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <Button type="submit" variant="primary" disabled={chatLoading} className="text-xs">Send</Button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="max-w-2xl mx-auto text-left space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white">AI Report Generator</h3>
                <p className="text-sm text-gray-400">Export formatted analytical summaries for managers or advisors.</p>
              </div>

              <div className="rounded-xl border border-gray-850 bg-gray-900 p-6 space-y-4">
                <span className="text-xs font-semibold text-gray-500 uppercase block">Report Specifications</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Target Format</label>
                    <select 
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="rounded bg-gray-950 border border-gray-850 p-2 text-xs text-white"
                    >
                      <option value="Sprint">Sprint Accomplishments (Weekly)</option>
                      <option value="Manager">Manager Summary (Monthly)</option>
                      <option value="Professor">Professor Assessment Report</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase">File Export Type</label>
                    <select 
                      value={reportFormat}
                      onChange={(e) => setReportFormat(e.target.value)}
                      className="rounded bg-gray-950 border border-gray-850 p-2 text-xs text-white"
                    >
                      <option value="pdf">PDF Document (.pdf)</option>
                      <option value="csv">Comma Separated Values (.csv)</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-gray-850 pt-4 mt-2">
                  <Button variant="primary" onClick={handleExportReport} className="w-full text-xs py-2 flex items-center justify-center gap-2">
                    <FileText size={16} /> Generate & Export
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'github' && (
            <div className="max-w-2xl mx-auto text-left">
              <h3 className="text-lg font-semibold text-white mb-2">GitHub Telemetry Connector</h3>
              <p className="text-sm text-gray-400 mb-6">Synchronize repository commit streams directly into project timeline data.</p>

              {gitStatus && (
                <div className="rounded-xl border border-gray-850 bg-gray-900 p-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <span className="text-xs text-gray-500 block font-semibold uppercase">Connection Status</span>
                      <Badge variant={gitStatus.connected ? 'success' : 'danger'} className="mt-2 px-3 py-1">
                        {gitStatus.connected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block font-semibold uppercase">Last Synchronized</span>
                      <span className="text-sm font-medium text-white block mt-2">
                        {gitStatus.lastImportedAt ? formatDate(gitStatus.lastImportedAt) : 'Never'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-800 pt-6">
                    <span className="text-xs text-gray-500 block font-semibold uppercase">Repository Link</span>
                    <span className="text-sm text-gray-300 font-mono block mt-2 truncate bg-gray-950 p-3 rounded-lg border border-gray-850">
                      {gitStatus.repoUrl || 'No Repository URL is configured.'}
                    </span>
                  </div>

                  {gitStatus.connected ? (
                    <Button 
                      variant="primary" 
                      onClick={handleMockImport}
                      loading={importLoading}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs"
                    >
                      <Github size={18} />
                      Mock Sync Commits
                    </Button>
                  ) : (
                    <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-rose-500/10 border border-rose-500/25">
                      <p className="text-xs text-rose-400">Please click the "Settings" tab and set a Repository URL to connect your project workspace with GitHub.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto text-left space-y-8">
              <div className="rounded-xl border border-gray-850 bg-gray-900 p-6">
                <h3 className="text-base font-semibold text-white mb-6">Configure Project Parameters</h3>
                <form onSubmit={handleUpdateProject} className="flex flex-col gap-4">
                  <Input
                    label="Project Title"
                    id="editTitle"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="editDescription" className="text-sm font-medium text-gray-300">
                      Description
                    </label>
                    <textarea
                      id="editDescription"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="editCategory" className="text-sm font-medium text-gray-300">
                        Category
                      </label>
                      <select
                        id="editCategory"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-white"
                      >
                        <option value="college">College Project</option>
                        <option value="corporate">Corporate Sprint</option>
                        <option value="personal">Personal Project</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="editStatus" className="text-sm font-medium text-gray-300">
                        Sprint Status
                      </label>
                      <select
                        id="editStatus"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-white"
                      >
                        <option value="planning">Planning</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Deadline"
                      id="editDeadline"
                      type="date"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                      required
                    />

                    <Input
                      label="GitHub Repository URL"
                      id="editRepoUrl"
                      type="url"
                      value={editRepoUrl}
                      onChange={(e) => setEditRepoUrl(e.target.value)}
                    />
                  </div>

                  {isOwner && (
                    <div className="flex justify-end gap-3 mt-4 border-t border-gray-800 pt-4">
                      <Button type="submit" variant="primary">
                        Save Changes
                      </Button>
                    </div>
                  )}
                </form>
              </div>

              {isOwner && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 text-left">
                  <h3 className="text-base font-semibold text-white mb-2">Danger Zone</h3>
                  <p className="text-xs text-gray-400 mb-6">Once you delete a project, there is no going back. Please be certain.</p>
                  <Button variant="danger" onClick={handleDeleteProject} className="flex items-center gap-1.5">
                    <Trash2 size={15} />
                    Delete Project
                  </Button>
                </div>
              )}
            </div>
          )}

          <Modal
            isOpen={taskModal}
            onClose={() => setTaskModal(false)}
            title={editingTask ? 'Configure Task' : 'Add Task'}
          >
            <form onSubmit={handleCreateOrUpdateTask} className="flex flex-col gap-4 text-left">
              <Input
                label="Task Title"
                id="taskTitle"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="E.g. Setup route endpoints"
                required
              />

              <div className="flex flex-col gap-1.5">
                <label htmlFor="taskDesc" className="text-sm font-medium text-gray-300">
                  Description
                </label>
                <textarea
                  id="taskDesc"
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="taskAssignee" className="text-sm font-medium text-gray-300">
                    Assignee
                  </label>
                  <select
                    id="taskAssignee"
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-white"
                  >
                    <option value="">Unassigned</option>
                    {project.members.map((m) => (
                      <option key={m.user._id} value={m.user._id}>
                        {m.user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="taskPriority" className="text-sm font-medium text-gray-300">
                    Priority
                  </label>
                  <select
                    id="taskPriority"
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Deadline"
                  id="taskDeadline"
                  type="date"
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                  required
                />

                {editingTask && (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="taskStatus" className="text-sm font-medium text-gray-300">
                      Task Status
                    </label>
                    <select
                      id="taskStatus"
                      value={taskStatus}
                      onChange={(e) => setTaskStatus(e.target.value)}
                      className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-white"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-gray-800 pt-4">
                <Button variant="outline" onClick={() => setTaskModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {editingTask ? 'Save Task' : 'Create Task'}
                </Button>
              </div>
            </form>
          </Modal>

          {showDetailModal && selectedTask && (
            <Modal
              isOpen={showDetailModal}
              onClose={() => setShowDetailModal(false)}
              title={`Task Inspector: ${selectedTask.title}`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                <div className="lg:col-span-2 space-y-6">
                  <div className="p-4 rounded-xl border border-gray-850 bg-gray-950/40">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Attributes & Metrics</h4>
                    <form onSubmit={handleSaveTaskDetails} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Estimated Hours"
                          id="detailEstimatedHours"
                          type="number"
                          value={detailEstimatedHours}
                          onChange={(e) => setDetailEstimatedHours(e.target.value)}
                        />
                        <Input
                          label="Actual Hours"
                          id="detailActualHours"
                          type="number"
                          value={detailActualHours}
                          onChange={(e) => setDetailActualHours(e.target.value)}
                        />
                      </div>

                      <Input
                        label="Labels (comma separated)"
                        id="detailLabels"
                        value={detailLabels}
                        onChange={(e) => setDetailLabels(e.target.value)}
                        placeholder="e.g. backend, blocker, db"
                      />

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-300">Task Dependencies</label>
                        <div className="max-h-24 overflow-y-auto border border-gray-800 rounded bg-gray-950 p-2 space-y-1.5">
                          {tasks
                            .filter((t) => t._id !== selectedTask._id)
                            .map((t) => {
                              const isChecked = detailDependencies.includes(t._id);
                              return (
                                <label key={t._id} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setDetailDependencies([...detailDependencies, t._id]);
                                      } else {
                                        setDetailDependencies(detailDependencies.filter((id) => id !== t._id));
                                      }
                                    }}
                                    className="rounded border-gray-800 bg-gray-950 text-indigo-500 focus:ring-0"
                                  />
                                  <span>{t.title}</span>
                                </label>
                              );
                            })}
                        </div>
                      </div>

                      <Button type="submit" variant="primary" className="text-xs py-1.5 px-3">
                        Save Inspector Values
                      </Button>
                    </form>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Comments</h4>
                    
                    <form onSubmit={handleAddComment} className="flex gap-2">
                      <input
                        type="text"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <Button type="submit" variant="primary" className="text-xs px-3">
                        Post
                      </Button>
                    </form>

                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {(!selectedTask.comments || selectedTask.comments.length === 0) ? (
                        <p className="text-xs text-gray-550 italic">No comments posted yet.</p>
                      ) : (
                        selectedTask.comments.map((comment) => (
                          <div key={comment._id} className="p-3 rounded-lg border border-gray-900 bg-gray-950/20 text-xs">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-indigo-400">{comment.user?.name || 'User'}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                {(comment.user === user?._id || comment.user?._id === user?._id) && (
                                  <button onClick={() => handleDeleteComment(comment._id)} className="text-gray-550 hover:text-rose-500">
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-gray-300 leading-relaxed">{comment.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-4 rounded-xl border border-gray-850 bg-gray-950/40 space-y-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Attachments</h4>
                    
                    <form onSubmit={handleAddAttachment} className="space-y-2">
                      <input
                        type="text"
                        value={newAttachmentName}
                        onChange={(e) => setNewAttachmentName(e.target.value)}
                        placeholder="Link Name (e.g. API Spec)"
                        className="w-full rounded bg-gray-950 border border-gray-850 p-1.5 text-xs text-white"
                        required
                      />
                      <input
                        type="url"
                        value={newAttachmentUrl}
                        onChange={(e) => setNewAttachmentUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full rounded bg-gray-950 border border-gray-850 p-1.5 text-xs text-white"
                        required
                      />
                      <Button type="submit" variant="primary" className="w-full text-xs py-1">
                        Link File URL
                      </Button>
                    </form>

                    <div className="space-y-2 max-h-36 overflow-y-auto">
                      {(!selectedTask.attachments || selectedTask.attachments.length === 0) ? (
                        <p className="text-xs text-gray-550 italic">No attachments connected.</p>
                      ) : (
                        selectedTask.attachments.map((file) => (
                          <div key={file._id} className="flex items-center justify-between p-2 rounded bg-gray-950/30 text-xs border border-gray-900">
                            <a href={file.url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline truncate max-w-[80%] flex items-center gap-1.5">
                              <Paperclip size={12} />
                              {file.name}
                            </a>
                            <button onClick={() => handleDeleteAttachment(file._id)} className="text-gray-500 hover:text-rose-500 shrink-0">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-850 bg-gray-900/10 flex flex-col max-h-[300px]">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Task Audit Log</h4>
                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                      {(!selectedTask.history || selectedTask.history.length === 0) ? (
                        <p className="text-xs text-gray-550 italic">No events logged yet.</p>
                      ) : (
                        selectedTask.history.map((log, idx) => (
                          <div key={idx} className="text-[10px] flex flex-col border-b border-gray-950 pb-2">
                            <span className="text-gray-300 leading-normal">
                              Changed <strong className="text-indigo-400">{log.field}</strong> from <span className="line-through text-gray-500">"{log.oldValue}"</span> to <strong className="text-emerald-400">"{log.newValue}"</strong>
                            </span>
                            <span className="text-[9px] text-gray-500 mt-1">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Modal>
          )}

          <Modal
            isOpen={contribModal}
            onClose={() => setContribModal(false)}
            title="Log Project Contribution"
          >
            <form onSubmit={handleAddContribution} className="flex flex-col gap-4 text-left">
              <Input
                label="Contribution Title"
                id="contribTitle"
                value={contribTitle}
                onChange={(e) => setContribTitle(e.target.value)}
                placeholder="E.g. Implemented OAuth router"
                required
              />

              <div className="flex flex-col gap-1.5">
                <label htmlFor="contribDesc" className="text-sm font-medium text-gray-300">
                  Description
                </label>
                <textarea
                  id="contribDesc"
                  value={contribDesc}
                  onChange={(e) => setContribDesc(e.target.value)}
                  placeholder="Details of the work completed..."
                  rows={2}
                  className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="contribType" className="text-sm font-medium text-gray-300">
                    Contribution Type
                  </label>
                  <select
                    id="contribType"
                    value={contribType}
                    onChange={(e) => setContribType(e.target.value)}
                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-white"
                  >
                    <option value="code">Code Development</option>
                    <option value="documentation">Documentation</option>
                    <option value="task">Task Accomplishment</option>
                    <option value="meeting">Meeting Participation</option>
                    <option value="review">Peer Review</option>
                    <option value="manual">Manual Work</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="contribImpact" className="text-sm font-medium text-gray-300">
                    Impact Weight (1 to 10)
                  </label>
                  <input
                    id="contribImpact"
                    type="number"
                    min={1}
                    max={10}
                    value={contribImpact}
                    onChange={(e) => setContribImpact(e.target.value)}
                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-gray-800 pt-4">
                <Button variant="outline" onClick={() => setContribModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Record Contribution
                </Button>
              </div>
            </form>
          </Modal>
        </main>
        {selectedGithubCommit && (
          <Modal
            isOpen={!!selectedGithubCommit}
            onClose={() => setSelectedGithubCommit(null)}
            title="GitHub Commit Inspector"
          >
            <div className="text-left space-y-4">
              {selectedGithubCommit.isMock && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2 mb-4">
                  <ShieldAlert size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">Simulated Data</span>
                    <p className="text-xs text-gray-400">This is simulated GitHub activity generated for demonstration purposes. The link to GitHub is intentionally disabled.</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-950 rounded-lg p-3 border border-gray-800">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Commit SHA</span>
                  <span className="text-sm font-mono text-gray-300">{selectedGithubCommit.hash}</span>
                </div>
                <div className="bg-gray-950 rounded-lg p-3 border border-gray-800">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Impact Score</span>
                  <span className="text-sm font-bold text-emerald-400">+{selectedGithubCommit.impactScore}</span>
                </div>
              </div>

              <div className="bg-gray-950 rounded-lg p-3 border border-gray-800">
                <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Repository</span>
                <span className="text-sm font-mono text-gray-300 truncate block">
                  {project?.repoUrl || 'Unknown Repository'}
                </span>
              </div>

              <div className="bg-gray-950 rounded-lg p-3 border border-gray-800">
                <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Commit Message</span>
                <p className="text-xs text-gray-400 whitespace-pre-wrap leading-relaxed">
                  {selectedGithubCommit.description}
                </p>
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-800">
                <span className="text-xs text-gray-500">
                  Imported on {new Date(selectedGithubCommit.createdAt).toLocaleString()}
                </span>
                
                {selectedGithubCommit.externalUrl && !selectedGithubCommit.isMock ? (
                  <a 
                    href={selectedGithubCommit.externalUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <ExternalLink size={14} />
                    Open on GitHub
                  </a>
                ) : (
                  <button 
                    disabled
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-500 text-xs font-semibold rounded-lg cursor-not-allowed opacity-60"
                  >
                    <ExternalLink size={14} />
                    Open on GitHub
                  </button>
                )}
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
