const express = require('express');
const router = express.Router();
const ecoActionController = require('../controllers/EcoActionController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes utilisateur
router.get('/my-actions', authenticate, ecoActionController.getUserEcoActions);
router.get('/ranking', ecoActionController.getUserRanking);

// Routes administration
router.get('/', authenticate, authorize('admin', 'worker'), ecoActionController.getAllEcoActions);
router.get('/stats', authenticate, ecoActionController.getEcoActionsStats);
router.get('/:id', authenticate, authorize('admin', 'worker'), ecoActionController.getEcoActionById);
router.post('/', authenticate, authorize('admin', 'worker'), ecoActionController.createEcoAction);
router.delete('/:id', authenticate, authorize('admin'), ecoActionController.deleteEcoAction);

module.exports = router;