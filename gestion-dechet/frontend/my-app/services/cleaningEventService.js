import api from "./api";

export const cleaningEventService = {
    // Créer un événement
    createEvent: async (eventData) => {
        try {
            const response = await api.post("/events", eventData); // Changé de "/cleaning-events" à "/events"
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: "Erreur lors de la création de l'événement" };
        }
    },

    // Récupérer tous les événements
    getEvents: async (filters = {}) => {
        try {
            const response = await api.get("/events", { params: filters }); // Changé ici
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la récupération des événements' };
        }
    },

    // Récupérer les événements publics
    getPublicEvents: async (filters = {}) => {
        try {
            const response = await api.get("/events/public", { params: filters }); // Changé ici
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la récupération des événements publics' };
        }
    },

    // Récupérer un événement par Id
    getEventById: async (id) => {
        try {
            const response = await api.get(`/events/${id}`); // Changé ici
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: "Erreur lors de la récupération de l'événement" };
        }
    },

    // Rejoindre un événement
    joinEvent: async (id) => {
        try {
            const response = await api.post(`/events/${id}/join`); // Changé ici
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: "Erreur lors de l'inscription à l'événement" };
        }
    },

    // Quitter un événement
    leaveEvent: async (id) => {
        try {
            const response = await api.post(`/events/${id}/leave`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la désinscription' };
        }
    },

    // Mettre à jour le statut d'un événement
    updateEventStatus: async (id, status) => {
        try {
            const response = await api.patch(`/events/${id}/status`, { status });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la mise à jour du statut' };
        }
    },

    // Récupérer les événements de l'utilisateur
    getUserEvents: async (type = "upcoming") => {
        try {
            const response = await api.get("/events/user-events", {
                params: { type }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la récupération de vos événements' };
        }
    }
};