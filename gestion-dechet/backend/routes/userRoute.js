const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes admin seulement
router.get('/', authenticate, authorize('admin'), userController.getAllUsers);
router.get('/stats', authenticate, authorize('admin'), userController.getUserStats);
router.put('/:userId/role', authenticate, authorize('admin'), userController.updateUserRole);
router.delete('/:userId', authenticate, authorize('admin'), userController.deleteUser);

module.exports = router;