const express = require('express');
const router = express.Router();
const collectionScheduleController = require('../controllers/CollectionScheduleController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes publiques
router.get('/public/zone/:zone', collectionScheduleController.getSchedulesByZone);
router.get('/public/upcoming', collectionScheduleController.getUpcomingCollections);

// Routes protégées pour les citoyens
router.get('/', authenticate, collectionScheduleController.getAllSchedules);
router.get('/:id', authenticate, collectionScheduleController.getScheduleById);

// Routes administration
router.post('/', authenticate, authorize('admin', 'worker'), collectionScheduleController.createSchedule);
router.put('/:id', authenticate, authorize('admin', 'worker'), collectionScheduleController.updateSchedule);
router.delete('/:id', authenticate, authorize('admin'), collectionScheduleController.deleteSchedule);
router.patch('/:id/calculate-next', authenticate, authorize('admin', 'worker'), collectionScheduleController.calculateNextCollection);
router.get('/stats/overview', authenticate, authorize('admin', 'worker'), collectionScheduleController.getCollectionStats);
router.get('/worker/schedules', authenticate, authorize('worker'), collectionScheduleController.getWorkerSchedules);

module.exports = router;