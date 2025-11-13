const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EcoAction = sequelize.define('EcoAction', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('report', 'recycling', 'cleaning', 'education', 'other'),
        allowNull: false
    },
    points: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    reportId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    eventId: {
        type: DataTypes.UUID,
        allowNull: true
    }
});

module.exports = EcoAction;