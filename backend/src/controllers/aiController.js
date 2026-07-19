const Project = require('../models/Project');
const Task = require('../models/Task');
const Contribution = require('../models/Contribution');
const ChatHistory = require('../models/ChatHistory');
const User = require('../models/User');
const calculateProjectAnalytics = require('../utils/calculateAnalytics');
const groqService = require('../services/groqService');
const fallbackService = require('../services/fallbackService');
const { processAIQuery, generateDailySummaryText, generateSprintPlanAssignments } = require('../services/aiService');
const { generateProjectReportPDF } = require('../services/pdfService');

/**
 * @desc    Get AI Chat assistant response (with project/workspace awareness)
 * @route   POST /api/ai/chat
 * @access  Private
 */
const getAIChatResponse = async (req, res, next) => {
  try {
    const { message, projectId, history } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required.',
      });
    }

    let projectContext = '';
    let isSingleProject = false;

    if (projectId) {
      // 1. Fetch single project and check authorization
      const project = await Project.findById(projectId).populate('members.user', 'name email role githubUsername');
      if (!project) {
        res.status(404);
        return next(new Error('Project not found'));
      }

      // Verify the logged-in user is a member
      const isMember = project.members.some(
        (m) => m.user._id.toString() === req.user._id.toString()
      );
      if (!isMember) {
        res.status(403);
        return next(new Error('Not authorized to access this project'));
      }

      isSingleProject = true;

      // Fetch related tasks and contributions for analytics and context
      const [tasks, contributions] = await Promise.all([
        Task.find({ projectId }).populate('assignedTo', 'name email'),
        Contribution.find({ projectId }),
      ]);

      // Calculate analytics
      const analytics = calculateProjectAnalytics(project, tasks, contributions);

      // Build a compact single-project context (excluding sensitive fields)
      projectContext = `Project: ${project.title}
- Status: ${project.status}
- Category: ${project.category}
- Deadline: ${project.deadline ? new Date(project.deadline).toLocaleDateString() : 'None'}
- Repository URL: ${project.repoUrl || 'None'}
- Sprint Health: ${analytics.healthScore}%
- Progress: ${analytics.projectProgressPercentage}%
- Deadline Risk: ${analytics.deadlineRisk}
- Tasks count: Total ${analytics.totalTasks}, Completed ${analytics.completedTasks}, Pending ${analytics.pendingTasks}, Overdue ${analytics.overdueTasks}
`;

      // Add a clean list of tasks (excluding MongoDB IDs)
      if (tasks.length > 0) {
        projectContext += `\nTasks List:\n`;
        tasks.slice(0, 15).forEach((t) => {
          const dueStr = t.deadline ? new Date(t.deadline).toLocaleDateString() : 'No date';
          const isOverdue = t.status !== 'completed' && new Date(t.deadline) < new Date();
          projectContext += `- Task [${t.status}] "${t.title}" (Priority: ${t.priority}, Due: ${dueStr}${isOverdue ? ' - OVERDUE' : ''}) assigned to ${t.assignedTo?.name || 'Unassigned'}\n`;
        });
      }

      // Add members info
      if (project.members.length > 0) {
        projectContext += `\nMembers List:\n`;
        project.members.forEach((m) => {
          projectContext += `- Member: ${m.user.name} (${m.projectRole || 'member'})${m.user.githubUsername ? ` github: ${m.user.githubUsername}` : ''}\n`;
        });
      }

      // Add contributions summary
      if (analytics.memberContributionPercentages && analytics.memberContributionPercentages.length > 0) {
        projectContext += `\nContribution percentages:\n`;
        analytics.memberContributionPercentages.forEach((m) => {
          projectContext += `- Contributor: ${m.user.name} (${m.contributionPercentage}% of total score)\n`;
        });
      }

      // Add recent commits/activity
      const recentContribs = contributions.filter(c => c.source === 'github').slice(0, 10);
      if (recentContribs.length > 0) {
        projectContext += `\nRecent GitHub commits/activity:\n`;
        recentContribs.forEach((c) => {
          projectContext += `- GitHub Contributor: ${c.title} (Impact: ${c.impactScore})\n`;
        });
      }

    } else {
      // 2. Workspace-wide context for the logged-in user
      const projects = await Project.find({
        'members.user': req.user._id,
      });

      const projectIds = projects.map((p) => p._id);
      
      const [tasks, contributions] = await Promise.all([
        Task.find({ projectId: { $in: projectIds } }),
        Contribution.find({ projectId: { $in: projectIds } }),
      ]);

      const totalProjects = projects.length;
      const activeProjects = projects.filter((p) => p.status === 'active').length;
      
      // Calculate workspace-wide counts
      const totalTasksCount = tasks.length;
      const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
      const pendingTasksCount = tasks.filter((t) => t.status !== 'completed').length;
      
      const now = new Date();
      const overdueTasksCount = tasks.filter(
        (t) => t.status !== 'completed' && new Date(t.deadline) < now
      ).length;

      // Group health scores
      let healthSum = 0;
      let highRiskCount = 0;

      projects.forEach((p) => {
        const pTasks = tasks.filter((t) => t.projectId.toString() === p._id.toString());
        const pContribs = contributions.filter((c) => c.projectId.toString() === p._id.toString());
        const pAnalytics = calculateProjectAnalytics(p, pTasks, pContribs);
        healthSum += pAnalytics.healthScore;
        if (pAnalytics.deadlineRisk === 'high') {
          highRiskCount++;
        }
      });

      const avgHealthScore = totalProjects > 0 ? Math.round(healthSum / totalProjects) : 100;

      projectContext = `Workspace Summary for User ${req.user.name}:
- Total Projects: ${totalProjects}
- Active Projects: ${activeProjects}
- Total Tasks: ${totalTasksCount}
- Completed Tasks: ${completedTasksCount}
- Pending Tasks: ${pendingTasksCount}
- Overdue Tasks: ${overdueTasksCount}
- Average Health Score: ${avgHealthScore}%
- High Risk Projects: ${highRiskCount}
`;

      if (projects.length > 0) {
        projectContext += `\nProjects List:\n`;
        projects.slice(0, 10).forEach((p) => {
          projectContext += `- Project: "${p.title}" (Status: ${p.status}, Category: ${p.category})\n`;
        });
      }

      if (contributions.length > 0) {
        projectContext += `\nRecent logged contributions in workspace:\n`;
        contributions.slice(0, 8).forEach((c) => {
          projectContext += `- Contribution: "${c.title}" (Type: ${c.type}, Impact: ${c.impactScore})\n`;
        });
      }
    }

    // Try calling Groq API
    try {
      if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not configured');
      }

      const reply = await groqService.generateGroqResponse({
        message,
        history,
        projectContext,
      });

      return res.json({
        success: true,
        reply,
        provider: 'groq',
      });
    } catch (groqError) {
      console.warn('Groq failed or key missing. Falling back to rule-based response. Error:', groqError.message || groqError);
      
      const reply = fallbackService.getRuleBasedResponse({
        message,
        projectContext,
        isSingleProject,
      });

      return res.json({
        success: true,
        reply,
        provider: 'rule-based',
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get chat history for a project
// @route   GET /api/ai/:projectId/chat
// @access  Private
const getChatHistory = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const history = await ChatHistory.find({ projectId })
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(history);
  } catch (error) {
    next(error);
  }
};

// @desc    Ask AI Workspace Assistant (Global - works across all user projects)
// @route   POST /api/ai/chat
// @access  Private
const globalChatHandler = async (req, res, next) => {
  try {
    const { message, projectId } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      res.status(400);
      return next(new Error('Message cannot be empty'));
    }

    const trimmedMessage = message.trim();

    if (projectId) {
      const project = await Project.findById(projectId).populate('members.user', 'name email role');
      if (!project) {
        res.status(404);
        return next(new Error('Project not found'));
      }
      const isMember = project.members.some(m => m.user._id.toString() === req.user._id.toString());
      if (!isMember) {
        res.status(403);
        return next(new Error('Not authorized to access AI for this project'));
      }
      const tasks = await Task.find({ projectId });
      const contributions = await Contribution.find({ projectId });
      const analytics = calculateProjectAnalytics(project, tasks, contributions);
      const reply = await processAIQuery(projectId, req.user._id, trimmedMessage, project, tasks, contributions, analytics);
      return res.json({ success: true, reply });
    }

    const userProjects = await Project.find({
      'members.user': req.user._id,
    }).populate('members.user', 'name email role');

    if (userProjects.length === 0) {
      return res.json({
        success: true,
        reply: `Hi ${req.user.name}! Welcome to SyncScore AI.\n\nYou don't have any projects yet. Once you create or join a project, I can help you with:\n- Project status and health\n- Pending and overdue tasks\n- Contributor rankings\n- Deadline risk analysis\n- Sprint recommendations\n\nGet started by creating your first project!`,
      });
    }

    const projectIds = userProjects.map(p => p._id);
    const [allTasks, allContributions] = await Promise.all([
      Task.find({ projectId: { $in: projectIds } }),
      Contribution.find({ projectId: { $in: projectIds } }),
    ]);

    const projectSummaries = userProjects.map(project => {
      const projectTasks = allTasks.filter(t => t.projectId.toString() === project._id.toString());
      const projectContributions = allContributions.filter(c => c.projectId.toString() === project._id.toString());
      const analytics = calculateProjectAnalytics(project, projectTasks, projectContributions);
      return { project, tasks: projectTasks, contributions: projectContributions, analytics };
    });

    const reply = generateGlobalWorkspaceReply(trimmedMessage, req.user, projectSummaries, allTasks, allContributions);
    return res.json({ success: true, reply });

  } catch (error) {
    next(error);
  }
};

