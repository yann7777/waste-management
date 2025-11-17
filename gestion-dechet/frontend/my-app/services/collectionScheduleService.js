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
    },

    createSchedule: async (scheduleData) => {
        try {
            const response = await api.post("/collection-schedules", scheduleData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la création du planning' };
        }
    },

    updateSchedule: async (id, scheduleData) => {
        try {
            const response = await api.put(`/collection-schedules/${id}`, scheduleData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la mise à jour du planning' };
        }
    },

    deleteSchedule: async (id) => {
        try {
            const response = await api.delete(`/collection-schedules/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la suppression du planning' };
        }
    },

    calculateNextCollection: async (id) => {
        try {
            const response = await api.patch(`/collection-schedules/${id}/calculate-next`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors du calcul de la prochaine collecte' };
        }
    },

    getCollectionStats: async () => {
        try {
            const response = await api.get("/collection-schedules/stats/overview");
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la récupération des statistiques' };
        }
    },

    getWorkerSchedules: async (filters = {}) => {
        try {
            const response = await api.get("/collection-schedules/worker/schedules", { 
                params: filters 
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la récupération des plannings worker' };
        }
    },

    getWorkerCollections: async (params) => {
        try {
        const queryParams = new URLSearchParams();
        if (params.workerId) queryParams.append('workerId', params.workerId);
        if (params.timeRange) queryParams.append('timeRange', params.timeRange);
        
        const response = await api.get(`/collection-schedules/worker-stats?${queryParams}`);
        return response.data;
        } catch (error) {
        throw error.response?.data || { message: 'Erreur lors de la récupération des collectes worker' };
        }
    },
};