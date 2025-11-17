const { CollectionSchedule, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.createSchedule = async (req, res) => {
    try {
        const { zone, wasteType, schedule, nextCollection, frequency } = req.body;

        // Vérifier si un planning existe déjà pour cette zone et type de déchet
        const existingSchedule = await CollectionSchedule.findOne({
            where: { zone, wasteType }
        });

        if (existingSchedule) {
            return res.status(400).json({
                success: false,
                message: "Un planning existe déjà pour cette zone et ce type de déchet"
            });
        }

        const collectionSchedule = await CollectionSchedule.create({
            zone,
            wasteType,
            schedule,
            nextCollection: new Date(nextCollection),
            frequency
        });

        res.status(201).json({
            success: true,
            message: "Planning de collecte créé avec succès",
            data: { schedule: collectionSchedule }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la création du planning",
            error: error.message
        });
    }
};

exports.getAllSchedules = async (req, res) => {
    try {
        const { zone, wasteType, page = 1, limit = 10 } = req.query;
        const whereClause = {};

        if (zone) whereClause.zone = zone;
        if (wasteType) whereClause.wasteType = wasteType;

        const offset = (page - 1) * limit;

        const { count, rows: schedules } = await CollectionSchedule.findAndCountAll({
            where: whereClause,
            order: [['zone', 'ASC'], ['wasteType', 'ASC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: {
                schedules,
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
            message: "Erreur lors de la récupération des plannings",
            error: error.message
        });
    }
};

exports.getScheduleById = async (req, res) => {
    try {
        const { id } = req.params;

        const schedule = await CollectionSchedule.findByPk(id);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "Planning non trouvé"
            });
        }

        res.json({
            success: true,
            data: { schedule }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération du planning",
            error: error.message
        });
    }
};

exports.getSchedulesByZone = async (req, res) => {
    try {
        const { zone } = req.params;

        const schedules = await CollectionSchedule.findAll({
            where: { zone },
            order: [['wasteType', 'ASC']]
        });

        res.json({
            success: true,
            data: { schedules }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des plannings par zone",
            error: error.message
        });
    }
};

exports.getUpcomingCollections = async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + parseInt(days));

        const upcomingCollections = await CollectionSchedule.findAll({
            where: {
                nextCollection: {
                    [Op.between]: [new Date(), targetDate]
                }
            },
            order: [['nextCollection', 'ASC']]
        });

        res.json({
            success: true,
            data: { upcomingCollections }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des collectes à venir",
            error: error.message
        });
    }
};

exports.updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const { zone, wasteType, schedule, nextCollection, frequency } = req.body;

        const collectionSchedule = await CollectionSchedule.findByPk(id);

        if (!collectionSchedule) {
            return res.status(404).json({
                success: false,
                message: "Planning non trouvé"
            });
        }

        await collectionSchedule.update({
            zone: zone || collectionSchedule.zone,
            wasteType: wasteType || collectionSchedule.wasteType,
            schedule: schedule || collectionSchedule.schedule,
            nextCollection: nextCollection ? new Date(nextCollection) : collectionSchedule.nextCollection,
            frequency: frequency || collectionSchedule.frequency,
        });

        res.json({
            success: true,
            message: "Planning mis à jour avec succès",
            data: { schedule: collectionSchedule }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la mise à jour du planning",
            error: error.message
        });
    }
};

exports.deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;

        const schedule = await CollectionSchedule.findByPk(id);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "Planning non trouvé", // Virgule en trop supprimée
            });
        }

        await schedule.destroy();

        res.json({
            success: true,
            message: "Planning supprimé avec succès"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la suppression du planning",
            error: error.message
        });
    }
};

exports.calculateNextCollection = async (req, res) => {
    try {
        const { id } = req.params;

        const schedule = await CollectionSchedule.findByPk(id);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "Planning non trouvé"
            });
        }

        const nextCollection = calculateNextCollectionDate(schedule);
        
        await schedule.update({ nextCollection });

        res.json({
            success: true,
            message: "Prochaine collecte calculée avec succès",
            data: { nextCollection }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors du calcul de la prochaine collecte",
            error: error.message
        });
    }
};

exports.getCollectionStats = async (req, res) => {
    try {
        const stats = await CollectionSchedule.findAll({
            attributes: [
                'wasteType',
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalSchedules'],
                [sequelize.fn('MIN', sequelize.col('nextCollection')), 'nextCollection']
            ],
            group: ["wasteType"]
        });

        const zones = await CollectionSchedule.findAll({
            attributes: [
                'zone',
                [sequelize.fn('COUNT', sequelize.col('id')), 'scheduleCount'],
            ],
            group: ['zone']
        });

        res.json({
            success: true,
            data: {
                byWasteType: stats,
                byZone: zones
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

// Fonction utilitaire pour calculer la prochaine date de collecte
function calculateNextCollectionDate(schedule) {
    const nextDate = new Date(schedule.nextCollection);

    switch (schedule.frequency) {
        case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 'biweekly':
            nextDate.setDate(nextDate.getDate() + 14);
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
    }

    return nextDate;
}

// Dans CollectionScheduleController.js
exports.getWorkerSchedules = async (req, res) => {
    try {
        const { zone } = req.query;
        const whereClause = {};

        // Si le worker a une zone assignée, filtrer par cette zone
        if (zone) {
            whereClause.zone = zone;
        }

        const schedules = await CollectionSchedule.findAll({
            where: whereClause,
            order: [['zone', 'ASC'], ['wasteType', 'ASC']]
        });

        res.json({
            success: true,
            data: { schedules }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des plannings worker",
            error: error.message
        });
    }
};