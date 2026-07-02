const Contribution = require('../models/Contribution');
const Project = require('../models/Project');

// @desc    Add a manual contribution
// @route   POST /api/projects/:projectId/contributions
// @access  Private
const addContribution = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { type, title, description, impactScore, source } = req.body;

    if (!type || !title || !description || !impactScore) {
      res.status(400);
      return next(new Error('Please provide type, title, description, and impactScore'));
    }

    // Verify project exists
    const projectDoc = await Project.findById(projectId);
    if (!projectDoc) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    // Verify requester is member of the project
    const isMember = projectDoc.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      res.status(403);
      return next(new Error('Not authorized to contribute to this project'));
    }

    const contribution = await Contribution.create({
      projectId,
      userId: req.user._id,
      type,
      title,
      description,
      impactScore,
      source: source || 'manual',
    });

    res.status(201).json(contribution);
  } catch (error) {
    next(error);
  }
};

// @desc    Get contributions by project
// @route   GET /api/projects/:projectId/contributions
// @access  Private
const getContributionsByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const projectDoc = await Project.findById(projectId);
    if (!projectDoc) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    // Check membership
    const isMember = projectDoc.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      res.status(403);
      return next(new Error('Not authorized to view contributions for this project'));
    }

    const contributions = await Contribution.find({ projectId })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    res.json(contributions);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's contributions
// @route   GET /api/users/me/contributions
// @access  Private
const getMyContributions = async (req, res, next) => {
  try {
    const contributions = await Contribution.find({ userId: req.user._id })
      .populate('projectId', 'title')
      .sort({ createdAt: -1 });

    res.json(contributions);
  } catch (error) {
    next(error);
  }
};

// @desc    Get contributions summary for a project
// @route   GET /api/projects/:projectId/contributions/summary
// @access  Private
const getContributionsSummary = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const projectDoc = await Project.findById(projectId).populate('members.user', 'name email');
    if (!projectDoc) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    // Check membership
    const isMember = projectDoc.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      res.status(403);
      return next(new Error('Not authorized to view the contribution summary for this project'));
    }

    const contributions = await Contribution.find({ projectId });

    // Calculate total impact score
    const totalImpactScore = contributions.reduce((sum, c) => sum + c.impactScore, 0);

    // Map each member to their contributions
    const memberImpactMap = {};
    contributions.forEach((c) => {
      const uId = c.userId.toString();
      memberImpactMap[uId] = (memberImpactMap[uId] || 0) + c.impactScore;
    });

    const membersSummary = projectDoc.members.map((member) => {
      const uId = member.user._id.toString();
      const totalImpact = memberImpactMap[uId] || 0;
      const percentage = totalImpactScore > 0 ? parseFloat(((totalImpact / totalImpactScore) * 100).toFixed(2)) : 0;

      return {
        user: {
          _id: member.user._id,
          name: member.user.name,
          email: member.user.email,
        },
        projectRole: member.projectRole || member.role,
        totalImpact,
        percentage,
      };
    });

    res.json({
      projectId,
      projectTitle: projectDoc.title,
      totalImpactScore,
      members: membersSummary,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addContribution,
  getContributionsByProject,
  getMyContributions,
  getContributionsSummary,
};
