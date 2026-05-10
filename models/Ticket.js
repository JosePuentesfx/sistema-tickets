const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ticket = sequelize.define('Ticket', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
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
    status: {
        type: DataTypes.ENUM('pendiente', 'resuelto'),
        defaultValue: 'pendiente'
    },
    priority: {
        type: DataTypes.ENUM('baja', 'media', 'alta'),
        defaultValue: 'media'
    },
    category: {
        type: DataTypes.ENUM('Hardware', 'Software', 'Redes', 'Accesos', 'Otro'),
        defaultValue: 'Otro'
    },
    assignedTo: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = Ticket;
