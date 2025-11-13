const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

router.get('/dashboard-stats', authenticate, analyticsController.getDashboardStats);
router.get('/optimization-routes', authenticate, analyticsController.getOptimizationRoutes);

module.exports = router;