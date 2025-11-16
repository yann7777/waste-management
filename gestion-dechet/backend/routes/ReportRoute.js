const express = require('express');
const router = express.Router();
const reportController = require('../controllers/ReportController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Routes pour les signalements
router.post('/', authenticate, upload.array('photos', 5), reportController.createReport);
router.get('/', authenticate, reportController.getReports);
router.get('/user/my-reports', authenticate, reportController.getUserReports);
router.get('/stats', authenticate, authorize('worker', 'admin'), reportController.getReportStats);
router.get('/:id', authenticate, reportController.getReportById);
router.put('/:id', authenticate, upload.array('photos', 5), reportController.updateReport);
router.patch('/:id/status', authenticate, authorize('worker', 'admin'), reportController.updateReportStatus);
router.post('/:id/photos', authenticate, upload.array('photos', 5), reportController.addReportPhotos);
router.delete('/:id', authenticate, reportController.deleteReport);

module.exports = router;