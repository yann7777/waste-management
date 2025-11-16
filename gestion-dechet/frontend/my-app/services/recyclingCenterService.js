import api from "./api";

export const recyclingCenterService = {
    // Récupérer tous les centres
    getCenters: async (filters = {}) => {
        try {
            const response = await api.get("/recycling-centers/public", { params: filters });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la récupération des centres' };
        }
    },

    // Récupérer les centres à proximité
        getNearbyCenters: async (lat, lng, radius = 10) => {
        try {
            const response = await api.get("/recycling-centers/public/nearby", {
            params: { lat, lng, radius }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la recherche des centres à proximité' };
        }
        },

    // Récupérer les centres par matériau
    getCentersByMaterial: async (material, page = 1) => {
        try {
            const response = await api.get(`/recycling-centers/public/material/${material}`, {
                params: { page }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la recherche par matériau' };
        }
    },

    // Récupérer un centre par Id
    getCenterById: async (id) => {
        try {
            const response = await api.get(`/recycling-centers/public/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la récupération du centre' };
        }
    },

    // Ajouter ou retirer des favoris
    toggleFavorite: async (id) => {
        try {
            const response = await api.post(`/recycling-centers/${id}/favorite`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: "Erreur lors de la modification des favoris" };
        }
    },

    // Récupérer les favoris
    getFavorites: async (page = 1) => {
        try {
            const response = await api.get("/recycling-centers/favorites", {
                params: { page }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la récupération des favoris' };
        }
    }
};