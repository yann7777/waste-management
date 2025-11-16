import api from "./api";

export const ecoActionService = {
    // Récupérer les actions de l'utilisateur
    getUserActions: async (filters = {}) => {
        try {
            const response = await api.get("/eco-actions/my-actions", { params: filters });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la récupération de vos actions' };
        }
    },

    // Récupérer le classement
    getRanking: async (limit = 20, period = "all") => {
        try {
            const response = await api.get("/eco-actions/ranking", {
                params: { limit, period }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la récupération du classement' };
        }
    },

    // Récupérer les statistiques
    getStats: async (filters = {}) => {
        try {
            const response = await api.get("/eco-actions/stats", { params: filters });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la récupération des statistiques' };
        }
    }
};