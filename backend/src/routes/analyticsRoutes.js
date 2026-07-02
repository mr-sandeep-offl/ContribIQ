const express = require('express');
const router = express.Router();
const { getProjectAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.get('/project/:projectId', getProjectAnalytics);

module.exports = router;
