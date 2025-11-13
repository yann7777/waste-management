const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatMessage = sequelize.define('ChatMessage', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    messageType: {
        type: DataTypes.ENUM('text', 'image', 'file', 'system')
    },
    room: {
        type: DataTypes.STRING,
        allowNull: false
    },
    recipientId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    attachments: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    }
});

module.exports = ChatMessage;