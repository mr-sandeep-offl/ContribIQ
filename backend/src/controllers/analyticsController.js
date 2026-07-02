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
      healthScore: analytics.healthScore,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjectAnalytics,
};
