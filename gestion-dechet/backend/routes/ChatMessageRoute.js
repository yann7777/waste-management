const express = require('express');
const router = express.Router();
const chatController = require('../controllers/ChatMessageController');
const { authenticate } = require('../middleware/auth');

router.post('/send', authenticate, chatController.sendMessage);
router.get('/chats', authenticate, chatController.getUserChats);
router.get('/rooms/:room/messages', authenticate, chatController.getRoomMessages);
router.patch('/rooms/:room/read', authenticate, chatController.markMessagesAsRead);
router.get('/unread-count', authenticate, chatController.getUnreadMessagesCount);
router.delete('/messages/:id', authenticate, chatController.deleteMessage);

module.exports = router;