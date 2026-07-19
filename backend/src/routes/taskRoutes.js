const express = require('express');
const router = express.Router();
const {
  getTaskById,
  updateTask,
  deleteTask,
  addTaskComment,
  deleteTaskComment,
  addTaskAttachment,
  deleteTaskAttachment,
  getMyTasks
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.route('/my')
  .get(getMyTasks);

router.route('/:taskId')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

router.route('/:taskId/comments')
  .post(addTaskComment);

router.route('/:taskId/comments/:commentId')
  .delete(deleteTaskComment);

router.route('/:taskId/attachments')
  .post(addTaskAttachment);

router.route('/:taskId/attachments/:attachmentId')
  .delete(deleteTaskAttachment);

module.exports = router;