// @desc    Ask AI Project Assistant
// @route   POST /api/ai/:projectId/chat
// @access  Private
const askAssistant = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === '') {
      res.status(400);
      return next(new Error('Query message cannot be empty'));
    }

    const project = await Project.findById(projectId).populate('members.user', 'name email role');
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    const isMember = project.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) {
      res.status(403);
      return next(new Error('Not authorized to access AI for this project'));
    }

    const tasks = await Task.find({ projectId });
    const contributions = await Contribution.find({ projectId });
    const analytics = calculateProjectAnalytics(project, tasks, contributions);

    const userMessage = await ChatHistory.create({
      projectId,
      userId: req.user._id,
      sender: 'user',
      text: message,
    });

    const responseText = await processAIQuery(projectId, req.user._id, message, project, tasks, contributions, analytics);

    const aiMessage = await ChatHistory.create({
      projectId,
      userId: req.user._id,
      sender: 'ai',
      text: responseText,
    });

    res.json({
      userMessage,
      aiMessage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get automated AI daily summary card metrics
// @route   GET /api/ai/:projectId/summary
// @access  Private
const getDailySummary = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).populate('members.user', 'name email role');
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    const tasks = await Task.find({ projectId });
    const contributions = await Contribution.find({ projectId });
    const analytics = calculateProjectAnalytics(project, tasks, contributions);

    const summary = generateDailySummaryText(project, tasks, contributions, analytics);
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

// @desc    Generate sprint recommendations plan
// @route   POST /api/ai/:projectId/sprint-plan
// @access  Private
const getSprintPlan = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).populate('members.user', 'name email role');
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    const tasks = await Task.find({ projectId });
    const contributions = await Contribution.find({ projectId });
    const analytics = calculateProjectAnalytics(project, tasks, contributions);

    const sprintPlan = generateSprintPlanAssignments(project, tasks, contributions, analytics);
    res.json(sprintPlan);
  } catch (error) {
    next(error);
  }
};

