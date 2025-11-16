import api from "./api";

export const notificationService = {
    // Récupérer les notifications
    getNotifications: async (filters = {}) => {
        try {
            const response = await api.get('/notifications', { params: filters });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la récupération des notifications' };
        }
    },

    // Récupérer le nombre de notifications non lues
    getUnreadCount: async () => {
        try {
            const response = await api.get("/notifications/unread-count");
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors du comptage des notifications non lues' };
        }
    },

    // Marquer comme lu
    markAsRead: async (id) => {
        try {
            const response = await api.patch(`/notifications/${id}/read`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors du marquage de la notification' };
        }
    },

    // Marquer toutes comme lues
    markAllAsRead: async () => {
        try {
            const response = await api.patch("/notifications/mark-all-read");
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors du marquage des notifications' };
        }
    },

    // Supprimer une notification
    deleteNotification: async (id) => {
        try {
            const response = await api.delete(`/notifications/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la suppression de la notification' };
        }
    }
};