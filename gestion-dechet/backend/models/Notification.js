const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('info', 'warning', 'success', 'reminder', 'alert'),
        defaultValue: 'info'
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    actionUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    relatedReportId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    relatedEventId: {
        type: DataTypes.UUID,
        allowNull: true
    }
});

module.exports = Notification;