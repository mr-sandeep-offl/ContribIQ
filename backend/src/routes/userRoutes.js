const express = require('express');
const router = express.Router();
const { getMyContributions } = require('../controllers/contributionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me/contributions', protect, getMyContributions);

module.exports = router;
