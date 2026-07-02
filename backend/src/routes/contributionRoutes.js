const express = require('express');
const router = express.Router();
const {
  addContribution,
  getContributionsByProject,
  getContributionsByUser,
} = require('../controllers/contributionController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.post('/', addContribution);
router.get('/project/:projectId', getContributionsByProject);
router.get('/user/:userId', getContributionsByUser);

module.exports = router;
