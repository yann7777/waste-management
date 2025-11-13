const { Report, User, EcoAction } = require('../models');
const cloudinary = require('../config/cloudinary');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

exports.createReport = async (req, res) => {
    try {
        const { type, description, location, severity, wasteCategories, estimatedWasteVolume, isOffline } = req.body;
        const photos = [];
        
        // Uploader des photos vers Cloudinary
        if (req.files && req.files.photos) {
            const uploadPromises = req.files.photos.map(file => 
                cloudinary.uploader.upload(file.path, {
                    folder: "waste-reports"
                })
            );
            const uploadResults = await Promise.all(uploadPromises);
            photos.push(...uploadResults.map(result => result.secure_url));
        }

        const report = await Report.create({
            type,
            description,
            location,
            photos,
            severity,
            wasteCategories,
            estimatedWasteVolume,
            isOffline: isOffline || false,
            userId: req.user.id
        });

        // Attribution de points écologiques
        let points = 0;
        switch (severity) {
            case 'critical': points = 50; break;
            case 'high': points = 30; break;
            case 'medium': points = 20; break;
            case 'low': points = 10; break;
        }

        await EcoAction.create({
            userId: req.user.id,
            type: 'report',
            points,
            description: `Signalement de dépôt sauvage - ${type}`,
            metadata: { reportId: report.id, severity }
        });

        // Mise à jour des points de l'utilisateur
        await User.increment('ecoPoints', {
            by: points,
            where: { id: req.user.id }
        });

        // Mise à jour du niveau utilisateur basé sur les points
        const user = await User.findByPk(req.user.id);
        const newLevel = Math.floor(user.ecoPoints / 190) + 1;
        if (newLevel > user.level) {
            await user.update({ level: newLevel });
        }

        res.status(201).json({
            success: true,
            message: "Signalement créé avec succès",
            data: { report, pointsEarned: points }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la création du signalement",
            error: error.message
        });
    }
};

exports.getReports = async (req, res) => {
    try {
        const { status, type, severity, page = 1, limit = 10 } = req.query;
        const whereClause = {}; 

        if (status) whereClause.status = status;
        if (type) whereClause.type = type;
        if (severity) whereClause.severity = severity;

        const offset = (page - 1) * limit;

        const { count, rows: reports } = await Report.findAndCountAll({
            where: whereClause,
            include: [{
                model: User,
                attributes: ['id', 'firstName', 'lastName', 'email']
            }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: {
                reports,
                pagination: {
                    current: parseInt(page),
                    total: Math.ceil(count / limit),
                    count
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des signalements",
            error: error.message
        });
    }
};

exports.updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolutionNotes } = req.body;

        const report = await Report.findByPk(id);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Signalement non trouvé"
            });
        }

        await report.update({
            status,
            resolutionNotes: resolutionNotes || report.resolutionNotes
        });

        res.json({
            success: true,
            message: "Statut du signalement mis à jour",
            data: { report }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la mise à jour du signalement",
            error: error.message
        });
    }
};

exports.getReportStats = async (req, res) => {
    try {
        const totalReports = await Report.count();
        const pendingReports = await Report.count({ where: { status: 'pending' } });
        const resolvedReports = await Report.count({ where: { status: 'resolved' } });

        const reportsByType = await Report.findAll({
            attributes: [
                'type',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['type']
        });

        const reportsBySeverity = await Report.findAll({
            attributes: [
                'severity', // Corrigé : 'saverity' -> 'severity'
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['severity']
        });

        res.json({
            success: true,
            data: {
                totalReports,
                pendingReports,
                resolvedReports,
                reportsByType,
                reportsBySeverity
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des statistiques",
            error: error.message
        });
    }
};