// @desc    Export sprint intelligence data report
// @route   GET /api/ai/:projectId/export
// @access  Private
const exportReport = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { reportType = 'Sprint', format = 'pdf' } = req.query;

    const project = await Project.findById(projectId).populate('members.user', 'name email role');
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    const tasks = await Task.find({ projectId });
    const contributions = await Contribution.find({ projectId });
    const analytics = calculateProjectAnalytics(project, tasks, contributions);

    if (format.toLowerCase() === 'pdf') {
      const pdfBuffer = await generateProjectReportPDF(project, tasks, contributions, analytics, reportType);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=SyncScore_Report_${reportType}.pdf`);
      return res.send(pdfBuffer);
    } 
    
    let csv = `SyncScore AI - Intelligence Report (${reportType} Assessment)\n`;
    csv += `Project Title,${project.title}\n`;
    csv += `Deadline,${project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}\n`;
    csv += `Sprint Status,${project.status || 'Active'}\n`;
    csv += `Health Score,${analytics.healthScore}/100\n`;
    csv += `Progress,${analytics.projectProgressPercentage}%\n`;
    csv += `Overdue Tasks,${analytics.overdueTasks}\n`;
    csv += `Deadline Risk,${analytics.deadlineRisk.toUpperCase()}\n`;
    csv += `\nTeam Workloads & Contributions\n`;
    csv += `Name,Role,Contribution Score,Productivity Score,Consistency Rating,Quality Rating,Total Tasks,Completed Tasks,Burnout Risk\n`;
    
    analytics.memberWorkload.forEach(m => {
      csv += `"${m.user.name}","${m.projectRole}",${m.contributionScore},${m.productivity},"${m.consistency}%","${m.quality}%",${m.totalTasks},${m.completedTasks},${m.burnoutRisk ? 'YES' : 'NO'}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=SyncScore_Report_${reportType}.csv`);
    return res.send(csv);
  } catch (error) {
    next(error);
  }
};

// ── Global workspace AI reasoner (rule-based, no API key needed) ──
const generateGlobalWorkspaceReply = (query, user, projectSummaries, allTasks, allContributions) => {
  const q = query.toLowerCase();
  const now = new Date();
  const totalProjects = projectSummaries.length;

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === 'completed').length;
  const pendingTasks = allTasks.filter(t => t.status !== 'completed').length;
  const overdueTasks = allTasks.filter(t => t.status !== 'completed' && t.deadline && new Date(t.deadline) < now).length;
  const avgHealth = Math.round(projectSummaries.reduce((sum, s) => sum + s.analytics.healthScore, 0) / totalProjects);

  if (q === 'hi' || q === 'hello' || q === 'hey' || q.startsWith('hi ') || q.startsWith('hello ')) {
    return `Hi ${user.name}! 👋 I'm your SyncScore AI Assistant.\n\nHere's a quick snapshot of your workspace:\n- Projects: ${totalProjects} active project${totalProjects !== 1 ? 's' : ''}\n- Tasks: ${completedTasks} completed, ${pendingTasks} pending\n- Overdue: ${overdueTasks} task${overdueTasks !== 1 ? 's' : ''}\n- Average Health Score: ${avgHealth}/100\n\nYou can ask me about project status, pending tasks, who's contributing the most, deadline risks, or what to do next!`;
  }

  if (q.includes('status') || q.includes('overview') || q.includes('how is') || q.includes('project condition')) {
    let reply = `Here is your workspace overview, ${user.name}:\n\n`;
    reply += `Total Projects: ${totalProjects}\n`;
    reply += `Total Tasks: ${totalTasks} (${completedTasks} completed, ${pendingTasks} pending)\n`;
    reply += `Overdue Tasks: ${overdueTasks}\n`;
    reply += `Average Workspace Health: ${avgHealth}/100\n\n`;

    projectSummaries.forEach(({ project, analytics }) => {
      const risk = analytics.deadlineRisk.toUpperCase();
      reply += `Project: ${project.title}\n`;
      reply += `  Status: ${project.status} | Health: ${analytics.healthScore}/100 | Progress: ${analytics.projectProgressPercentage}% | Deadline Risk: ${risk}\n`;
      reply += `  Tasks: ${analytics.completedTasks} done, ${analytics.pendingTasks} pending, ${analytics.overdueTasks} overdue\n\n`;
    });

    if (overdueTasks > 0) {
      reply += `Action needed: ${overdueTasks} overdue task${overdueTasks !== 1 ? 's' : ''} require immediate attention.`;
    } else {
      reply += `All tasks are on track. Keep up the momentum!`;
    }
    return reply;
  }

  if (q.includes('pending') || q.includes('todo') || q.includes('to do') || q.includes('remaining') || q.includes('not done')) {
    const pendingList = allTasks.filter(t => t.status !== 'completed');
    if (pendingList.length === 0) {
      return `Great news, ${user.name}! All tasks across your ${totalProjects} project${totalProjects !== 1 ? 's' : ''} are completed. Nothing is pending right now.`;
    }

    let reply = `You have ${pendingList.length} pending task${pendingList.length !== 1 ? 's' : ''} across your projects:\n\n`;

    projectSummaries.forEach(({ project, tasks }) => {
      const pending = tasks.filter(t => t.status !== 'completed');
      if (pending.length === 0) return;
      reply += `${project.title} (${pending.length} pending):\n`;
      pending.slice(0, 5).forEach(t => {
        const isOverdue = t.deadline && new Date(t.deadline) < now;
        const dueStr = t.deadline ? `Due: ${new Date(t.deadline).toLocaleDateString()}` : 'No deadline';
        reply += `  - ${t.title} [${t.priority.toUpperCase()}] ${dueStr}${isOverdue ? ' — OVERDUE' : ''}\n`;
      });
      if (pending.length > 5) reply += `  ... and ${pending.length - 5} more\n`;
      reply += '\n';
    });

    return reply.trim();
  }

  if (q.includes('completed') || q.includes('done') || q.includes('finished') || q.includes('accomplished')) {
    const completedList = allTasks.filter(t => t.status === 'completed');
    if (completedList.length === 0) {
      return `No tasks have been marked as completed yet in your workspace. Start completing tasks and I'll track your progress!`;
    }

    let reply = `${completedList.length} task${completedList.length !== 1 ? 's' : ''} completed across your projects:\n\n`;
    projectSummaries.forEach(({ project, analytics }) => {
      if (analytics.completedTasks === 0) return;
      const prog = analytics.projectProgressPercentage;
      reply += `${project.title}: ${analytics.completedTasks} completed (${prog}% of project done)\n`;
    });
    return reply.trim();
  }

  if (q.includes('delay') || q.includes('overdue') || q.includes('late') || q.includes('behind') || q.includes('risk')) {
    const overdueList = allTasks.filter(t => t.status !== 'completed' && t.deadline && new Date(t.deadline) < now);

    let reply = `Delay and risk analysis for your workspace:\n\n`;
    reply += `Overall Health Score: ${avgHealth}/100\n`;
    reply += `Overdue Tasks: ${overdueList.length}\n\n`;

    projectSummaries.forEach(({ project, analytics }) => {
      if (analytics.deadlineRisk === 'low' && analytics.overdueTasks === 0) return;
      reply += `Project: ${project.title}\n`;
      reply += `  Deadline Risk: ${analytics.deadlineRisk.toUpperCase()}\n`;
      reply += `  Explanation: ${analytics.deadlineRiskExplanation}\n`;
      if (analytics.overdueTasks > 0) reply += `  Overdue Tasks: ${analytics.overdueTasks}\n`;
      reply += `  Suggestions: ${analytics.deadlineRiskSuggestions.join('; ')}\n\n`;
    });

    if (overdueList.length === 0 && projectSummaries.every(s => s.analytics.deadlineRisk === 'low')) {
      return `Good news! No projects have high deadline risk and there are no overdue tasks. Your workspace is healthy with an average health score of ${avgHealth}/100.`;
    }

    return reply.trim();
  }

  if (q.includes('contribut') || q.includes('leaderboard') || q.includes('most active') || q.includes('top performer') || q.includes('who contributed') || q.includes('who is working')) {
    const globalScores = {};
    projectSummaries.forEach(({ analytics }) => {
      analytics.memberWorkload.forEach(m => {
        const name = m.user.name;
        if (!globalScores[name]) {
          globalScores[name] = { name, score: 0, tasks: 0, completed: 0 };
        }
        globalScores[name].score += m.contributionScore;
        globalScores[name].tasks += m.totalTasks;
        globalScores[name].completed += m.completedTasks;
      });
    });

    const ranked = Object.values(globalScores).sort((a, b) => b.score - a.score);
    if (ranked.length === 0) {
      return `No contribution data is available yet. Once team members log their work, I can show you the leaderboard.`;
    }

    let reply = `Contributor leaderboard across all your projects:\n\n`;
    ranked.forEach((c, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      reply += `${medal} ${c.name} — Score: ${c.score} pts | ${c.completed}/${c.tasks} tasks completed\n`;
    });
    reply += `\nTop contributor: ${ranked[0].name} with ${ranked[0].score} contribution points.`;
    return reply;
  }

  if (q.includes('next') || q.includes('recommend') || q.includes('suggest') || q.includes('what should') || q.includes('what to do') || q.includes('priority') || q.includes('action')) {
    let reply = `Here are your recommended next actions, ${user.name}:\n\n`;

    const overdueList = allTasks.filter(t => t.status !== 'completed' && t.deadline && new Date(t.deadline) < now);
    if (overdueList.length > 0) {
      reply += `1. Clear ${overdueList.length} overdue task${overdueList.length !== 1 ? 's' : ''} immediately — these are blocking your project health.\n`;
    }

    const highRisk = projectSummaries.filter(s => s.analytics.deadlineRisk === 'high');
    if (highRisk.length > 0) {
      reply += `${overdueList.length > 0 ? '2' : '1'}. Focus on high-risk project${highRisk.length !== 1 ? 's' : ''}: ${highRisk.map(s => s.project.title).join(', ')}.\n`;
    }

    const criticalPending = allTasks.filter(t => t.status !== 'completed' && t.priority === 'critical');
    if (criticalPending.length > 0) {
      reply += `- Address ${criticalPending.length} critical priority pending task${criticalPending.length !== 1 ? 's' : ''}.\n`;
    }

    const burnoutMembers = new Set();
    projectSummaries.forEach(({ analytics }) => {
      analytics.memberWorkload.filter(m => m.burnoutRisk).forEach(m => burnoutMembers.add(m.user.name));
    });
    if (burnoutMembers.size > 0) {
      reply += `- Redistribute workload from overloaded team members: ${[...burnoutMembers].join(', ')}.\n`;
    }

    if (overdueList.length === 0 && highRisk.length === 0 && criticalPending.length === 0 && burnoutMembers.size === 0) {
      reply += `Your workspace is in good shape! Focus on:\n- Completing in-progress tasks\n- Logging contributions regularly\n- Reviewing upcoming deadlines`;
    }

    return reply.trim();
  }

  if (q.includes('deadline') || q.includes('due date') || q.includes('when') || q.includes('schedule')) {
    let reply = `Deadline summary for your projects:\n\n`;
    projectSummaries.forEach(({ project, analytics }) => {
      const deadline = project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not set';
      const daysLeft = project.deadline ? Math.ceil((new Date(project.deadline) - now) / (24 * 60 * 60 * 1000)) : null;
      reply += `${project.title}:\n`;
      reply += `  Deadline: ${deadline}`;
      if (daysLeft !== null) {
        reply += daysLeft < 0 ? ` — OVERDUE by ${Math.abs(daysLeft)} days` : ` (${daysLeft} days left)`;
      }
      reply += `\n  Risk Level: ${analytics.deadlineRisk.toUpperCase()} | Progress: ${analytics.projectProgressPercentage}%\n\n`;
    });
    return reply.trim();
  }

  if (q.includes('member') || q.includes('team') || q.includes('developer') || q.includes('who is on') || q.includes('contributor list')) {
    let reply = `Team overview across your projects:\n\n`;
    projectSummaries.forEach(({ project }) => {
      reply += `${project.title} (${project.members.length} member${project.members.length !== 1 ? 's' : ''}):\n`;
      project.members.forEach(m => {
        reply += `  - ${m.user.name} (${m.projectRole || 'member'})\n`;
      });
      reply += '\n';
    });
    return reply.trim();
  }

  if (q.includes('summar') || q.includes('progress') || q.includes('report') || q.includes('update')) {
    let reply = `Workspace summary for ${user.name}:\n\n`;
    reply += `Projects: ${totalProjects} | Tasks: ${totalTasks} total | Completed: ${completedTasks} | Pending: ${pendingTasks} | Overdue: ${overdueTasks}\n`;
    reply += `Average Health Score: ${avgHealth}/100\n\n`;

    projectSummaries.forEach(({ project, analytics }) => {
      reply += `${project.title}: ${analytics.projectProgressPercentage}% complete | Health: ${analytics.healthScore}/100 | Risk: ${analytics.deadlineRisk.toUpperCase()}\n`;
    });

    return reply.trim();
  }

  return `Hi ${user.name}! I'm your SyncScore AI Assistant with access to your ${totalProjects} project${totalProjects !== 1 ? 's' : ''}.\n\nWorkspace snapshot:\n- ${totalTasks} total tasks (${completedTasks} done, ${pendingTasks} pending)\n- ${overdueTasks} overdue task${overdueTasks !== 1 ? 's' : ''}\n- Average health score: ${avgHealth}/100\n\nYou can ask me:\n- "What is my project status?"\n- "Which tasks are pending?"\n- "Who contributed the most?"\n- "Why is my project delayed?"\n- "What should I work on next?"\n- "Summarize my project progress."\n- "What are my deadlines?"\n- "Who is on my team?"`;
};

module.exports = {
  getAIChatResponse,
  getChatHistory,
  askAssistant,
  getDailySummary,
  getSprintPlan,
  exportReport,
  globalChatHandler,
};
