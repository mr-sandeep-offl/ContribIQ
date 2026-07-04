const express = require('express');
const router = express.Router();
const { getUserProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getUserProfile);

module.exports = router;
