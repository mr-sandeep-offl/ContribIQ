const express = require('express');
const router = express.Router();
const {
  getAIChatResponse,
  getChatHistory,
  askAssistant,
  getDailySummary,
  getSprintPlan,
  exportReport
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Route for AI Assistant chat (unified Groq page)
router.post('/chat', getAIChatResponse);

// Project-specific AI Assistant endpoints
router.get('/:projectId/chat', getChatHistory);
router.post('/:projectId/chat', askAssistant);
router.get('/:projectId/summary', getDailySummary);
router.post('/:projectId/sprint-plan', getSprintPlan);
router.get('/:projectId/export', exportReport);

module.exports = router;
