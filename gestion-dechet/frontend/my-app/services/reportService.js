import api from "./api";

export const reportService = {
    // Créer un signalement - VERSION CORRIGÉE
    createReport: async (reportData, photos = []) => {
        try {
            console.log('=== DEBUT createReport ===');
            console.log('📦 reportData:', reportData);
            console.log('🖼️ Nombre de photos:', photos.length);

            const formData = new FormData();

            // Ajouter les données du signalement
            Object.keys(reportData).forEach(key => {
                if (key === 'location' || key === 'wasteCategories') {
                    // Stringify les objets
                    const stringValue = JSON.stringify(reportData[key]);
                    formData.append(key, stringValue);
                    console.log(`🔧 ${key}:`, stringValue);
                } else if (reportData[key] !== null && reportData[key] !== undefined) {
                    formData.append(key, reportData[key].toString());
                    console.log(`🔧 ${key}:`, reportData[key]);
                }
            });

            // CORRECTION : Format des photos pour React Native
            photos.forEach((photo, index) => {
                let filename = photo.uri.split('/').pop();
                
                // S'assurer que le nom a une extension
                if (!filename || !filename.match(/\.(jpg|jpeg|png)$/)) {
                    filename = `photo_${Date.now()}_${index}.jpg`;
                }
                
                // Déterminer le type MIME
                let type = 'image/jpeg';
                if (photo.uri && photo.uri.match(/\.png$/)) {
                    type = 'image/png';
                }

                // FORMAT CORRECT POUR REACT NATIVE
                formData.append('photos', {
                    uri: photo.uri,
                    type: type,
                    name: filename
                });
                
                console.log(`📸 Photo ${index} ajoutée:`, {
                    uri: photo.uri,
                    type: type,
                    name: filename
                });
            });

            console.log('🚀 Envoi vers /api/reports...');

            const response = await api.post("/reports", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                timeout: 60000,
            });
            
            console.log('✅ Réponse reçue:', response.data);
            return response.data;
            
        } catch (error) {
            console.error('❌ Erreur complète createReport:', {
                message: error.message,
                code: error.code,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers
            });
            
            // Gestion améliorée des erreurs
            if (error.response?.data) {
                throw error.response.data;
            } else if (error.request) {
                throw { 
                    success: false,
                    message: "Impossible de contacter le serveur. Vérifiez votre connexion internet et que le serveur est démarré." 
                };
            } else {
                throw { 
                    success: false,
                    message: error.message || "Erreur lors de la création du signalement" 
                };
            }
        }
    },

    // Récupérer tous les signalements (pour admin/worker)
    getReports: async (filters = {}) => {
        try {
            const response = await api.get("/reports", { params: filters });
            return response.data;
        } catch (error) {
            console.error('Erreur API getReports:', error);
            throw error.response?.data || { 
                success: false,
                message: 'Erreur lors de la récupération des signalements' 
            };
        }
    },

    // Récupérer les signalements de l'utilisateur connecté
    getUserReports: async (page = 1, limit = 10) => {
        try {
            const response = await api.get("/reports/user/my-reports", {
                params: { page, limit }
            });
            return response.data;
        } catch (error) {
            console.error('Erreur API getUserReports:', error);
            throw error.response?.data || { 
                success: false,
                message: 'Erreur lors de la récupération de vos signalements' 
            };
        }
    },

    // Récupérer un signalement spécifique
    getReportById: async (id) => {
        try {
            const response = await api.get(`/reports/${id}`);
            return response.data;
        } catch (error) {
            console.error('Erreur API getReportById:', error);
            throw error.response?.data || { 
                success: false,
                message: 'Erreur lors de la récupération du signalement' 
            };
        }
    },

    // Supprimer un signalement
    deleteReport: async (id) => {
        try {
            const response = await api.delete(`/reports/${id}`);
            return response.data;
        } catch (error) {
            console.error('Erreur API deleteReport:', error);
            throw error.response?.data || { 
                success: false,
                message: 'Erreur lors de la suppression du signalement' 
            };
        }
    },

    // Mettre à jour un signalement
    updateReport: async (id, reportData, photos = []) => {
        try {
            const formData = new FormData();

            Object.keys(reportData).forEach(key => {
                if (key === 'location' || key === 'wasteCategories') {
                    formData.append(key, JSON.stringify(reportData[key]));
                } else if (reportData[key] !== null && reportData[key] !== undefined) {
                    formData.append(key, reportData[key].toString());
                }
            });

            // CORRECTION : Même format pour les photos
            photos.forEach((photo, index) => {
                let filename = photo.uri.split('/').pop();
                if (!filename || !filename.match(/\.(jpg|jpeg|png)$/)) {
                    filename = `photo_${Date.now()}_${index}.jpg`;
                }
                
                let type = 'image/jpeg';
                if (photo.uri && photo.uri.match(/\.png$/)) {
                    type = 'image/png';
                }

                formData.append('photos', {
                    uri: photo.uri,
                    type: type,
                    name: filename
                });
            });

            const response = await api.put(`/reports/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Erreur API updateReport:', error);
            throw error.response?.data || { 
                success: false,
                message: 'Erreur lors de la mise à jour du signalement' 
            };
        }
    },

    // Mettre à jour le statut (pour admin/worker)
    updateReportStatus: async (id, status, resolutionNotes = "") => {
        try {
            const response = await api.patch(`/reports/${id}/status`, {
                status,
                resolutionNotes
            });
            return response.data;
        } catch (error) {
            console.error('Erreur API updateReportStatus:', error);
            throw error.response?.data || { 
                success: false,
                message: 'Erreur lors de la mise à jour du statut' 
            };
        }
    },

    // Ajouter des photos à un signalement existant
    addReportPhotos: async (id, photos = []) => {
        try {
            const formData = new FormData();

            // CORRECTION : Même format pour les photos
            photos.forEach((photo, index) => {
                let filename = photo.uri.split('/').pop();
                if (!filename || !filename.match(/\.(jpg|jpeg|png)$/)) {
                    filename = `photo_${Date.now()}_${index}.jpg`;
                }
                
                let type = 'image/jpeg';
                if (photo.uri && photo.uri.match(/\.png$/)) {
                    type = 'image/png';
                }

                formData.append("photos", {
                    uri: photo.uri,
                    type: type,
                    name: filename
                });
            });

            const response = await api.post(`/reports/${id}/photos`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Erreur API addReportPhotos:', error);
            throw error.response?.data || { 
                success: false,
                message: "Erreur lors de l'ajout des photos" 
            };
        }
    },

    // Récupérer les statistiques (pour admin/worker)
    getReportStats: async () => {
        try {
            const response = await api.get('/reports/stats');
            return response.data;
        } catch (error) {
            console.error('Erreur API getReportStats:', error);
            throw error.response?.data || { 
                success: false,
                message: 'Erreur lors de la récupération des statistiques' 
            };
        }
    },

    getWorkerReports: async (params) => {
        try {
        const queryParams = new URLSearchParams();
        if (params.workerId) queryParams.append('workerId', params.workerId);
        if (params.timeRange) queryParams.append('timeRange', params.timeRange);
        
        const response = await api.get(`/reports/worker-stats?${queryParams}`);
        return response.data;
        } catch (error) {
        throw error.response?.data || { message: 'Erreur lors de la récupération des rapports worker' };
        }
    },
};