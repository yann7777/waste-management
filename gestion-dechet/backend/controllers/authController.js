const jwt = require('jsonwebtoken');
const { User, EcoAction } = require('../models');
const { Op, where } = require('sequelize');

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

exports.register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, address, role } = req.body; 
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Un utilisateur avec cet email existe déjà"
            });
        }

        const user = await User.create({
            email,
            password,
            firstName,
            lastName,
            address,
            role: role || 'citizen'
        });

        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            message: "Utilisateur créé avec succès.",
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    ecoPoints: user.ecoPoints
                },
                token
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la création de l'utilisateur",
            error: error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                success: false,
                message: "Email ou mot de passe incorrect"
            });
        }

        const token = generateToken(user.id);

        res.json({
            success: true,
            message: "Connexion réussie",
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    ecoPoints: user.ecoPoints,
                    level: user.level
                },
                token
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la connexion",
            error: error.message
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });

        const recentActions = await EcoAction.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        res.json({
            success: true,
            data: {
                user,
                recentActions
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération du profil",
            error: error.message
        });
    }
};