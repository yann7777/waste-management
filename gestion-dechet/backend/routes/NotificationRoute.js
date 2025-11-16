const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/NotificationController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes utilisateur
router.get('/', authenticate, notificationController.getUserNotifications);
router.get('/unread-count', authenticate, notificationController.getUnreadCount);
router.patch('/:id/read', authenticate, notificationController.markAsRead);
router.patch('/mark-all-read', authenticate, notificationController.markAllAsRead);
router.delete('/:id', authenticate, notificationController.deleteNotification);

// Routes administration (création de notifications)
router.post('/', authenticate, authorize('admin', 'worker'), notificationController.createNotification);
router.post('/broadcast', authenticate, authorize('admin'), notificationController.broadcastNotification);
router.post('/broadcast-to-role', authenticate, authorize('admin'), notificationController.sendNotificationToRole);

module.exports = router;