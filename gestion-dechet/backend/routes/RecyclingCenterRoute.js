const express = require('express');
const router = express.Router();
const recyclingCenterController = require('../controllers/RecyclingCenterController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes publiques
router.get('/public', recyclingCenterController.getAllRecyclingCenters);
router.get('/public/nearby', recyclingCenterController.getNearbyCenters);
router.get('/public/material/:material', recyclingCenterController.getCentersByMaterial);
router.get('/public/:id', recyclingCenterController.getRecyclingCenterById);

// Routes protégées pour les citoyens
router.get('/favorites', authenticate, recyclingCenterController.getUserFavorites);
router.post('/:id/favorite', authenticate, recyclingCenterController.toggleFavorite);

// Routes administration
router.post('/', authenticate, authorize('admin', 'worker'), recyclingCenterController.createRecyclingCenter);
router.put('/:id', authenticate, authorize('admin', 'worker'), recyclingCenterController.updateRecyclingCenter);
router.delete('/:id', authenticate, authorize('admin'), recyclingCenterController.deleteRecyclingCenter);
router.patch('/:id/occupancy', authenticate, authorize('admin', 'worker'), recyclingCenterController.updateOccupancy);
router.get('/stats/overview', authenticate, authorize('admin', 'worker'), recyclingCenterController.getAllRecyclingCenterStats);

module.exports = router;