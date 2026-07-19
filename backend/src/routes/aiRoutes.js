const express = require('express');
const router = express.Router();
const { getAIChatResponse } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// Route for AI Assistant chat
router.post('/chat', protect, getAIChatResponse);

module.exports = router;
