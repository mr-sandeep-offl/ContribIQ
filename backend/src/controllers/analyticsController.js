const Project = require('../models/Project');
const Task = require('../models/Task');
const Contribution = require('../models/Contribution');
const calculateProjectAnalytics = require('../utils/calculateAnalytics');

// @desc    Get analytics for a project
// @route   GET /api/projects/:projectId/analytics
// @access  Private
const getProjectAnalytics = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate('members.user', 'name email role');

    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    // Verify requester is member of the project
    const isMember = project.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      res.status(403);
      return next(new Error('Not authorized to view analytics for this project'));
    }

    // Fetch all tasks for this project
    const tasks = await Task.find({ projectId });

    // Fetch all contributions for this project
    const contributions = await Contribution.find({ projectId });

    // Calculate analytics
    const analytics = calculateProjectAnalytics(project, tasks, contributions);

    // Return the formatted response directly
    res.json({
      projectTitle: analytics.projectTitle,
      totalTasks: analytics.totalTasks,
      completedTasks: analytics.completedTasks,
      pendingTasks: analytics.pendingTasks,
      overdueTasks: analytics.overdueTasks,
      projectProgressPercentage: analytics.projectProgressPercentage,
      memberContributionPercentages: analytics.memberContributionPercentages,
      inactiveMembers: analytics.inactiveMembers,
      deadlineRisk: analytics.deadlineRisk,
      deadlineRiskExplanation: analytics.deadlineRiskExplanation,
      deadlineRiskSuggestions: analytics.deadlineRiskSuggestions,
      healthScore: analytics.healthScore,
      activityHeatmap: analytics.activityHeatmap,
      weeklyTrends: analytics.weeklyTrends,
      memberWorkload: analytics.memberWorkload,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get weekly replay snapshots for a project
// @route   GET /api/projects/:projectId/replay
// @access  Private
const getProjectReplay = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    // Verify requester is member of the project
    const isMember = project.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      res.status(403);
      return next(new Error('Not authorized to view replay for this project'));
    }

    const tasks = await Task.find({ projectId });
    const contributions = await Contribution.find({ projectId });

    const creationDate = project.createdAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const snapshots = [];
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

    for (let week = 1; week <= 4; week++) {
      const endOfWeekTime = new Date(creationDate.getTime() + week * oneWeekMs);
      const targetTime = endOfWeekTime > now ? now : endOfWeekTime;

      // Filter tasks created before this time, and completed status set before this time
      const weekTasks = tasks.filter(t => new Date(t.createdAt || creationDate) <= targetTime);
      const weekCompletedTasks = tasks.filter(t => {
        if (t.status === 'completed') {
          const completionLog = t.history ? t.history.find(h => h.field === 'status' && h.newValue === 'completed') : null;
          const completedAt = completionLog ? new Date(completionLog.timestamp) : (t.updatedAt || targetTime);
          return completedAt <= targetTime;
        }
        return false;
      });

      const completedCount = weekCompletedTasks.length;
      const totalCount = weekTasks.length;
      const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      // Contributions completed up to this time
      const weekContributions = contributions.filter(c => new Date(c.createdAt || creationDate) <= targetTime);
      const totalImpact = weekContributions.reduce((sum, c) => sum + c.impactScore, 0);

      // Compute health score proxy for that week
      let health = 100;
      health -= (100 - progress) * 0.3;
      health = Math.max(20, Math.min(100, Math.round(health)));

      snapshots.push({
        week: `Week ${week}`,
        completedTasks: completedCount,
        totalTasks: totalCount,
        progressPercentage: progress,
        totalContributionImpact: totalImpact,
        healthScore: health,
        date: targetTime.toISOString().substring(0, 10),
      });
    }

    res.json({ snapshots });
  } catch (error) {
    next(error);
  }
};

// @desc    Get workspace-wide analytics summary for the logged-in user
// @route   GET /api/analytics/summary
// @access  Private
const getWorkspaceSummary = async (req, res, next) => {
  try {
    const Notification = require('../models/Notification');
    const Activity = require('../models/Activity');

    // 1. Find all projects the user is a member of
    const projects = await Project.find({
      'members.user': req.user._id,
    }).populate('members.user', 'name email role');

    const projectIds = projects.map((p) => p._id);

    // 2. Fetch all tasks for these projects
    const allTasks = await Task.find({ projectId: { $in: projectIds } });

    // 3. Fetch all contributions for these projects
    const allContributions = await Contribution.find({ projectId: { $in: projectIds } });

    // 4. Fetch unread notifications count for the user
    const notificationsCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });

    // 5. Fetch recent activity across all user's projects
    const recentActivity = await Activity.find({ projectId: { $in: projectIds } })
      .populate('userId', 'name email')
      .populate('projectId', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    // 6. Calculate statistics
    let totalProjects = projects.length;
    let totalTasks = 0;
    let activeTasks = 0;
    let completedTasks = 0;
    let overdueTasks = 0;
    let totalHealthScore = 0;
    let totalProgress = 0;
    let highRiskProjectsCount = 0;

    // Filter tasks assigned to logged-in user
    const userTasks = allTasks.filter(
      (t) => t.assignedTo && t.assignedTo.toString() === req.user._id.toString()
    );
    totalTasks = userTasks.length;
    activeTasks = userTasks.filter((t) => t.status !== 'completed').length;
    completedTasks = userTasks.filter((t) => t.status === 'completed').length;
    
    const now = new Date();
    overdueTasks = userTasks.filter(
      (t) => t.status !== 'completed' && t.deadline && new Date(t.deadline) < now
    ).length;

    // Filter contributions of logged-in user
    const userContributions = allContributions.filter(
      (c) => c.userId && c.userId.toString() === req.user._id.toString()
    );
    const contributionScore = userContributions.reduce((sum, c) => sum + (c.impactScore || 0), 0);

    projects.forEach((project) => {
      const projectTasks = allTasks.filter(
        (t) => t.projectId.toString() === project._id.toString()
      );
      const projectContributions = allContributions.filter(
        (c) => c.projectId.toString() === project._id.toString()
      );

      const analytics = calculateProjectAnalytics(project, projectTasks, projectContributions);
      totalHealthScore += analytics.healthScore || 0;
      totalProgress += analytics.projectProgressPercentage || 0;
      if (analytics.deadlineRisk === 'high') {
        highRiskProjectsCount++;
      }
    });

    const averageHealthScore = totalProjects > 0 ? Math.round(totalHealthScore / totalProjects) : 100;
    const projectCompletion = totalProjects > 0 ? Math.round(totalProgress / totalProjects) : 0;
    const deadlineRisk = highRiskProjectsCount > 0 ? 'high' : 'low';

    res.json({
      totalProjects,
      totalTasks,
      activeTasks,
      completedTasks,
      overdueTasks,
      projectCompletion,
      averageHealthScore,
      contributionScore,
      deadlineRisk,
      highRiskProjectsCount,
      recentActivity,
      notificationsCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjectAnalytics,
  getProjectReplay,
  getWorkspaceSummary,
};
