const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CleaningEvent = sequelize.define('CleaningEvent', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    location: {
        type: DataTypes.JSONB,
        allowNull: false
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    maxParticipants: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('scheduled', 'ongoing', 'completed', 'cancelled'),
        defaultValue: 'scheduled'
    },
    organizerId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    ecoPointsReward: {
        type: DataTypes.INTEGER,
        defaultValue: 50
    }
});

module.exports = CleaningEvent;