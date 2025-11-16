const { Report, User, EcoAction } = require('../models');
const cloudinary = require('../config/cloudinary');
const { Op } = require('sequelize');
const fs = require('fs');
const sequelize = require('../config/database');

exports.createReport = async (req, res) => {
    try {
        const { type, description, location, severity, wasteCategories, estimatedWasteVolume, isOffline } = req.body;
        const photos = [];
        
        // Upload des photos vers Cloudinary
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => 
                cloudinary.uploader.upload(file.path, {
                    folder: "waste-reports"
                })
            );
            const uploadResults = await Promise.all(uploadPromises);
            photos.push(...uploadResults.map(result => result.secure_url));
            
            // Nettoyer les fichiers temporaires
            req.files.forEach(file => {
                try {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                } catch (cleanupError) {
                    console.error('Erreur lors du nettoyage du fichier:', cleanupError);
                }
            });
        }

        // Validation des champs obligatoires
        if (!type || !location) {
            return res.status(400).json({
                success: false,
                message: "Les champs 'type' et 'location' sont obligatoires"
            });
        }

        // Parse location si c'est une string
        let locationData;
        try {
            locationData = typeof location === 'string' ? JSON.parse(location) : location;
        } catch (parseError) {
            return res.status(400).json({
                success: false,
                message: "Format de location invalide"
            });
        }

        // Parse wasteCategories si c'est une string
        let wasteCategoriesData = [];
        try {
            if (wasteCategories) {
                wasteCategoriesData = typeof wasteCategories === 'string' 
                    ? JSON.parse(wasteCategories) 
                    : wasteCategories;
                
                // S'assurer que c'est un tableau
                if (!Array.isArray(wasteCategoriesData)) {
                    wasteCategoriesData = [];
                }
            }
        } catch (parseError) {
            console.warn('Format de wasteCategories invalide, utilisation d\'un tableau vide');
            wasteCategoriesData = [];
        }

        const report = await Report.create({
            type,
            description: description || null,
            location: locationData,
            photos,
            severity: severity || 'medium',
            wasteCategories: wasteCategoriesData,
            estimatedWasteVolume: estimatedWasteVolume || null,
            isOffline: isOffline || false,
            userId: req.user.id
        });

        // Attribution de points écologiques
        let points = 0;
        const currentSeverity = severity || 'medium';
        switch (currentSeverity) {
            case 'critical': points = 50; break;
            case 'high': points = 30; break;
            case 'medium': points = 20; break;
            case 'low': points = 10; break;
            default: points = 20;
        }

        await EcoAction.create({
            userId: req.user.id,
            type: 'report',
            points,
            description: `Signalement de dépôt sauvage - ${type}`,
            metadata: { reportId: report.id, severity: currentSeverity },
            reportId: report.id
        });

        // Mise à jour des points de l'utilisateur
        await User.increment('ecoPoints', {
            by: points,
            where: { id: req.user.id }
        });

        res.status(201).json({
            success: true,
            message: "Signalement créé avec succès",
            data: { 
                report: {
                    id: report.id,
                    type: report.type,
                    status: report.status,
                    severity: report.severity
                }, 
                pointsEarned: points 
            }
        });
    } catch (error) {
        // Nettoyer les fichiers en cas d'erreur
        if (req.files) {
            req.files.forEach(file => {
                try {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                } catch (cleanupError) {
                    console.error('Erreur lors du nettoyage du fichier:', cleanupError);
                }
            });
        }
        
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
                as: 'user',
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

exports.getReportById = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await Report.findByPk(id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'email']
            }]
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Signalement non trouvé"
            });
        }

        res.json({
            success: true,
            data: { report }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération du signalement",
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

exports.updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, description, location, severity, wasteCategories, estimatedWasteVolume, isOffline } = req.body;

        const report = await Report.findByPk(id);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Signalement non trouvé"
            });
        }

        // Parse location si c'est une string
        let locationData = report.location;
        if (location) {
            try {
                locationData = typeof location === 'string' ? JSON.parse(location) : location;
            } catch (parseError) {
                return res.status(400).json({
                    success: false,
                    message: "Format de location invalide"
                });
            }
        }

        // Parse wasteCategories si c'est une string
        let wasteCategoriesData = report.wasteCategories;
        if (wasteCategories) {
            try {
                wasteCategoriesData = typeof wasteCategories === 'string' 
                    ? JSON.parse(wasteCategories) 
                    : wasteCategories;
                
                if (!Array.isArray(wasteCategoriesData)) {
                    wasteCategoriesData = report.wasteCategories;
                }
            } catch (parseError) {
                console.warn('Format de wasteCategories invalide, conservation de la valeur précédente');
            }
        }

        await report.update({
            type: type || report.type,
            description: description !== undefined ? description : report.description,
            location: locationData,
            severity: severity || report.severity,
            wasteCategories: wasteCategoriesData,
            estimatedWasteVolume: estimatedWasteVolume !== undefined ? estimatedWasteVolume : report.estimatedWasteVolume,
            isOffline: isOffline !== undefined ? isOffline : report.isOffline
        });

        res.json({
            success: true,
            message: "Signalement mis à jour avec succès",
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

exports.deleteReport = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await Report.findByPk(id);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Signalement non trouvé"
            });
        }

        await report.destroy();

        res.json({
            success: true,
            message: "Signalement supprimé avec succès"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la suppression du signalement",
            error: error.message
        });
    }
};

