const express = require('express');
const router = express.Router();
const reportController = require('../controllers/ReportController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', authenticate, upload.array('photos', 5), reportController.createReport);
router.get('/', authenticate, reportController.getReports);
router.patch('/:id/status', authenticate, authorize('worker', 'admin'), reportController.updateReportStatus);
router.get('/stats', authenticate, authorize('worker', 'admin'), reportController.getReportStats);

module.exports = router;