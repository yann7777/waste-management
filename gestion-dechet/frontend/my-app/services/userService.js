import api from './api';

export const userService = {
  // Récupérer tous les utilisateurs (admin seulement)
  getAllUsers: async () => {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération des utilisateurs' };
    }
  },

  // Récupérer les statistiques globales
    getStats: async () => {
        try {
            const response = await api.get('/users/stats'); // ✅ Route correcte
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Erreur lors de la récupération des statistiques' };
        }
    },

    updateUserRole: async (userId, newRole) => {
    try {
      const response = await api.put(`/users/${userId}/role`, { role: newRole });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la mise à jour du rôle' };
    }
  },

  // Supprimer un utilisateur
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la suppression de l\'utilisateur' };
    }
  }
};