exports.getReportStats = async (req, res) => {
    try {
        const totalReports = await Report.count();
        const pendingReports = await Report.count({ where: { status: 'pending' } });
        const resolvedReports = await Report.count({ where: { status: 'resolved' } });
        const inProgressReports = await Report.count({ where: { status: 'in_progress' } });

        const reportsByType = await Report.findAll({
            attributes: [
                'type',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['type']
        });

        const reportsBySeverity = await Report.findAll({
            attributes: [
                'severity', 
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['severity']
        });

        // Statistiques mensuelles
        const monthlyStats = await Report.findAll({
            attributes: [
                [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt'))],
            order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'ASC']],
            limit: 12
        });

        res.json({
            success: true,
            data: {
                totalReports,
                pendingReports,
                resolvedReports,
                inProgressReports,
                reportsByType,
                reportsBySeverity,
                monthlyStats
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

exports.getUserReports = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows: reports } = await Report.findAndCountAll({
            where: { userId: req.user.id },
            include: [{
                model: User,
                as: 'user',
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
            message: "Erreur lors de la récupération de vos signalements",
            error: error.message
        });
    }
};

exports.addReportPhotos = async (req, res) => {
    try {
        const { id } = req.params;
        const newPhotos = [];

        const report = await Report.findByPk(id);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Signalement non trouvé"
            });
        }

        // Upload des nouvelles photos vers Cloudinary
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => 
                cloudinary.uploader.upload(file.path, {
                    folder: "waste-reports"
                })
            );
            const uploadResults = await Promise.all(uploadPromises);
            newPhotos.push(...uploadResults.map(result => result.secure_url));
            
            // Nettoyer les fichiers temporaires
            req.files.forEach(file => {
                try {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                } catch (cleanupError) {
                    console.error('Erreur lors du nettoyage du fichier:', cleanupError);
                }
            });
        }

        // Mettre à jour les photos du rapport
        const updatedPhotos = [...report.photos, ...newPhotos];
        await report.update({ photos: updatedPhotos });

        res.json({
            success: true,
            message: "Photos ajoutées avec succès",
            data: { 
                report: {
                    id: report.id,
                    photos: updatedPhotos
                } 
            }
        });
    } catch (error) {
        // Nettoyer les fichiers en cas d'erreur
        if (req.files) {
            req.files.forEach(file => {
                try {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                } catch (cleanupError) {
                    console.error('Erreur lors du nettoyage du fichier:', cleanupError);
                }
            });
        }
        
        res.status(500).json({
            success: false,
            message: "Erreur lors de l'ajout des photos",
            error: error.message
        });
    }
};