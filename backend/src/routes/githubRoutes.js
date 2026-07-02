const express = require('express');
const router = express.Router();
const { importMockContributions } = require('../controllers/githubController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.post('/import', importMockContributions);

module.exports = router;
