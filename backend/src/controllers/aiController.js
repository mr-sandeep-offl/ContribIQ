const Project = require('../models/Project');
const Task = require('../models/Task');
const Contribution = require('../models/Contribution');
const calculateProjectAnalytics = require('../utils/calculateAnalytics');
const groqService = require('../services/groqService');
const fallbackService = require('../services/fallbackService');

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

module.exports = {
  getAIChatResponse,
};
