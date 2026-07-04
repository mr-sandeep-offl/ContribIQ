const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const Contribution = require('../models/Contribution');

// @desc    Create task inside project
// @route   POST /api/projects/:projectId/tasks
// @access  Private
const createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority, deadline, status, estimatedHours, labels, dependencies } = req.body;

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
      estimatedHours: estimatedHours || 0,
      labels: labels || [],
      dependencies: dependencies || [],
      completedAt: status === 'completed' ? new Date() : undefined,
    });

    // Log Activity
    await Activity.create({
      projectId,
      userId: req.user._id,
      type: 'task_create',
      content: `Created task "${title}"`,
    });

    // Notify assigned user if not creator
    if (assignedTo && assignedTo.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: assignedTo,
        projectId,
        message: `You have been assigned the task "${title}" in project "${projectDoc.title}".`,
      });
    }

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
    const { title, description, assignedTo, priority, deadline, status, estimatedHours, actualHours, labels, dependencies } = req.body;

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

    // Only owner (project creator) or task creator or assigned user can update task details
    const isProjectOwner = projectDoc.createdBy.toString() === req.user._id.toString();
    const isTaskCreator = task.createdBy.toString() === req.user._id.toString();
    const isAssignedUser = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    if (!isProjectOwner && !isTaskCreator && !isAssignedUser) {
      res.status(403);
      return next(new Error('Not authorized to update this task (Must be project owner, task creator, or assignee)'));
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

    // Track Audit Log (History)
    const fieldsToTrack = ['title', 'description', 'assignedTo', 'priority', 'deadline', 'status', 'estimatedHours', 'actualHours'];
    const auditLogs = [];

    fieldsToTrack.forEach((field) => {
      if (req.body[field] !== undefined) {
        let oldValue = task[field];
        let newValue = req.body[field];

        if (oldValue instanceof Date) oldValue = oldValue.toISOString().substring(0, 10);
        if (newValue instanceof Date) newValue = newValue.toISOString().substring(0, 10);
        if (oldValue && oldValue.toString) oldValue = oldValue.toString();
        if (newValue && newValue.toString) newValue = newValue.toString();

        if (oldValue !== newValue) {
          auditLogs.push({
            user: req.user._id,
            action: 'update',
            field,
            oldValue: oldValue || 'None',
            newValue: newValue || 'None',
            timestamp: new Date(),
          });
        }
      }
    });

    if (auditLogs.length > 0) {
      task.history.push(...auditLogs);
    }

    // Handle assignee transitions (Notification)
    const oldAssignee = task.assignedTo ? task.assignedTo.toString() : null;
    const newAssignee = assignedTo ? assignedTo.toString() : null;

    if (newAssignee && oldAssignee !== newAssignee && newAssignee !== req.user._id.toString()) {
      await Notification.create({
        userId: newAssignee,
        projectId: task.projectId,
        message: `You have been assigned the task "${title || task.title}" in project "${projectDoc.title}".`,
      });
    }

    // Handle Completed status transition -> auto-log Contribution and Activity
    if (status && status === 'completed' && task.status !== 'completed') {
      task.completedAt = new Date();
      
      const targetUser = assignedTo || task.assignedTo || req.user._id;
      const priorityWeights = { low: 3, medium: 5, high: 8, critical: 10 };
      const score = priorityWeights[priority || task.priority] || 5;

      await Contribution.create({
        projectId: task.projectId,
        userId: targetUser,
        type: 'task',
        title: `Task Completed: ${title || task.title}`,
        description: `Successfully resolved and finalized sprint task: ${title || task.title}`,
        impactScore: score,
        source: 'manual',
      });

      await Activity.create({
        projectId: task.projectId,
        userId: req.user._id,
        type: 'task_complete',
        content: `Completed task "${title || task.title}"`,
      });
    } else if (status && status !== 'completed' && task.status === 'completed') {
      task.completedAt = undefined;
    }

    // Log general update activity
    if (status !== 'completed' && auditLogs.length > 0) {
      await Activity.create({
        projectId: task.projectId,
        userId: req.user._id,
        type: 'task_update',
        content: `Updated task "${task.title}": ${auditLogs.map((log) => log.field).join(', ')}`,
      });
    }

    if (status) task.status = status;
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (priority) task.priority = priority;
    if (deadline) task.deadline = deadline;
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
    if (actualHours !== undefined) task.actualHours = actualHours;
    if (labels !== undefined) task.labels = labels;
    if (dependencies !== undefined) task.dependencies = dependencies;

    await task.save();

    const updatedTask = await Task.findById(req.params.taskId)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');

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

// @desc    Add comment to task
// @route   POST /api/tasks/:taskId/comments
// @access  Private
const addTaskComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      res.status(400);
      return next(new Error('Please provide comment text'));
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    // Verify membership
    const project = await Project.findById(task.projectId);
    const isMember = project.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      res.status(403);
      return next(new Error('Not authorized to comment on this task'));
    }

    const comment = {
      user: req.user._id,
      text,
      createdAt: new Date(),
    };

    task.comments.push(comment);
    await task.save();

    // Log Activity
    await Activity.create({
      projectId: task.projectId,
      userId: req.user._id,
      type: 'comment_add',
      content: `Commented on task "${task.title}"`,
    });

    const updatedTask = await Task.findById(req.params.taskId)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');

    res.status(201).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment from task
