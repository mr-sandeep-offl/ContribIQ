const express = require('express');
const router = express.Router();
const { getChatHistory, askAssistant, getDailySummary, getSprintPlan, exportReport, globalChatHandler } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// All routes require token auth
router.post('/chat', globalChatHandler);

router.get('/:projectId/chat', getChatHistory);
router.post('/:projectId/chat', askAssistant);
router.get('/:projectId/summary', getDailySummary);
router.post('/:projectId/sprint-plan', getSprintPlan);
router.get('/:projectId/export', exportReport);

module.exports = router;
