const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Create task inside project
// @route   POST /api/projects/:projectId/tasks
// @access  Private
const createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority, deadline, status } = req.body;

    if (!title || !deadline) {
      res.status(400);
      return next(new Error('Please provide title and deadline'));
    }

    // Verify project exists
    const projectDoc = await Project.findById(projectId);
    if (!projectDoc) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    // Verify requester is member of the project
    const requesterIsMember = projectDoc.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!requesterIsMember) {
      res.status(403);
      return next(new Error('Not authorized to add tasks to this project'));
    }

    // Verify assigned user is member of project
    if (assignedTo) {
      const assigneeIsMember = projectDoc.members.some(
        (m) => m.user.toString() === assignedTo
      );
      if (!assigneeIsMember) {
        res.status(400);
        return next(new Error('Assigned user must be a member of the project'));
      }
    }

    const task = await Task.create({
      title,
      description,
      projectId,
      assignedTo,
      createdBy: req.user._id,
      priority: priority || 'medium',
      status: status || 'todo',
      deadline,
      completedAt: status === 'completed' ? new Date() : undefined,
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks by project
// @route   GET /api/projects/:projectId/tasks
// @access  Private
const getTasksByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const projectDoc = await Project.findById(projectId);
    if (!projectDoc) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    // Check if requester is member of the project
    const isMember = projectDoc.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      res.status(403);
      return next(new Error('Not authorized to view tasks of this project'));
    }

    const tasks = await Task.find({ projectId })
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email');

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:taskId
// @access  Private
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email');

    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    const projectDoc = await Project.findById(task.projectId);
    if (!projectDoc) {
      res.status(404);
      return next(new Error('Associated project not found'));
    }

    // Only project members can view the task
    const isMember = projectDoc.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      res.status(403);
      return next(new Error('Not authorized to view this task'));
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};

// @desc    Update task details
// @route   PUT /api/tasks/:taskId
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    const { title, description, assignedTo, priority, deadline, status } = req.body;

    const task = await Task.findById(req.params.taskId);
    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    const projectDoc = await Project.findById(task.projectId);
    if (!projectDoc) {
      res.status(404);
      return next(new Error('Associated project not found'));
    }

    // Only owner (project creator) or task creator can update task
    const isProjectOwner = projectDoc.createdBy.toString() === req.user._id.toString();
    const isTaskCreator = task.createdBy.toString() === req.user._id.toString();

    if (!isProjectOwner && !isTaskCreator) {
      res.status(403);
      return next(new Error('Not authorized to update this task (Must be project owner or task creator)'));
    }

    // Verify assignee is member of project
    if (assignedTo) {
      const assigneeIsMember = projectDoc.members.some(
        (m) => m.user.toString() === assignedTo
      );
      if (!assigneeIsMember) {
        res.status(400);
        return next(new Error('Assigned user must be a member of the project'));
      }
    }

    // Track completedAt transition
    if (status) {
      if (status === 'completed' && task.status !== 'completed') {
        task.completedAt = new Date();
      } else if (status !== 'completed' && task.status === 'completed') {
        task.completedAt = undefined;
      }
      task.status = status;
    }

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (priority) task.priority = priority;
    if (deadline) task.deadline = deadline;

    await task.save();

    const updatedTask = await Task.findById(req.params.taskId)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email');

    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:taskId
// @access  Private
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    const projectDoc = await Project.findById(task.projectId);
    if (!projectDoc) {
      res.status(404);
      return next(new Error('Associated project not found'));
    }

    // Only owner (project creator) or task creator can delete task
    const isProjectOwner = projectDoc.createdBy.toString() === req.user._id.toString();
    const isTaskCreator = task.createdBy.toString() === req.user._id.toString();

    if (!isProjectOwner && !isTaskCreator) {
      res.status(403);
      return next(new Error('Not authorized to delete this task (Must be project owner or task creator)'));
    }

    await task.deleteOne();

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  deleteTask,
};
