const { Report, User, EcoAction, RecyclingCenter, sequelize } = require('../models');
const { Op, Sequelize, where } = require('sequelize');

exports.getDashboardStats = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Statistiques principales
        const totalUsers = await User.count();
        const totalReports = await Report.count();
        const activeReports = await Report.count({ where: { status: { [Op.in]: ['pending', 'in_progress'] } } }); // Corrigé "Reports" en "Report"
        const totalEcoPoints = await User.sum('ecoPoints');

        // Evolution des signalements sur 30 jours
        const reportsTrend = await Report.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                createdAt: { [Op.gte]: thirtyDaysAgo }
            },
            group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
            order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
        });

        // Top utilisateurs
        const topUsers = await User.findAll({
            attributes: ['id', 'firstName', 'lastName', 'ecoPoints', 'level'],
            order: [['ecoPoints', 'DESC']],
            limit: 10
        });

        // Distribution géographique des signalements
        const reportsByZone = await Report.findAll({
            attributes: [
                'location',
                'type',
                'severity'
            ],
            where: {
                createdAt: { [Op.gte]: thirtyDaysAgo }
            },
            limit: 1000
        });

        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    totalReports,
                    activeReports,
                    totalEcoPoints
                },
                trends: {
                    reports: reportsTrend
                },
                topUsers,
                heatmapData: reportsByZone
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des statistiques du dashboard",
            error: error.message
        });
    }
};

exports.getOptimizationRoutes = async (req, res) => {
    try {
        const pendingReports = await Report.findAll({
            where: { status: 'pending' },
            attributes: ['id', 'location', 'type', 'severity', 'estimatedWasteVolume'],
            order: [['severity', 'DESC'], ['createdAt', 'ASC']]
        });

        // Simulation d'optimisation d'itinéraire
        const optimizedRoutes = optimizeCollectionRoutes(pendingReports);

        res.json({
            success: true,
            data: {
                pendingReports: pendingReports.length,
                optimizedRoutes,
                estimatedTime: calculateEstimatedTime(optimizedRoutes),
                totalWasteVolume: pendingReports.reduce((sum, report) => sum + (report.estimatedWasteVolume || 0), 0)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de l'optimisation des itinéraires",
            error: error.message
        });
    }
};

// Fonction simplifiée d'optimisation d'itinéraire
function optimizeCollectionRoutes(reports) {
    // Implémentation basique - à remplacer par un algorithme plus sophistiqué
    return reports
        .sort((a, b) => {
            // Priorité par sévérité puis par proximité géographique
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        })
        .slice(0, 10); // Limite à 10 points pour un itinéraire
}

function calculateEstimatedTime(routes) {
    // Estimation basique : 15 minutes par point + temps de déplacement
    return routes.length * 15;
}