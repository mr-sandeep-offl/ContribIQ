const Project = require('../models/Project');
const Task = require('../models/Task');

// @desc    Global search across projects, tasks, and members
// @route   GET /api/search
// @access  Private
const globalSearch = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.json({ projects: [], tasks: [] });
    }

    const userId = req.user._id;
    const regex = new RegExp(query, 'i');

    // 1. Find projects where the user is a member, matching project title/desc
    const projects = await Project.find({
      'members.user': userId,
      $or: [{ title: regex }, { description: regex }],
    }).limit(10);

    // Get all projectIds user has access to
    const accessibleProjects = await Project.find({ 'members.user': userId }).select('_id');
    const projectIds = accessibleProjects.map(p => p._id);

    // 2. Find tasks belonging to accessible projects matching title/desc
    const tasks = await Task.find({
      projectId: { $in: projectIds },
      $or: [{ title: regex }, { description: regex }, { labels: regex }],
    })
      .populate('projectId', 'title')
      .limit(20);

    res.json({
      projects,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  globalSearch,
};
