const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    type: {
        type: DataTypes.ENUM('illegal_dumping', 'full_bin', 'broken_bin', 'other'),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    location: {
        type: DataTypes.JSONB,
        allowNull: false
    },
    photos: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'resolved', 'rejected'),
        defaultValue: 'pending'
    },
    severity: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium'
    },
    estimatedWasteVolume: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    wasteCategories: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    isOffline: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    }
}, {
    indexes: [
        {
            fields: ['location']
        },
        {
            fields: ['status']
        },
        {
            fields: ['userId']
        }
    ]
});

module.exports = Report;