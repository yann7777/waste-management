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
            senderId: req.user.id
        });

        // Populer les données de l'expéditeur pour la réponse
        const messageWithUser = await ChatMessage.findByPk(message.id, {
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'firstName', 'lastName', 'role']
                },
                {
                    model: User,
                    as: 'recipient',
                    attributes: ['id', 'firstName', 'lastName', 'role']
                }
            ]
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
        console.error('Erreur sendMessage:', error);
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
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'firstName', 'lastName', 'role']
                },
                {
                    model: User,
                    as: 'recipient',
                    attributes: ['id', 'firstName', 'lastName', 'role']
                }
            ],
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
                messages: messages.reverse(),
                pagination: {
                    current: parseInt(page),
                    total: Math.ceil(count / limit),
                    count
                }
            }
        });
    } catch (error) {
        console.error('Erreur getRoomMessages:', error);
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
        console.log('Récupération des chats pour l\'utilisateur:', userId);

        // Récupérer les salles de chat uniques où l'utilisateur a participé
        const userRooms = await ChatMessage.findAll({
            where: {
                [Op.or]: [
                    { senderId: userId },
                    { recipientId: userId }
                ]
            },
            attributes: ['room'],
            group: ['room'],
            raw: true // Ajout de raw: true pour éviter les problèmes de sérialisation
        });

        console.log('Salles trouvées:', userRooms.length);

        // Pour chaque salle, récupérer le dernier message et les infos
        const chats = await Promise.all(
            userRooms.map(async (roomObj) => {
                try {
                    const lastMessage = await ChatMessage.findOne({
                        where: { room: roomObj.room },
                        include: [
                            {
                                model: User,
                                as: 'sender',
                                attributes: ['id', 'firstName', 'lastName', 'role']
                            },
                            {
                                model: User,
                                as: 'recipient',
                                attributes: ['id', 'firstName', 'lastName', 'role']
                            }
                        ],
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
                        lastMessage: lastMessage ? {
                            id: lastMessage.id,
                            content: lastMessage.content,
                            senderId: lastMessage.senderId,
                            recipientId: lastMessage.recipientId,
                            sender: lastMessage.sender,
                            recipient: lastMessage.recipient,
                            createdAt: lastMessage.createdAt,
                            isRead: lastMessage.isRead
                        } : null,
                        unreadCount,
                        updatedAt: lastMessage?.createdAt || new Date()
                    };
                } catch (error) {
                    console.error('Erreur lors du traitement de la salle:', roomObj.room, error);
                    return null;
                }
            })
        );

        // Filtrer les résultats null et trier par date de dernier message
        const validChats = chats.filter(chat => chat !== null);
        validChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        console.log('Chats retournés:', validChats.length);

        res.json({
            success: true,
            data: { chats: validChats }
        });
    } catch (error) {
        console.error('Erreur getUserChats:', error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des discussions",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
        console.error('Erreur markMessagesAsRead:', error);
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
            where: { 
                id, 
                senderId: req.user.id
            }
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
        console.error('Erreur deleteMessage:', error);
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
        console.error('Erreur getUnreadMessagesCount:', error);
        res.status(500).json({
            success: false,
            message: "Erreur lors du comptage des messages non lus",
            error: error.message
        });
    }
};

exports.createChat = async (req, res) => {
    try {
        const { recipientId } = req.body;
        const senderId = req.user.id;

        // Générer un ID de room unique
        const room = `chat_${[senderId, recipientId].sort().join('_')}`;

        // Vérifier si une discussion existe déjà
        const existingChat = await ChatMessage.findOne({
            where: { room },
            order: [['createdAt', 'DESC']]
        });

        if (existingChat) {
            return res.json({
                success: true,
                message: "Discussion déjà existante",
                data: { room }
            });
        }

        // Créer un message de bienvenue
        const welcomeMessage = await ChatMessage.create({
            content: "Discussion démarrée",
            room,
            recipientId,
            senderId,
            messageType: 'system'
        });

        res.status(201).json({
            success: true,
            message: "Discussion créée avec succès",
            data: { room }
        });
    } catch (error) {
        console.error('Erreur createChat:', error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la création de la discussion",
            error: error.message
        });
    }
};

// Récupérer les utilisateurs pour le chat admin
exports.getChatUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'firstName', 'lastName', 'role', 'email'],
            where: {
                id: {
                    [Op.ne]: req.user.id // Exclure l'utilisateur courant
                }
            },
            order: [['firstName', 'ASC']]
        });

        res.json({
            success: true,
            data: { users }
        });
    } catch (error) {
        console.error('Erreur getChatUsers:', error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des utilisateurs",
            error: error.message
        });
    }
};
