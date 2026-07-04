const express = require('express');
const router = express.Router();
const { getProjectAnalytics, getProjectReplay, getWorkspaceSummary } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.get('/summary', getWorkspaceSummary);
router.get('/project/:projectId', getProjectAnalytics);
router.get('/project/:projectId/replay', getProjectReplay);

module.exports = router;
