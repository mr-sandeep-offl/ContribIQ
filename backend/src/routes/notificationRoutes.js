const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getNotifications);

router.route('/read-all')
  .put(markAllNotificationsRead);

router.route('/:id/read')
  .put(markNotificationRead);

module.exports = router;
