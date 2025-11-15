const { EcoAction, User, Report, CleaningEvent, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getUserEcoActions = async (req, res) => {
    try {
        const { page = 1, limit = 20, type, startDate, endDate } = req.query;
        const whereClause = { userId: req.user.id }; 

        if (type) whereClause.type = type;
        
        if (startDate || endDate) {
            whereClause.createdAt = {};
            if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
            if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
        }

        const offset = (page - 1) * limit;

        const { count, rows: ecoActions } = await EcoAction.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Report,
                    as: 'report',
                    attributes: ['id', 'type', 'status'],
                    required: false
                },
                {
                    model: CleaningEvent,
                    as: 'cleaningEvent',
                    attributes: ['id', 'title', 'status'],
                    required: false
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        const totalPoints = await EcoAction.sum('points', {
            where: { userId: req.user.id }
        });

        res.json({
            success: true,
            data: {
                ecoActions,
                summary: {
                    totalPoints,
                    totalActions: count
                },
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
            message: "Erreur lors de la récupération des actions écologiques",
            error: error.message
        });
    }
};

exports.getAllEcoActions = async (req, res) => {
    try {
        const { page = 1, limit = 50, userId, type, startDate, endDate } = req.query;
        const whereClause = {}; 

        if (userId) whereClause.userId = userId;
        if (type) whereClause.type = type;

        if (startDate || endDate) {
            whereClause.createdAt = {};
            if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
            if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
        }

        const offset = (page - 1) * limit;

        const { count, rows: ecoActions } = await EcoAction.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                },
                {
                    model: Report,
                    as: 'report',
                    attributes: ['id', 'type', 'status'],
                    required: false
                },
                {
                    model: CleaningEvent,
                    as: 'cleaningEvent',
                    attributes: ['id', 'title', 'status'],
                    required: false
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: {
                ecoActions,
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
            message: "Erreur lors de la récupération de toutes les actions écologiques",
            error: error.message
        });
    }
};

exports.getEcoActionById = async (req, res) => {
    try {
        const { id } = req.params;

        const ecoAction = await EcoAction.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'ecoPoints']
                },
                {
                    model: Report,
                    as: 'report',
                    attributes: ['id', 'type', 'description', 'status', 'severity'],
                    required: false
                },
                {
                    model: CleaningEvent,
                    as: 'cleaningEvent',
                    attributes: ['id', 'title', 'description', 'status', 'date'],
                    required: false
                }
            ]
        });

        if (!ecoAction) {
            return res.status(404).json({
                success: false,
                message: "Action écologique non trouvée"
            });
        }

        res.json({
            success: true,
            data: { ecoAction }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération de l'action écologique",
            error: error.message
        });
    }
};

exports.createEcoAction = async (req, res) => {
    try {
        const { userId, type, points, description, metadata, reportId, eventId } = req.body;

        // Vérifier que l'utilisateur existe
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Utilisateur non trouvé"
            });
        }

        const ecoAction = await EcoAction.create({
            userId,
            type,
            points,
            description,
            metadata: metadata || {},
            reportId: reportId || null,
            eventId: eventId || null
        });

        // Mettre à jour les points de l'utilisateur
        await user.increment('ecoPoints', { by: points });

        res.status(201).json({
            success: true,
            message: "Action écologique créée avec succès",
            data: { ecoAction }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la création de l'action écologique",
            error: error.message
        });
    }
};

exports.getEcoActionsStats = async (req, res) => {
    try {
        const { userId, startDate, endDate } = req.query;
        const whereClause = {};

        if (userId) whereClause.userId = userId;

        if (startDate || endDate) {
            whereClause.createdAt = {};
            if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
            if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
        }

        // Statistiques par type d'action
        const statsByType = await EcoAction.findAll({
            where: whereClause,
            attributes: [
                'type',
                [sequelize.fn('COUNT', sequelize.col('id')), 'actionCount'],
                [sequelize.fn('SUM', sequelize.col('points')), 'totalPoints']
            ],
            group: ['type']
        });

        // Points totaux
        const totalPoints = await EcoAction.sum('points', { where: whereClause });

        // Nombre total d'actions
        const totalActions = await EcoAction.count({ where: whereClause });

        // Top utilisateurs - APPROCHE AVEC SOUS-REQUÊTE
        const topUsers = await sequelize.query(`
            SELECT 
                u.id,
                u."firstName",
                u."lastName",
                u.email,
                COUNT(ea.id) as "actionCount",
                SUM(ea.points) as "totalPoints"
            FROM "EcoActions" ea
            INNER JOIN "Users" u ON ea."userId" = u.id
            ${userId ? `WHERE ea."userId" = '${userId}'` : ''}
            ${startDate || endDate ? `${userId ? 'AND' : 'WHERE'} ea."createdAt" BETWEEN '${startDate || '1970-01-01'}' AND '${endDate || new Date().toISOString()}'` : ''}
            GROUP BY u.id, u."firstName", u."lastName", u.email
            ORDER BY "totalPoints" DESC
            LIMIT 10
        `, {
            type: sequelize.QueryTypes.SELECT
        });

        // Evolution mensuelle
        const monthlyStats = await EcoAction.findAll({
            where: whereClause,
            attributes: [
                [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'actionCount'],
                [sequelize.fn('SUM', sequelize.col('points')), 'totalPoints']
            ],
            group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt'))],
            order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'ASC']],
            raw: true
        });

        res.json({
            success: true,
            data: {
                summary: {
                    totalPoints: totalPoints || 0,
                    totalActions
                },
                byType: statsByType,
                topUsers,
                monthlyTrend: monthlyStats
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

exports.getUserRanking = async (req, res) => {
    try {
        const { limit = 20, period } = req.query;
        
        let dateCondition = '';
        if (period === 'month') {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            dateCondition = `WHERE ea."createdAt" >= '${startOfMonth.toISOString()}'`;
        } else if (period === 'week') {
            const startOfWeek = new Date();
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            dateCondition = `WHERE ea."createdAt" >= '${startOfWeek.toISOString()}'`;
        }

        const rankedUsers = await sequelize.query(`
            SELECT 
                ROW_NUMBER() OVER (ORDER BY SUM(ea.points) DESC) as rank,
                u.id as "userId",
                u."firstName",
                u."lastName",
                u.email,
                u.level,
                COUNT(ea.id) as "actionCount",
                SUM(ea.points) as "totalPoints"
            FROM "EcoActions" ea
            INNER JOIN "Users" u ON ea."userId" = u.id
            ${dateCondition}
            GROUP BY u.id, u."firstName", u."lastName", u.email, u.level
            ORDER BY "totalPoints" DESC
            LIMIT ${parseInt(limit)}
        `, {
            type: sequelize.QueryTypes.SELECT
        });

        res.json({
            success: true,
            data: { ranking: rankedUsers }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération du classement",
            error: error.message
        });
    }
};

exports.deleteEcoAction = async (req, res) => {
    try {
        const { id } = req.params;

        const ecoAction = await EcoAction.findByPk(id);

        if (!ecoAction) {
            return res.status(404).json({
                success: false,
                message: "Action écologique non trouvée"
            });
        }

        // Retirer les points de l'utilisateur 
        const user = await User.findByPk(ecoAction.userId);
        if (user) {
            await user.decrement('ecoPoints', { by: ecoAction.points });
        }

        await ecoAction.destroy();

        res.json({
            success: true,
            message: "Action écologique supprimée avec succès"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la suppression de l'action écologique",
            error: error.message
        });
    }
};