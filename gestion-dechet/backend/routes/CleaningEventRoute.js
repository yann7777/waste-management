const express = require('express');
const router = express.Router();
const cleaningEventController = require('../controllers/CleaningEventController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes publiques (événements à venir)
router.get('/public', cleaningEventController.getAllEvents); // public pour différencier

// Routes protégées
router.post('/', authenticate, authorize('citizen', 'admin', 'worker'), cleaningEventController.createEvent);
router.get('/', authenticate, cleaningEventController.getAllEvents);
router.get('/user-events', authenticate, cleaningEventController.getUserEvents);
router.get('/:id', authenticate, cleaningEventController.getEventById);
router.post('/:id/join', authenticate, cleaningEventController.joinEvent);
router.post('/:id/leave', authenticate, cleaningEventController.leaveEvent);
router.patch('/:id/status', authenticate, cleaningEventController.updateEventStatus);

module.exports = router;