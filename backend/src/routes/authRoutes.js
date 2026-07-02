const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);

// Protected test route (requires valid token, returns authenticated user details)
router.get('/test', protect, (req, res) => {
  res.status(200).json({
    message: 'Authentication successful! You have accessed the protected test route.',
    user: req.user,
  });
});

// Protected test route with role authorization (requires admin or team_leader role)
router.get('/test-role', protect, authorize('admin', 'team_leader'), (req, res) => {
  res.status(200).json({
    message: `Role authorization successful! You have accessed this route as a ${req.user.role}.`,
    user: req.user,
  });
});

module.exports = router;
