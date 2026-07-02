const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  generateProjectAISummary,
} = require('../controllers/projectController');
const { createTask, getTasksByProject } = require('../controllers/taskController');
const {
  addContribution,
  getContributionsByProject,
  getContributionsSummary,
} = require('../controllers/contributionController');
const { getProjectAnalytics } = require('../controllers/analyticsController');
const { importMockContributions, getGitHubStatus } = require('../controllers/githubController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.route('/')
  .post(createProject)
  .get(getProjects);

router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

router.route('/:id/ai-summary')
  .post(generateProjectAISummary);

router.route('/:id/members')
  .post(addMember);

router.route('/:id/members/:userId')
  .delete(removeMember);

// Task routes under a specific project
router.route('/:projectId/tasks')
  .post(createTask)
  .get(getTasksByProject);

// Contribution routes under a specific project
router.route('/:projectId/contributions')
  .post(addContribution)
  .get(getContributionsByProject);

router.route('/:projectId/contributions/summary')
  .get(getContributionsSummary);

// Analytics route under a specific project
router.route('/:projectId/analytics')
  .get(getProjectAnalytics);

// GitHub routes under a specific project
router.route('/:projectId/github/import')
  .post(importMockContributions);

router.route('/:projectId/github/status')
  .get(getGitHubStatus);

module.exports = router;
