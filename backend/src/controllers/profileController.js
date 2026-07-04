const Project = require('../models/Project');
const Task = require('../models/Task');
const Contribution = require('../models/Contribution');
const calculateProjectAnalytics = require('../utils/calculateAnalytics');

// @desc    Get profile dashboard telemetry for the logged in user
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Fetch current projects
    const projects = await Project.find({ 'members.user': userId })
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    const projectIds = projects.map(p => p._id);

    // 2. Fetch tasks and contributions across all projects for this user
    const tasks = await Task.find({ projectId: { $in: projectIds } });
    const userTasks = tasks.filter(t => t.assignedTo && t.assignedTo.toString() === userId.toString());
    
    const completedTasksCount = userTasks.filter(t => t.status === 'completed').length;
    const pendingTasksCount = userTasks.length - completedTasksCount;

    const contributions = await Contribution.find({ userId });

    // 3. Compute 30-day Activity Heatmap
    const heatmapData = {};
    const now = new Date();
    
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().substring(0, 10);
      heatmapData[dateStr] = 0;
    }

    contributions.forEach((c) => {
      const dateStr = new Date(c.createdAt || now).toISOString().substring(0, 10);
      if (heatmapData[dateStr] !== undefined) {
        heatmapData[dateStr] += 1;
      }
    });

    const activityHeatmap = Object.keys(heatmapData).map((date) => ({
      date,
      count: heatmapData[date],
    })).sort((a, b) => a.date.localeCompare(b.date));

    // 4. Calculate overall contribution index (average of scores across project analytics)
    let totalScore = 0;
    let projectsAnalyzed = 0;

    for (const project of projects) {
      const pTasks = tasks.filter(t => t.projectId.toString() === project._id.toString());
      const pContribs = await Contribution.find({ projectId: project._id });
      try {
        const analytics = calculateProjectAnalytics(project, pTasks, pContribs);
        const userWorkload = analytics.memberWorkload.find(w => w.user._id.toString() === userId.toString());
        if (userWorkload) {
          totalScore += userWorkload.contributionScore;
          projectsAnalyzed += 1;
        }
      } catch (err) {
        console.error(`Error generating analytics for profile project ${project._id}:`, err);
      }
    }

    const overallContributionScore = projectsAnalyzed > 0 ? Math.round(totalScore / projectsAnalyzed) : 50;

    // 5. Compute achievements list
    const achievements = [];
    if (overallContributionScore >= 80) {
      achievements.push({
        title: 'Sprint Champion',
        description: 'Maintained a team contribution score above 80% across projects.',
        icon: 'Crown',
      });
    }
    if (contributions.length >= 15) {
      achievements.push({
        title: 'Consistent Committer',
        description: 'Logged more than 15 separate contributions in the workspace.',
        icon: 'CheckCircle',
      });
    }
    if (completedTasksCount >= 8) {
      achievements.push({
        title: 'Task Crusher',
        description: 'Successfully resolved more than 8 task backlog items.',
        icon: 'Zap',
      });
    }
    if (projects.some(p => p.owner && p.owner._id.toString() === userId.toString())) {
      achievements.push({
        title: 'Project Architect',
        description: 'Created and deployed a project workspace as sprint owner.',
        icon: 'Sparkles',
      });
    }

    res.json({
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
      stats: {
        overallContributionScore,
        completedTasksCount,
        pendingTasksCount,
        totalContributions: contributions.length,
      },
      achievements,
      activityHeatmap,
      projects: projects.map(p => ({
        _id: p._id,
        title: p.title,
        status: p.status,
        ownerName: p.owner?.name,
        role: p.owner?._id.toString() === userId.toString() ? 'Owner' : 'Member',
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
};
