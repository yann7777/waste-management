const { Notification } = require('../models');
const { Op } = require('sequelize');

exports.getUserNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly } = req.query;
        const whereClause = { userId: req.user.id };

        if (unreadOnly === "true") {
            whereClause.isRead = false;
        }

        const offset = (page - 1) * limit;

        const { count, rows: notifications } = await Notification.findAndCountAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: {
                notifications,
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
            message: "Erreur lors de la récupération des notifications",
            error: error.message
        });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOne({
            where: { id, userId: req.user.id }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification non trouvée"
            });
        }

        await notification.update({ isRead: true });

        res.json({
            success: true,
            message: "Notification marquée comme lue"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors du marquage de la notification",
            error: error.message
        });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.update(
            { isRead: true },
            {
                where: {
                    userId: req.user.id,
                    isRead: false
                }
            }
        );

        res.json({
            success: true,
            message: "Toutes les notifications marquées comme lues"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors du marquage des notifications",
            error: error.message
        });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.count({
            where: {
                userId: req.user.id,
                isRead: false
            }
        });

        res.json({
            success: true,
            data: { unreadCount: count }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors du comptage des notifications non lues",
            error: error.message
        });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOne({
            where: { id, userId: req.user.id }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification non trouvée"
            });
        }

        await notification.destroy();

        res.json({
            success: true,
            message: "Notification supprimée"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la suppression de la notification",
            error: error.message
        });
    }
};

exports.createNotification = async (req, res) => {
    try {
        const { userId, title, message, type, actionUrl, metadata, relatedReportId, relatedEventId } = req.body;

        // Vérifier les permissions (seuls les admins ou workers peuvent créer des notifications)
        if (req.user.role === "citizen") {
            return res.status(403).json({
                success: false,
                message: "Non autorisé à créer des notifications"
            });
        }

        const notification = await Notification.create({
            userId,
            title,
            message,
            type: type || "info",
            actionUrl,
            metadata: metadata || {},
            relatedReportId: relatedReportId || null,
            relatedEventId: relatedEventId || null
        });

        res.status(201).json({
            success: true,
            message: "Notification créée avec succès",
            data: { notification }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la création de la notification",
            error: error.message
        });
    }
};