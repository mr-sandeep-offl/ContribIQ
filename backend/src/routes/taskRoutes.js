const express = require('express');
const router = express.Router();
const {
  getTaskById,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.route('/:taskId')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;
