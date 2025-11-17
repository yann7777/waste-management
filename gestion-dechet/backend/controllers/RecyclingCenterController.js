const { RecyclingCenter, User, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.createRecyclingCenter = async (req, res) => {
    try {
        const {
            name,
            address,
            location,
            acceptedMaterials,
            openingHours,
            contact,
            capacity
        } = req.body;

        // Vérifier si un centre avec le même nom existe déjà
        const existingCenter = await RecyclingCenter.findOne({
            where: { name }
        });

        if (existingCenter) {
            return res.status(400).json({
                success: false,
                message: "Un centre de recyclage avec ce nom existe déjà"
            });
        }

        const recyclingCenter = await RecyclingCenter.create({
            name,
            address,
            location,
            acceptedMaterials: acceptedMaterials || [],
            openingHours,
            contact: contact || null,
            capacity: capacity || null,
            currentOccupancy: 0
        });

        res.status(201).json({
            success: true,
            message: "Centre de recyclage créé avec succès",
            data: { recyclingCenter }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la création du centre de recyclage",
            error: error.message
        });
    }
};

exports.getAllRecyclingCenters = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            materials,
            maxDistance,
            userLat,
            userLng
        } = req.query;

        const whereClause = {};
        let order = [['name', 'ASC']];

        // Recherche par nom
        if (search) {
            whereClause.name = {
                [Op.iLike]: `%${search}%`
            };
        }

        // Filtre par matériaux
        if (materials) {
            const materialsArray = Array.isArray(materials) ? materials : [materials];
            whereClause.acceptedMaterials = {
                [Op.overlap]: materialsArray
            };
        }

        const offset = (page - 1) * limit;

        let recyclingCenters;
        let count;

        // MODIFICATION : Utiliser findAndCountAll avec attributes pour exclure createdBy
        const result = await RecyclingCenter.findAndCountAll({
            where: whereClause,
            order,
            limit: parseInt(limit),
            offset: parseInt(offset),
            attributes: {
                exclude: ['createdBy'] // Exclure la colonne problématique
            }
        });

        recyclingCenters = result.rows;
        count = result.count;

        res.json({
            success: true,
            data: {
                recyclingCenters,
                pagination: {
                    current: parseInt(page),
                    total: Math.ceil(count / limit),
                    count
                }
            }
        });
    } catch (error) {
        console.error('Erreur détaillée:', error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des centres de recyclage",
            error: error.message
        });
    }
};

exports.getRecyclingCenterById = async (req, res) => {
    try {
        const { id } = req.params;

        const recyclingCenter = await RecyclingCenter.findByPk(id);

        if (!recyclingCenter) {
            return res.status(404).json({
                success: false,
                message: "Centre de recyclage non trouvé"
            });
        }

        res.json({
            success: true,
            data: { recyclingCenter }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération du centre de recyclage",
            error: error.message
        });
    }
};

exports.updateRecyclingCenter = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            address,
            location,
            acceptedMaterials,
            openingHours,
            contact,
            capacity,
            currentOccupancy
        } = req.body;

        const recyclingCenter = await RecyclingCenter.findByPk(id);

        if (!recyclingCenter) {
            return res.status(404).json({
                success: false,
                message: "Centre de recyclage non trouvé"
            });
        }

        // Vérifier si le nom est déjà utilisé par un autre centre
        if (name && name !== recyclingCenter.name) {
            const existingCenter = await RecyclingCenter.findOne({
                where: { name, id: { [Op.ne]: id } }
            });

            if (existingCenter) {
                return res.status(400).json({
                    success: false,
                    message: "Un autre centre de recyclage avec ce nom existe déjà"
                });
            }
        }

        await recyclingCenter.update({
            name: name || recyclingCenter.name,
            address: address || recyclingCenter.address,
            location: location || recyclingCenter.location,
            acceptedMaterials: acceptedMaterials || recyclingCenter.acceptedMaterials,
            openingHours: openingHours || recyclingCenter.openingHours,
            contact: contact !== undefined ? contact : recyclingCenter.contact,
            capacity: capacity !== undefined ? capacity : recyclingCenter.capacity,
            currentOccupancy: currentOccupancy !== undefined ? currentOccupancy : recyclingCenter.currentOccupancy,
        });

        res.json({
            success: true,
            message: "Centre de recyclage mis à jour avec succès",
            data: { recyclingCenter }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la mise à jour du centre de recyclage",
            error: error.message
        });
    }
};

exports.deleteRecyclingCenter = async (req, res) => {
    try {
        const { id } = req.params;

        const recyclingCenter = await RecyclingCenter.findByPk(id);

        if (!recyclingCenter) {
            return res.status(404).json({
                success: false,
                message: "Centre de recyclage non trouvé"
            });
        }

        await recyclingCenter.destroy();

        res.json({
            success: true,
            message: "Centre de recyclage supprimé avec succès"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la suppression du centre de recyclage",
            error: error.message
        });
    }
};

