const { ChatMessage, User } = require('../models');
const { Op } = require('sequelize');

exports.sendMessage = async (req, res) => {
    try {
        const { content, room, recipientId, messageType = "text", attachments = [] } = req.body;

        const message = await ChatMessage.create({
            content,
            room,
            recipientId,
            messageType,
            attachments,
            userId: req.user.id
        });

        // Populer les données de l'expéditeur pour la réponse
        const messageWithUser = await ChatMessage.findByPk(message.id, {
            include: [{
                model: User,
                attributes: ['id', 'firstName', 'lastName', 'role']
            }]
        });

        // Emettre l'événement Socket.io
        if (req.app.get('socketio')) {
            const io = req.app.get('socketio');
            io.to(room).emit('new_message', messageWithUser);
        }

        res.status(201).json({
            success: true,
            message: "Message envoyé avec succès",
            data: { message: messageWithUser }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de l'envoi du message",
            error: error.message
        });
    }
};

exports.getRoomMessages = async (req, res) => {
    try {
        const { room } = req.params;
        const { page = 1, limit = 50, before } = req.query;

        const whereClause = { room }; 

        if (before) {
            whereClause.createdAt = { [Op.lt]: new Date(before) };
        }

        const offset = (page - 1) * limit; 

        const { count, rows: messages } = await ChatMessage.findAndCountAll({
            where: whereClause,
            include: [{
                model: User,
                attributes: ['id', 'firstName', 'lastName', 'role']
            }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Marquer les messages comme lus si c'est le destinataire
        if (req.user.id) {
            await ChatMessage.update(
                { isRead: true },
                {
                    where: {
                        room,
                        recipientId: req.user.id, 
                        isRead: false
                    }
                }
            );
        }

        res.json({
            success: true,
            data: {
                messages: messages.reverse(), // Retourner dans l'ordre chronologique
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
            message: "Erreur lors de la récupération des messages",
            error: error.message
        });
    }
};

exports.getUserChats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Récupérer les salles de chat où l'utilisateur a participé
        const userRooms = await ChatMessage.findAll({
            where: {
                [Op.or]: [
                    { userId },
                    { recipientId: userId }
                ]
            },
            attributes: ['room'],
            group: ['room'],
            order: [['createdAt', 'DESC']]
        });

        // Pour chaque salle, récupérer le dernier message et les infos
        const chats = await Promise.all(
            userRooms.map(async (roomObj) => {
                const lastMessage = await ChatMessage.findOne({
                    where: { room: roomObj.room },
                    include: [{
                        model: User,
                        attributes: ['id', 'firstName', 'lastName']
                    }],
                    order: [['createdAt', 'DESC']]
                });

                // Compter les messages non lus
                const unreadCount = await ChatMessage.count({
                    where: {
                        room: roomObj.room,
                        recipientId: userId,
                        isRead: false
                    }
                });

                return {
                    room: roomObj.room,
                    lastMessage,
                    unreadCount,
                    updatedAt: lastMessage?.createdAt
                };
            })
        );

        // Trier par date de dernier message
        chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        res.json({
            success: true,
            data: { chats }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des discussions",
            error: error.message
        });
    }
};

exports.markMessagesAsRead = async (req, res) => {
    try {
        const { room } = req.params;

        await ChatMessage.update(
            { isRead: true },
            {
                where: {
                    room,
                    recipientId: req.user.id,
                    isRead: false
                }
            }
        );

        res.json({
            success: true,
            message: "Messages marqués comme lus"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors du marquage des messages",
            error: error.message
        });
    }
};

exports.deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;

        const message = await ChatMessage.findOne({
            where: { id, userId: req.user.id }
        });

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message non trouvé"
            });
        }

        await message.destroy();

        // Notifier les autres utilisateurs de la suppression
        if (req.app.get('socketio')) {
            const io = req.app.get('socketio');
            io.to(message.room).emit('message_deleted', { messageId: id });
        }

        res.json({
            success: true,
            message: "Message supprimé"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la suppression du message",
            error: error.message
        });
    }
};

exports.getUnreadMessagesCount = async (req, res) => {
    try {
        const count = await ChatMessage.count({
            where: {
                recipientId: req.user.id,
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
            message: "Erreur lors du comptage des messages non lus",
            error: error.message
        });
    }
};