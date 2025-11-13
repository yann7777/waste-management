const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RecyclingCenter = sequelize.define('RecyclingCenter', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.JSONB,
        allowNull: false
    },
    location: {
        type: DataTypes.JSONB,
        allowNull: false
    },
    acceptedMaterials: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    openingHours: {
        type: DataTypes.JSONB,
        allowNull: false
    },
    contact: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    currentOccupancy: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    }
});

module.exports = RecyclingCenter;