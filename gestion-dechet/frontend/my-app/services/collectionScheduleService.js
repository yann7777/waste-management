import api from "./api";

export const collectionScheduleService = {
    // Récupérer tous les plannings
    getSchedules: async (filters = {}) => {
        try {
            const response = await api.get("/collection-schedules", { params: filters });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la récupération des plannings' };
        }
    },

    // Récupérer les planning par zone
    getSchedulesByZone: async (zone) => {
        try {
            const response = await api.get(`/collection-schedules/public/zone/${zone}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la récupération des plannings par zone' };
        }
    },

    // Récupérer les collectes à venir
    getUpcomingCollections: async (days = 7) => {
        try {
            const response = await api.get("/collection-schedules/public/upcoming", {
                params: { days }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la récupération des collectes à venir' };
        }
    },

    // Récupérer un planning par id
    getScheduleById: async (id) => {
        try {
            const response = await api.get(`collection-schedules/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la récupération du planning' };
        }
    }
};