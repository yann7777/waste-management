const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CollectionSchedule = sequelize.define('CollectionSchedule', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    zone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    wasteType: {
        type: DataTypes.ENUM('general', 'recyclable', 'organic', 'hazardous'),
        allowNull: false
    },
    schedule: {
        type: DataTypes.JSONB,
        allowNull: false
    },
    nextCollection: {
        type: DataTypes.DATE,
        allowNull: false
    },
    frequency: {
        type: DataTypes.ENUM('daily', 'weekly', 'biweekly', 'monthly'),
        defaultValue: 'weekly'
    }
});

module.exports = CollectionSchedule;