import api from "./api";

export const analysticsService = {
    // Récupérer les statistiques du dashboard
    getDashboardStats: async () => {
        try {
            const response = await api.get("/analytics/dashboard-stats");
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la récupération des statistiques' };
        }
    },

    // Récupérer les itinéraires optimisés
    getOptimizationRoutes: async () => {
        try {
            const response = await api.get("/analytics/optimization-routes");
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de l\'optimisation des itinéraires' };
        }
    }
};