// @route   DELETE /api/tasks/:taskId/comments/:commentId
// @access  Private
const deleteTaskComment = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    const comment = task.comments.id(req.params.commentId);
    if (!comment) {
      res.status(404);
      return next(new Error('Comment not found'));
    }

    // Only comment author or task creator or project owner can delete comment
    const project = await Project.findById(task.projectId);
    const isCommentAuthor = comment.user.toString() === req.user._id.toString();
    const isTaskCreator = task.createdBy.toString() === req.user._id.toString();
    const isProjectOwner = project.createdBy.toString() === req.user._id.toString();

    if (!isCommentAuthor && !isTaskCreator && !isProjectOwner) {
      res.status(403);
      return next(new Error('Not authorized to delete this comment'));
    }

    comment.deleteOne();
    await task.save();

    // Log Activity
    await Activity.create({
      projectId: task.projectId,
      userId: req.user._id,
      type: 'comment_delete',
      content: `Deleted comment from task "${task.title}"`,
    });

    const updatedTask = await Task.findById(req.params.taskId)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');

    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Add attachment to task
// @route   POST /api/tasks/:taskId/attachments
// @access  Private
const addTaskAttachment = async (req, res, next) => {
  try {
    const { name, url } = req.body;
    if (!name || !url) {
      res.status(400);
      return next(new Error('Please provide attachment name and url'));
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    // Verify membership
    const project = await Project.findById(task.projectId);
    const isMember = project.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      res.status(403);
      return next(new Error('Not authorized to add attachments to this task'));
    }

    const attachment = {
      name,
      url,
      uploadedAt: new Date(),
    };

    task.attachments.push(attachment);
    await task.save();

    // Log Activity
    await Activity.create({
      projectId: task.projectId,
      userId: req.user._id,
      type: 'attachment_add',
      content: `Uploaded attachment "${name}" to task "${task.title}"`,
    });

    const updatedTask = await Task.findById(req.params.taskId)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');

    res.status(201).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete attachment from task
// @route   DELETE /api/tasks/:taskId/attachments/:attachmentId
// @access  Private
const deleteTaskAttachment = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    const attachment = task.attachments.id(req.params.attachmentId);
    if (!attachment) {
      res.status(404);
      return next(new Error('Attachment not found'));
    }

    // Only task creator or project owner can delete attachment
    const project = await Project.findById(task.projectId);
    const isTaskCreator = task.createdBy.toString() === req.user._id.toString();
    const isProjectOwner = project.createdBy.toString() === req.user._id.toString();

    if (!isTaskCreator && !isProjectOwner) {
      res.status(403);
      return next(new Error('Not authorized to delete this attachment'));
    }

    attachment.deleteOne();
    await task.save();

    // Log Activity
    await Activity.create({
      projectId: task.projectId,
      userId: req.user._id,
      type: 'attachment_delete',
      content: `Removed attachment from task "${task.title}"`,
    });

    const updatedTask = await Task.findById(req.params.taskId)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');

    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks assigned to current user
// @route   GET /api/tasks/my
// @access  Private
const getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate('projectId', 'title status deadline')
      .sort({ deadline: 1 });
    res.json(tasks);
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
  addTaskComment,
  deleteTaskComment,
  addTaskAttachment,
  deleteTaskAttachment,
  getMyTasks,
};
