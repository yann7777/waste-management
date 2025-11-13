const { CleaningEvent, User, EcoAction, Notification } = require('../models');
const { Op } = require('sequelize');

exports.createEvent = async (req, res) => {
    try {
        const { title, description, location, date, duration, maxParticipants, ecoPointsReward } = req.body;

        const event = await CleaningEvent.create({
            title,
            description,
            location,
            date: new Date(date),
            duration,
            maxParticipants,
            ecoPointsReward: ecoPointsReward || 50,
            organizerId: req.user.id
        });

        // Notification aux utilisateurs à proximité
        await notifyNearbyUsers(event);

        res.status(201).json({
            success: true,
            message: "Événement de nettoyage créé avec succès",
            data: { event }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la création de l'événement",
            error: error.message
        });
    }
};

exports.getAllEvents = async (req, res) => {
    try {
        const { status, page = 1, limit = 10, upcoming } = req.query;
        const whereClause = {};

        if (status) whereClause.status = status;

        if (upcoming === "true") {
            whereClause.date = { [Op.gte]: new Date() };
        }

        const offset = (page - 1) * limit;

        const { count, rows: events } = await CleaningEvent.findAndCountAll({
            where: whereClause,
            include: [{
                model: User,
                as: 'organizer',
                attributes: ['id', 'firstName', 'lastName', 'email']
            }, {
                model: User,
                as: 'participants',
                attributes: ['id', 'firstName', 'lastName'],
                through: { attributes: [] }
            }],
            order: [['date', 'ASC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: {
                events,
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
            message: "Erreur lors de la récupération des événements",
            error: error.message
        });
    }
};

exports.getEventById = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await CleaningEvent.findByPk(id, {
            include: [{
                model: User,
                as: 'organizer',
                attributes: ['id', 'firstName', 'lastName', 'email', 'ecoPoints']
            }, {
                model: User,
                as: 'participants',
                attributes: ['id', 'firstName', 'lastName', 'ecoPoints'],
                through: { attributes: [] }
            }]
        });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Événement non trouvé"
            });
        }

        res.json({
            success: true,
            data: { event }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération de l'événement",
            error: error.message
        });
    }
};

exports.joinEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await CleaningEvent.findByPk(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Événement non trouvé"
            });
        }

        // Vérifier si l'événement est complet
        const participantCount = await event.countParticipants();
        if (event.maxParticipants && participantCount >= event.maxParticipants) {
            return res.status(400).json({
                success: false,
                message: "L'événement est complet"
            });
        }

        // Vérifier si l'utilisateur est déjà inscrit
        const isAlreadyJoined = await event.hasParticipant(req.user.id);
        if (isAlreadyJoined) {
            return res.status(400).json({
                success: false,
                message: "Vous êtes déjà inscrit à cet événement"
            });
        }

        await event.addParticipant(req.user.id);

        res.json({
            success: true,
            message: "Inscription à l'événement réussie"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de l'inscription à l'événement",
            error: error.message
        });
    }
};

exports.leaveEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await CleaningEvent.findByPk(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Événement non trouvé"
            });
        }

        await event.removeParticipant(req.user.id);

        res.json({
            success: true,
            message: "Désinscription de l'événement réussie"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la désinscription",
            error: error.message
        });
    }
};

exports.updateEventStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const event = await CleaningEvent.findByPk(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Événement non trouvé"
            });
        }

        // Vérifier que seul l'organisateur ou un admin peut modifier
        if (event.organizerId !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Seul l'organisateur peut modifier cet événement"
            });
        }

        await event.update({ status });

        // Si l'événement est marqué terminé, attribuer les points
        if (status === "completed") {
            await distributeEcoPoints(event);
        }

        res.json({
            success: true,
            message: "Statut de l'événement mis à jour",
            data: { event }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la mise à jour du statut",
            error: error.message
        });
    }
};

exports.getUserEvents = async (req, res) => {
    try {
        const { type = "upcoming" } = req.query;
        const whereClause = {}; // Renommé pour éviter les conflits

        if (type === "upcoming") {
            whereClause.date = { [Op.gte]: new Date() };
        } else if (type === "past") {
            whereClause.date = { [Op.lt]: new Date() };
        }

        const events = await CleaningEvent.findAll({
            where: whereClause,
            include: [{
                model: User,
                as: "participants",
                where: { id: req.user.id },
                attributes: [],
                through: { attributes: [] }
            }],
            order: [['date', type === "upcoming" ? "ASC" : "DESC"]]
        });

        res.json({
            success: true,
            data: { events }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des événements utilisateur",
            error: error.message
        });
    }
};

// Fonctions utilitaires
async function notifyNearbyUsers(event) {
    // Implémentation simplifiée - notifier tous les utilisateurs
    // Dans une vraie application, on utiliserait la géolocalisation

    try {
        const users = await User.findAll({
            where: { role: 'citizen' },
            limit: 100
        });

        for (const user of users) {
            await Notification.create({
                userId: user.id,
                title: "Nouvel événement de nettoyage",
                message: `Un nouvel événement "${event.title}" a été créé près de chez vous`,
                type: "info",
                actionUrl: `/events/${event.id}`,
                metadata: { eventId: event.id }
            });
        }
    } catch (error) {
        console.error("Erreur lors de la notification des utilisateurs:", error);
    }
}

async function distributeEcoPoints(event) {
    try {
        const participants = await event.getParticipants();

        for (const participant of participants) {
            // Attribuer les points écologiques
            await EcoAction.create({
                userId: participant.id,
                type: "cleaning",
                points: event.ecoPointsReward,
                description: `Participation à l'événement de nettoyage: ${event.title}`,
                metadata: { eventId: event.id },
                eventId: event.id
            });

            // Mettre à jour les points de l'utilisateur
            await participant.increment('ecoPoints', { by: event.ecoPointsReward });
        }
    } catch (error) {
        console.error("Erreur lors de la distribution des points:", error);
    }
}