exports.getNearbyCenters = async (req, res) => {
    try {
        const { lat, lng, radius = 10, limit = 20 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: "Les coordonnées GPS (lat, lng) sont requises" 
            });
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const radiusKm = parseFloat(radius);

        const query = `
            SELECT *,
            (6371 * acos(cos(radians($1)) * cos(radians((location->>'lat')::float)) 
            * cos(radians((location->>'lng')::float) - radians($2)) 
            + sin(radians($1)) * sin(radians((location->>'lat')::float)))) 
            AS distance
            FROM "RecyclingCenters"
            WHERE (6371 * acos(cos(radians($1)) * cos(radians((location->>'lat')::float)) 
            * cos(radians((location->>'lng')::float) - radians($2)) 
            + sin(radians($1)) * sin(radians((location->>'lat')::float)))) <= $3
            ORDER BY distance ASC
            LIMIT $4
        `;

        const recyclingCenters = await sequelize.query(query, {
            replacements: [userLat, userLng, radiusKm, parseInt(limit)],
            model: RecyclingCenter,
            mapToModel: true
        });

        res.json({
            success: true,
            data: {
                recyclingCenters,
                userLocation: { lat: userLat, lng: userLng },
                searchRadius: radiusKm
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la recherche des centres à proximité",
            error: error.message
        });
    }
};

exports.getCentersByMaterial = async (req, res) => {
    try {
        const { material } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const offset = (page - 1) * limit;

        const { count, rows: recyclingCenters } = await RecyclingCenter.findAndCountAll({
            where: {
                acceptedMaterials: {
                    [Op.contains]: [material]
                }
            },
            order: [['name', 'ASC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: {
                recyclingCenters,
                material,
                pagination: {
                    current: parseInt(page),
                    total: Math.ceil(count / limit),
                    count
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la recherche des centres par matériau",
            error: error.message
        });
    }
};

exports.updateOccupancy = async (req, res) => {
    try {
        const { id } = req.params;
        const { occupancy } = req.body;

        if (occupancy === undefined || occupancy < 0 || occupancy > 100) {
            return res.status(400).json({
                success: false,
                message: "Le taux d'occupation doit être compris entre 0 et 100"
            });
        }

        const recyclingCenter = await RecyclingCenter.findByPk(id);

        if (!recyclingCenter) {
            return res.status(404).json({
                success: false,
                message: "Centre de recyclage non trouvé"
            });
        }

        await recyclingCenter.update({
            currentOccupancy: parseFloat(occupancy)
        });

        res.json({
            success: true,
            message: "Taux d'occupation mis à jour avec succès",
            data: { recyclingCenter }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la mise à jour du taux d'occupation",
            error: error.message
        });
    }
};

exports.getAllRecyclingCenterStats = async (req, res) => {
    try {
        // Statistiques par matériaux acceptés
        const materialsStats = await RecyclingCenter.findAll({
            attributes: [
                [sequelize.fn('UNNEST', sequelize.col('acceptedMaterials')), 'material'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'centerCount']
            ],
            group: ['material'],
            order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
        });

        // Statistiques de capacité
        const capacityStats = await RecyclingCenter.findOne({
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalCenters'],
                [sequelize.fn('SUM', sequelize.col('capacity')), 'totalCapacity'],
                [sequelize.fn('AVG', sequelize.col('currentOccupancy')), 'avgOccupancy']
            ]
        });

        // Centres les plus occupés 
        const mostOccupiedCenters = await RecyclingCenter.findAll({
            attributes: ['id', 'name', 'currentOccupancy', 'capacity'],
            where: {
                capacity: { [Op.not]: null }
            },
            order: [['currentOccupancy', 'DESC']],
            limit: 10
        });

        res.json({
            success: true,
            data: {
                materials: materialsStats,
                capacity: capacityStats,
                mostOccupiedCenters
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des statistiques",
            error: error.message
        });
    }
};

exports.toggleFavorite = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const recyclingCenter = await RecyclingCenter.findByPk(id);
        
        if (!recyclingCenter) {
            return res.status(404).json({
                success: false,
                message: "Centre de recyclage non trouvé"
            });
        }

        const user = await User.findByPk(userId);
        
        // Ces méthodes nécessitent une relation Many-to-Many définie dans les modèles
        // Pour l'instant, retourner une erreur si la relation n'est pas définie
        try {
            const isFavorite = await user.hasFavoriteRecyclingCenter(recyclingCenter);

            if (isFavorite) {
                await user.removeFavoriteRecyclingCenter(recyclingCenter);
                res.json({
                    success: true,
                    message: "Centre retiré des favoris",
                    data: { isFavorite: false }
                });
            } else {
                await user.addFavoriteRecyclingCenter(recyclingCenter);
                res.json({
                    success: true,
                    message: "Centre ajouté aux favoris",
                    data: { isFavorite: true }
                });
            }
        } catch (relationError) {
            return res.status(501).json({
                success: false,
                message: "Fonctionnalité favoris non implémentée",
                error: "La relation User-Favorites n'est pas configurée"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la modification des favoris",
            error: error.message
        });
    }
};

exports.getUserFavorites = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;

        const offset = (page - 1) * limit;

        const user = await User.findByPk(userId, {
            include: [{
                model: RecyclingCenter,
                as: 'favoriteRecyclingCenters',
                through: { attributes: [] }
            }]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Utilisateur non trouvé"
            });
        }

        const favoriteCenters = user.favoriteRecyclingCenters || [];
        const paginatedCenters = favoriteCenters.slice(offset, offset + parseInt(limit));

        res.json({
            success: true,
            data: {
                recyclingCenters: paginatedCenters,
                pagination: {
                    current: parseInt(page),
                    total: Math.ceil(favoriteCenters.length / limit),
                    count: favoriteCenters.length
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des favoris",
            error: error.message
        });
    }
};
