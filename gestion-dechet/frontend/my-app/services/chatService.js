import api from "./api";

export const chatService = {
    // Envoyer un message
    sendMessage: async (messageData) => {
        try {
            const response = await api.post('/chat/send', messageData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de l\'envoi du message' };
        }
    },

    // Récupérer les discussions
    getUserChats: async () => {
        try {
            const response = await api.get("/chat/chats");
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la récupération des discussions' };
        }
    },

    // Récupérer les messages d'une room
    getRoomMessages: async (room, filters = {}) => {
        try {
            const response = await api.get(`/chat/rooms/${room}/messages`, { params: filters });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la récupération des messages' };
        }
    },

    // Marquer les messages comme lus
    markMessagesAsRead: async (room) => {
        try {
            const response = await api.patch(`/chat/rooms/${room}/read`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors du marquage des messages' };
        }
    },

    // Récupérer le nombre de messages non lus
    getUnreadCount: async () => {
        try {
            const response = await api.get("/chat/unread-count");
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors du comptage des messages non lus' };
        }
    },

    // Supprimer un message
    deleteMessage: async (id) => {
        try {
            const response = await api.delete(`/chat/messages/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la suppression du message' };
        }
    }
};