'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.use(authenticate);

// GET /api/v1/notifications
router.get('/', notificationController.getNotifications);

// GET /api/v1/notifications/unread-count
router.get('/unread-count', notificationController.getUnreadCount);

// PATCH or PUT /api/v1/notifications/:id/read
router.patch('/:id/read', notificationController.markAsRead);
router.put('/:id/read', notificationController.markAsRead);

// PATCH or PUT /api/v1/notifications/read-all
router.patch('/read-all', notificationController.markAllAsRead);
router.put('/read-all', notificationController.markAllAsRead);

module.exports = router;

