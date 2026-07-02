const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const Contribution = require('../models/Contribution');
const calculateProjectAnalytics = require('../utils/calculateAnalytics');
const generateAISummary = require('../utils/generateAISummary');

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res, next) => {
  try {
    const { title, description, category, deadline, repoUrl, status } = req.body;

    if (!title || !category || !deadline) {
      res.status(400);
      return next(new Error('Please add project title, category, and deadline'));
    }

    const project = await Project.create({
      title,
      description,
      category,
      deadline,
      repoUrl,
      status: status || 'planning',
      createdBy: req.user._id,
      members: [{ user: req.user._id, projectRole: 'owner', joinedAt: new Date() }],
    });

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    // Find projects where user is in members list
    const projects = await Project.find({
      'members.user': req.user._id,
    })
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email role');

    res.json(projects);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email role');

    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    // Check if user is a member of the project
    const isMember = project.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      res.status(403);
      return next(new Error('Not authorized to view this project'));
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res, next) => {
  try {
    const { title, description, category, deadline, repoUrl, status } = req.body;

    let project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    // Check if logged-in user is project creator (owner)
    if (project.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Not authorized to update this project'));
    }

    project = await Project.findByIdAndUpdate(
      req.params.id,
      { title, description, category, deadline, repoUrl, status },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email role');

    res.json(project);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    // Check if logged-in user is project creator (owner)
    if (project.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Not authorized to delete this project'));
    }

    await project.deleteOne();

    res.json({ message: 'Project removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to project by email
// @route   POST /api/projects/:id/members
// @access  Private
const addMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;

    if (!email) {
      res.status(400);
      return next(new Error('Please provide user email'));
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    // Check authorization: only creator (owner) can add members
    if (project.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Only the project owner can add members'));
    }

    // Find user by email
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      res.status(404);
      return next(new Error('User not found with this email'));
    }

    // Check if user is already a member
    const alreadyMember = project.members.some(
      (m) => m.user.toString() === userToAdd._id.toString()
    );

    if (alreadyMember) {
      res.status(400);
      return next(new Error('User is already a member of this project'));
    }

    // Add member
    project.members.push({
      user: userToAdd._id,
      projectRole: role || 'member',
      joinedAt: new Date(),
    });

    await project.save();

    const updatedProject = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email role');

    res.json(updatedProject);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private
const removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    // Check authorization: only creator (owner) can remove members
    if (project.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Only the project owner can remove members'));
    }

    const memberIdToRemove = req.params.userId;

    // Cannot remove the creator (owner)
    if (memberIdToRemove === project.createdBy.toString()) {
      res.status(400);
      return next(new Error('Cannot remove the project owner'));
    }

    // Check if user is member
    const isMember = project.members.some(
      (m) => m.user.toString() === memberIdToRemove
    );

    if (!isMember) {
      res.status(404);
      return next(new Error('User is not a member of this project'));
    }

    // Filter out the member
    project.members = project.members.filter(
      (m) => m.user.toString() !== memberIdToRemove
    );

    await project.save();

    const updatedProject = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email role');

    res.json(updatedProject);
  } catch (error) {
    next(error);
  }
};

// @desc    Generate AI Summary for project
// @route   POST /api/projects/:projectId/ai-summary
// @access  Private
const generateProjectAISummary = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const project = await Project.findById(projectId)
      .populate('members.user', 'name email role');

    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    // Check membership
    const isMember = project.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      res.status(403);
      return next(new Error('Not authorized to view this project summary'));
    }

    const tasks = await Task.find({ projectId });
    const contributions = await Contribution.find({ projectId });

    const analytics = calculateProjectAnalytics(project, tasks, contributions);
    const summaryText = generateAISummary(project.title, analytics);

    res.json({
      summary: summaryText,
      generatedAt: new Date(),
      analyticsSnapshot: analytics,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  generateProjectAISummary,
};
