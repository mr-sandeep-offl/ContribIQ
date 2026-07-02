import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { 
  getProjectById, 
  updateProject, 
  deleteProject, 
  addMember, 
  removeMember 
} from '../api/projectApi';
import { 
  createTask, 
  getTasksByProject, 
  updateTask, 
  deleteTask 
} from '../api/taskApi';
import { 
  addContribution, 
  getContributionsByProject, 
  getContributionsSummary 
} from '../api/contributionApi';
import { getProjectAnalytics } from '../api/analyticsApi';
import { generateAISummary } from '../api/aiApi';
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
  Layers
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

  // Navigation tabs
  const [activeTab, setActiveTab] = useState('overview');

  // Core project state
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Project update state
  const [editProjectModal, setEditProjectModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('college');
  const [editDeadline, setEditDeadline] = useState('');
  const [editRepoUrl, setEditRepoUrl] = useState('');
  const [editStatus, setEditStatus] = useState('planning');

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [taskModal, setTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [taskStatus, setTaskStatus] = useState('todo');

  // Contributions state
  const [contributions, setContributions] = useState([]);
  const [contribModal, setContribModal] = useState(false);
  const [contribTitle, setContribTitle] = useState('');
  const [contribDesc, setContribDesc] = useState('');
  const [contribType, setContribType] = useState('code');
  const [contribImpact, setContribImpact] = useState(5);

  // Members state
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // AI Summary State
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // GitHub State
  const [gitStatus, setGitStatus] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  // Helper flags
  const isOwner = project && project.createdBy?._id === user?._id;

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const data = await getProjectById(id);
      setProject(data);
      
      // Seed update forms
      setEditTitle(data.title);
      setEditDescription(data.description || '');
      setEditCategory(data.category);
      setEditDeadline(data.deadline ? data.deadline.substring(0, 10) : '');
      setEditRepoUrl(data.repoUrl || '');
      setEditStatus(data.status);

      // Fetch Tasks and Contributions
      const [taskList, contribList] = await Promise.all([
        getTasksByProject(id),
        getContributionsByProject(id)
      ]);
      setTasks(taskList);
      setContributions(contribList);

      // Fetch GitHub and Analytics
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

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  // Project actions
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
      setSuccess('Project updated successfully.');
      setEditProjectModal(false);
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

  // Task actions
  const handleCreateOrUpdateTask = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingTask) {
        // Update
        await updateTask(editingTask._id, {
          title: taskTitle,
          description: taskDesc,
          assignedTo: taskAssignee || undefined,
          priority: taskPriority,
          deadline: taskDeadline,
          status: taskStatus,
        });
      } else {
        // Create
        await createTask(id, {
          title: taskTitle,
          description: taskDesc,
          assignedTo: taskAssignee || undefined,
          priority: taskPriority,
          deadline: taskDeadline,
        });
      }

      // Reset Form
      setTaskTitle('');
      setTaskDesc('');
      setTaskAssignee('');
      setTaskPriority('medium');
      setTaskDeadline('');
      setEditingTask(null);
      setTaskModal(false);

      // Refresh
      const list = await getTasksByProject(id);
      setTasks(list);
      fetchAnalytics();
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
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task.');
    }
  };

  // Contribution actions
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

      // Refresh
      const list = await getContributionsByProject(id);
      setContributions(list);
      fetchAnalytics();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log contribution.');
    }
  };

  // Member actions
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
      setSuccess('Member added successfully.');
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
      setSuccess('Member removed successfully.');
      fetchProjectData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  // AI Summary action
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

  // GitHub import action
  const handleMockImport = async () => {
    try {
      setImportLoading(true);
      setError('');
      await importMockContributions(id);
      setSuccess('Successfully imported mock commits from GitHub!');
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

  // Set colors for chart cells
  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="flex flex-1 animate-fadeIn">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full text-left">
          {/* Header */}
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
            {isOwner && (
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setEditProjectModal(true)} className="flex items-center gap-1.5">
                  <Settings size={15} />
                  Configure Settings
                </Button>
                <Button variant="danger" onClick={handleDeleteProject} className="flex items-center gap-1.5">
                  <Trash2 size={15} />
                  Delete Project
                </Button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-455 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-450 text-sm">
              {success}
            </div>
          )}

          {/* Top Tabs */}
          <div className="flex border-b border-gray-800 gap-6 mb-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: Layout },
              { id: 'tasks', label: 'Tasks', icon: ListTodo },
              { id: 'contributions', label: 'Contributions', icon: History },
              { id: 'members', label: 'Members', icon: Users },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'ai-summary', label: 'AI Summary', icon: BrainCircuit },
              { id: 'github', label: 'GitHub Import', icon: Github },
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
                  className={`flex items-center gap-2 pb-3.5 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-gray-400 hover:text-gray-250'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT */}

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-xl border border-gray-850 bg-gray-900/40 p-6">
                  <h3 className="text-base font-semibold text-white mb-4">Project Parameters</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <span className="text-xs text-gray-500 font-semibold block uppercase">Sprint Category</span>
                      <span className="text-sm font-medium text-gray-200 mt-1 block capitalize">{project.category}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-semibold block uppercase">Delivery Deadline</span>
                      <span className="text-sm font-medium text-gray-200 mt-1 block">{formatDate(project.deadline)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-semibold block uppercase">GitHub Connection</span>
                      <span className="text-sm font-medium text-gray-200 mt-1 block text-indigo-400 truncate hover:underline">
                        {project.repoUrl ? (
                          <a href={project.repoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1">
                            <Github size={14} />
                            Repository Link
                          </a>
                        ) : (
                          'Not Connected'
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-semibold block uppercase">Created By</span>
                      <span className="text-sm font-medium text-gray-200 mt-1 block">{project.createdBy?.name} ({project.createdBy?.email})</span>
                    </div>
                  </div>
                </div>

                {/* Dashboard summary components */}
                {analytics && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="rounded-xl border border-gray-850 bg-gray-900 p-5 flex flex-col justify-between">
                      <span className="text-xs text-gray-500 font-semibold uppercase">Sprint Health</span>
                      <span className="text-2xl font-bold mt-2 text-white block">{analytics.healthScore}%</span>
                    </div>
                    <div className="rounded-xl border border-gray-850 bg-gray-900 p-5 flex flex-col justify-between">
                      <span className="text-xs text-gray-500 font-semibold uppercase">Progress</span>
                      <span className="text-2xl font-bold mt-2 text-white block">{analytics.projectProgressPercentage}%</span>
                    </div>
                    <div className="rounded-xl border border-gray-850 bg-gray-900 p-5 flex flex-col justify-between">
                      <span className="text-xs text-gray-500 font-semibold uppercase">Risk Rating</span>
                      <span className={`text-2xl font-bold mt-2 capitalize block ${
                        analytics.deadlineRisk === 'high' ? 'text-rose-400' : analytics.deadlineRisk === 'medium' ? 'text-amber-400' : 'text-emerald-450'
                      }`}>{analytics.deadlineRisk}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Members right card */}
              <div className="rounded-xl border border-gray-850 bg-gray-900/40 p-6 h-fit">
                <h3 className="text-base font-semibold text-white mb-4">Sprint Contributors</h3>
                <div className="space-y-4">
                  {project.members.map((member) => (
                    <div key={member.user._id} className="flex items-center justify-between border-b border-gray-850 pb-2.5">
                      <div>
                        <span className="text-sm font-semibold text-gray-200 block">{member.user.name}</span>
                        <span className="text-xs text-gray-500 mt-1 block capitalize leading-none">{member.projectRole}</span>
                      </div>
                      {member.user.githubUsername && (
                        <a 
                          href={`https://github.com/${member.user.githubUsername}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-gray-400 hover:text-indigo-400 transition-colors"
                        >
                          <Github size={15} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === 'tasks' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Sprint Tasks ({tasks.length})</h3>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    setEditingTask(null);
                    setTaskTitle('');
                    setTaskDesc('');
                    setTaskAssignee('');
                    setTaskPriority('medium');
                    setTaskDeadline('');
                    setTaskModal(true);
                  }}
                  className="flex items-center gap-1"
                >
                  <Plus size={16} />
                  Add Task
                </Button>
              </div>

              {tasks.length === 0 ? (
                <EmptyState
                  title="No tasks logged"
                  description="Begin building out your sprint workflow by creating task items."
                  actionText="Add Task"
                  onAction={() => setTaskModal(true)}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {/* CONTRIBUTIONS TAB */}
          {activeTab === 'contributions' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Contribution History ({contributions.length})</h3>
                <Button 
                  variant="primary" 
                  onClick={() => setContribModal(true)}
                  className="flex items-center gap-1"
                >
                  <Plus size={16} />
                  Log Contribution
                </Button>
              </div>

              {contributions.length === 0 ? (
                <EmptyState
                  title="No contributions logged"
                  description="Record manual contributions (like meetings or reviews) or pull them from GitHub."
                  actionText="Log Contribution"
                  onAction={() => setContribModal(true)}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {contributions.map((c) => (
                    <ContributionCard key={c._id} contribution={c} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MEMBERS TAB */}
          {activeTab === 'members' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Member List */}
              <div className="lg:col-span-2 rounded-xl border border-gray-850 bg-gray-900/40 p-6 text-left">
                <h3 className="text-base font-semibold text-white mb-6">Active Project Members</h3>
                <div className="space-y-4">
                  {project.members.map((member) => (
                    <div key={member.user._id} className="flex items-center justify-between border-b border-gray-850 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-200">{member.user.name}</span>
                          <Badge variant="secondary" className="capitalize">{member.projectRole}</Badge>
                        </div>
                        <span className="text-xs text-gray-500 mt-1 block">{member.user.email}</span>
                      </div>
                      
                      {isOwner && member.user._id !== user._id && (
                        <Button 
                          variant="ghost" 
                          onClick={() => handleRemoveMember(member.user._id)}
                          className="text-gray-500 hover:text-rose-500"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Member panel */}
              {isOwner && (
                <div className="rounded-xl border border-gray-850 bg-gray-900 p-6 h-fit text-left">
                  <h3 className="text-base font-semibold text-white mb-4">Invite Member</h3>
                  <form onSubmit={handleAddMember} className="flex flex-col gap-4">
                    <Input
                      label="User Email"
                      id="memberEmail"
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="teammate@college.edu"
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
                        className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1"
                      >
                        <option value="member">Member</option>
                        <option value="reviewer">Reviewer</option>
                      </select>
                    </div>

                    <Button type="submit" variant="primary" className="mt-2 py-2">
                      Add to Project
                    </Button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div>
              {analyticsLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                </div>
              ) : !analytics ? (
                <EmptyState
                  title="Analytics not available"
                  description="Log tasks or contributions to populate project metrics."
                />
              ) : (
                <div className="space-y-8">
                  {/* Summary Metric cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="rounded-xl border border-gray-850 bg-gray-900 p-6">
                      <span className="text-xs font-semibold text-gray-500 block uppercase">Project Progress</span>
                      <span className="text-3xl font-extrabold text-white mt-2 block">{analytics.projectProgressPercentage}%</span>
                      <span className="text-xs text-gray-500 mt-2 block">{analytics.completedTasks} / {analytics.totalTasks} Tasks Completed</span>
                    </div>

                    <div className="rounded-xl border border-gray-850 bg-gray-900 p-6">
                      <span className="text-xs font-semibold text-gray-500 block uppercase">Team Health Score</span>
                      <span className="text-3xl font-extrabold text-indigo-400 mt-2 block">{analytics.healthScore}/100</span>
                      <span className="text-xs text-gray-500 mt-2 block">Deducted for overdue/inactive members</span>
                    </div>

                    <div className="rounded-xl border border-gray-850 bg-gray-900 p-6">
                      <span className="text-xs font-semibold text-gray-500 block uppercase">Overdue Tasks</span>
                      <span className="text-3xl font-extrabold text-rose-500 mt-2 block">{analytics.overdueTasks}</span>
                      <span className="text-xs text-gray-500 mt-2 block">Pending past deadline</span>
                    </div>

                    <div className="rounded-xl border border-gray-850 bg-gray-900 p-6">
                      <span className="text-xs font-semibold text-gray-500 block uppercase">Deadline Risk</span>
                      <Badge variant={analytics.deadlineRisk === 'high' ? 'danger' : analytics.deadlineRisk === 'medium' ? 'warning' : 'success'} className="mt-3 text-xs px-2.5 py-1">
                        {analytics.deadlineRisk} Risk
                      </Badge>
                    </div>
                  </div>

                  {/* Charts row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Task Share Bar Chart */}
                    <div className="rounded-xl border border-gray-850 bg-gray-900/40 p-6">
                      <h3 className="text-base font-semibold text-white mb-6">Task Telemetry</h3>
                      <div className="h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: 'Total', count: analytics.totalTasks },
                              { name: 'Completed', count: analytics.completedTasks },
                              { name: 'Pending', count: analytics.pendingTasks },
                              { name: 'Overdue', count: analytics.overdueTasks }
                            ]}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', color: '#fff' }} />
                            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Contribution Share Pie Chart */}
                    <div className="rounded-xl border border-gray-850 bg-gray-900/40 p-6">
                      <h3 className="text-base font-semibold text-white mb-6">Workload Balance (Impact Share)</h3>
                      {analytics.memberContributionPercentages.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-sm text-gray-500">
                          No contributions logged to divide workload share.
                        </div>
                      ) : (
                        <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-6">
                          <div className="w-1/2 h-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={analytics.memberContributionPercentages}
                                  dataKey="contributionPercentage"
                                  nameKey="user.name"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  fill="#8884d8"
                                >
                                  {analytics.memberContributionPercentages.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', color: '#fff' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div className="w-1/2 flex flex-col text-left gap-1">
                            {analytics.memberContributionPercentages.map((contrib, idx) => (
                              <div key={contrib.user._id} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                <span className="text-xs text-gray-300 truncate max-w-[70%]">{contrib.user.name}</span>
                                <span className="text-xs font-bold text-white shrink-0 ml-auto">{contrib.contributionPercentage}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inactive Members list */}
                  <div className="rounded-xl border border-gray-850 bg-gray-900/40 p-6 text-left">
                    <h3 className="text-base font-semibold text-white mb-4">Inactivity Alert (No Contributions/Tasks in last 5 days)</h3>
                    {analytics.inactiveMembers.length === 0 ? (
                      <p className="text-sm text-gray-400">All sprint members are active!</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {analytics.inactiveMembers.map((member) => (
                          <div key={member._id} className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 flex flex-col justify-between">
                            <span className="text-sm font-semibold text-white">{member.name}</span>
                            <span className="text-xs text-rose-400 mt-2 font-medium">Inactive for 5+ Days</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI SUMMARY TAB */}
          {activeTab === 'ai-summary' && (
            <div className="max-w-3xl mx-auto text-left space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Project Intelligence Summary</h3>
                  <p className="text-sm text-gray-400">Synthesize telemetry into text reports and recommendation cards.</p>
                </div>
                <Button 
                  variant="primary" 
                  onClick={handleGenerateAISummary}
                  loading={aiLoading}
                  className="flex items-center gap-1.5"
                >
                  <BrainCircuit size={16} />
                  Generate AI Report
                </Button>
              </div>

              {aiSummary ? (
                <div className="space-y-6">
                  {/* Summary Card */}
                  <div className="rounded-2xl border border-gray-850 bg-gray-900 p-8 shadow-xl">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="text-indigo-400" size={20} />
                        <span className="font-bold text-white text-sm">SyncScore Telemetry Summary</span>
                      </div>
                      <span className="text-xs text-gray-500">Generated on {formatDate(aiSummary.generatedAt)}</span>
                    </div>

                    <p className="text-base text-gray-100 font-medium leading-relaxed italic">
                      "{aiSummary.summary}"
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-800 p-12 text-center bg-gray-900/10">
                  <div className="rounded-full bg-indigo-500/10 p-4 text-indigo-400 mb-4">
                    <BrainCircuit size={32} />
                  </div>
                  <h4 className="text-base font-semibold text-white mb-2">No summary generated yet</h4>
                  <p className="text-sm text-gray-400 max-w-sm mb-6">Click the button above to parse sprint data and generate a text telemetry report.</p>
                  <Button variant="primary" onClick={handleGenerateAISummary} loading={aiLoading}>
                    Generate AI Report
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* GITHUB IMPORT TAB */}
          {activeTab === 'github' && (
            <div className="max-w-2xl mx-auto text-left">
              <h3 className="text-lg font-semibold text-white mb-2">GitHub Telemetry Connector</h3>
              <p className="text-sm text-gray-400 mb-6">Import commit activity logs directly into contribution statistics.</p>

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
                      <span className="text-xs text-gray-500 block font-semibold uppercase">Last Commit Synchronized</span>
                      <span className="text-sm font-medium text-white block mt-2">
                        {gitStatus.lastImportedAt ? formatDate(gitStatus.lastImportedAt) : 'Never'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-800 pt-6">
                    <span className="text-xs text-gray-500 block font-semibold uppercase">Linked Repository</span>
                    <span className="text-sm text-gray-300 font-mono block mt-2 truncate bg-gray-950 p-3 rounded-lg border border-gray-850">
                      {gitStatus.repoUrl || 'No repository URL configured.'}
                    </span>
                  </div>

                  {gitStatus.connected ? (
                    <Button 
                      variant="primary" 
                      onClick={handleMockImport}
                      loading={importLoading}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5"
                    >
                      <Github size={18} />
                      Mock Synchronize Commits
                    </Button>
                  ) : (
                    <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-rose-500/10 border border-rose-500/25">
                      <p className="text-xs text-rose-400">Please click "Configure Settings" above and set a Repository URL to connect your project workspace with GitHub.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Edit Project Modal */}
          <Modal
            isOpen={editProjectModal}
            onClose={() => setEditProjectModal(false)}
            title="Configure Project Settings"
          >
            <form onSubmit={handleUpdateProject} className="flex flex-col gap-4 text-left">
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

              <div className="flex justify-end gap-3 mt-4 border-t border-gray-800 pt-4">
                <Button variant="outline" onClick={() => setEditProjectModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Changes
                </Button>
              </div>
            </form>
          </Modal>

          {/* Create/Edit Task Modal */}
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
                placeholder="E.g., Design database schema"
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

          {/* Add Contribution Modal */}
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
                placeholder="E.g., Added OAuth helper classes"
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
                  placeholder="Details of contribution made..."
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
                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
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
      </div>
    </div>
  );
};

export default ProjectDetails;
