const jwt = require('jsonwebtoken');
const { User, EcoAction } = require('../models');
const { Op } = require('sequelize');
const { sendWelcomeEmail, sendLoginNotificationEmail } = require('../config/email');

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

exports.register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, address, role } = req.body; 
        
        // Validation des champs requis
        if (!email || !password || !firstName || !lastName || !address) {
            return res.status(400).json({
                success: false,
                message: "Tous les champs obligatoires doivent être remplis"
            });
        }

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

        // Envoyer l'email de bienvenue (ne pas bloquer l'inscription si échec)
        try {
            await sendWelcomeEmail(user);
            console.log('✅ Email de bienvenue envoyé à:', user.email);
        } catch (emailError) {
            console.error('❌ Erreur envoi email bienvenue:', emailError.message);
            // On continue même si l'email échoue
        }

        res.status(201).json({
            success: true,
            message: "Utilisateur créé avec succès. Un email de bienvenue a été envoyé.",
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
        console.error('❌ Erreur inscription:', error);
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

        // Validation des champs
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email et mot de passe sont requis"
            });
        }

        const user = await User.findOne({ where: { email } });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                success: false,
                message: "Email ou mot de passe incorrect"
            });
        }

        const token = generateToken(user.id);

        // Envoyer l'email de notification de connexion
        try {
            await sendLoginNotificationEmail(user, {
                timestamp: new Date(),
                userAgent: req.get('User-Agent')
            });
            console.log('✅ Email de connexion envoyé à:', user.email);
        } catch (emailError) {
            console.error('❌ Erreur envoi email connexion:', emailError.message);
            // On continue même si l'email échoue
        }

        res.json({
            success: true,
            message: "Connexion réussie. Une notification a été envoyée par email.",
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
        console.error('❌ Erreur connexion:', error);
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
        console.error('❌ Erreur récupération profil:', error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération du profil",
            error: error.message
        });
    }
};