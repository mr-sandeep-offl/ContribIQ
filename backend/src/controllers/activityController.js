const Activity = require('../models/Activity');
const Project = require('../models/Project');

// @desc    Get project activities
// @route   GET /api/projects/:projectId/activities
// @access  Private
const getProjectActivities = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    // Verify membership
    const isMember = project.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      res.status(403);
      return next(new Error('Not authorized to access project activity'));
    }

    const activities = await Activity.find({ projectId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(activities);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjectActivities,
};
