const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Gestion des Déchets Intelligente',
      version: '1.0.0',
      description: "API pour l'application de gestion des déchets et recyclage intelligent",
      contact: {
        name: 'Support API',
        email: 'support@wastemanagement.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000/api',
        description: 'Serveur principal'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName', 'address'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: "ID unique de l'utilisateur"
            },
            email: {
              type: 'string',
              format: 'email',
              description: "Email de l'utilisateur"
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'Mot de passe hashé'
            },
            firstName: {
              type: 'string',
              description: "Prénom de l'utilisateur"
            },
            lastName: {
              type: 'string',
              description: "Nom de l'utilisateur"
            },
            address: {
              type: 'object',
              description: "Adresse de l'utilisateur"
            },
            role: {
              type: 'string',
              enum: ['citizen', 'worker', 'admin'],
              description: "Rôle de l'utilisateur"
            },
            ecoPoints: {
              type: 'integer',
              description: 'Points écologiques accumulés'
            },
            level: {
              type: 'integer',
              description: "Niveau de l'utilisateur basé sur les points"
            },
            isVerified: {
              type: 'boolean',
              description: "Statut de vérification du compte"
            }
          }
        },
        Report: {
          type: 'object',
          required: ['type', 'location', 'userId'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID unique du signalement'
            },
            type: {
              type: 'string',
              enum: ['illegal_dumping', 'full_bin', 'broken_bin', 'other'],
              description: 'Type de signalement'
            },
            description: {
              type: 'string',
              description: 'Description détaillée du signalement'
            },
            location: {
              type: 'object',
              description: 'Coordonnées GPS du signalement'
            },
            photos: {
              type: 'array',
              items: { type: 'string' },
              description: 'URLs des photos'
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'resolved', 'rejected'],
              description: 'Statut du signalement'
            },
            severity: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Niveau de sévérité'
            },
            estimatedWasteVolume: {
              type: 'number',
              format: 'float',
              description: 'Volume estimé des déchets'
            },
            wasteCategories: {
              type: 'array',
              items: { type: 'string' },
              description: 'Catégories de déchets'
            },
            isOffline: {
              type: 'boolean',
              description: 'Signalement créé en mode hors ligne'
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: "ID de l'utilisateur qui a créé le signalement"
            }
          }
        },
        CollectionSchedule: {
          type: 'object',
          required: ['zone', 'wasteType', 'schedule', 'nextCollection'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID unique du planning de collecte'
            },
            zone: {
              type: 'string',
              description: 'Zone géographique de collecte'
            },
            wasteType: {
              type: 'string',
              enum: ['general', 'recyclable', 'organic', 'hazardous'],
              description: 'Type de déchets collectés'
            },
            schedule: {
              type: 'object',
              description: 'Planning détaillé des collectes'
            },
            nextCollection: {
              type: 'string',
              format: 'date-time',
              description: 'Prochaine date de collecte'
            },
            frequency: {
              type: 'string',
              enum: ['daily', 'weekly', 'biweekly', 'monthly'],
              description: 'Fréquence de collecte'
            }
          }
        },
        RecyclingCenter: {
          type: 'object',
          required: ['name', 'address', 'location', 'openingHours'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID unique du centre de recyclage'
            },
            name: {
              type: 'string',
              description: 'Nom du centre de recyclage'
            },
            address: {
              type: 'object',
              description: 'Adresse complète du centre'
            },
            location: {
              type: 'object',
              description: 'Coordonnées GPS du centre'
            },
            acceptedMaterials: {
              type: 'array',
              items: { type: 'string' },
              description: 'Matériaux acceptés par le centre'
            },
            openingHours: {
              type: 'object',
              description: 'Horaires d\'ouverture'
            },
            contact: {
              type: 'object',
              description: 'Informations de contact'
            },
            capacity: {
              type: 'integer',
              description: 'Capacité maximale du centre'
            },
            currentOccupancy: {
              type: 'number',
              format: 'float',
              description: 'Taux d\'occupation actuel'
            }
          }
        },
        EcoAction: {
          type: 'object',
          required: ['userId', 'type', 'points'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID unique de l\'action écologique'
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'ID de l\'utilisateur ayant effectué l\'action'
            },
            type: {
              type: 'string',
              enum: ['report', 'recycling', 'cleaning', 'education', 'other'],
              description: 'Type d\'action écologique'
            },
            points: {
              type: 'integer',
              description: 'Points gagnés pour cette action'
            },
            description: {
              type: 'string',
              description: 'Description de l\'action'
            },
            metadata: {
              type: 'object',
              description: 'Métadonnées supplémentaires'
            },
            reportId: {
              type: 'string',
              format: 'uuid',
              description: 'ID du signalement lié (si applicable)'
            },
            eventId: {
              type: 'string',
              format: 'uuid',
              description: 'ID de l\'événement de nettoyage lié (si applicable)'
            }
          }
        },
        CleaningEvent: {
          type: 'object',
          required: ['title', 'description', 'location', 'date', 'organizerId'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID unique de l\'événement de nettoyage'
            },
            title: {
              type: 'string',
              description: 'Titre de l\'événement'
            },
            description: {
              type: 'string',
              description: 'Description détaillée de l\'événement'
            },
            location: {
              type: 'object',
              description: 'Lieu de l\'événement'
            },
            date: {
              type: 'string',
              format: 'date-time',
              description: 'Date et heure de l\'événement'
            },
            duration: {
              type: 'integer',
              description: 'Durée estimée en minutes'
            },
            maxParticipants: {
              type: 'integer',
              description: 'Nombre maximum de participants'
            },
            status: {
              type: 'string',
              enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
              description: 'Statut de l\'événement'
            },
            organizerId: {
              type: 'string',
              format: 'uuid',
              description: 'ID de l\'organisateur'
            },
            ecoPointsReward: {
              type: 'integer',
              description: 'Points écologiques offerts aux participants'
            }
          }
        },
        Notification: {
          type: 'object',
          required: ['title', 'message', 'userId'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID unique de la notification'
            },
            title: {
              type: 'string',
              description: 'Titre de la notification'
            },
            message: {
              type: 'string',
              description: 'Message de la notification'
            },
            type: {
              type: 'string',
              enum: ['info', 'warning', 'success', 'reminder', 'alert'],
              description: 'Type de notification'
            },
            isRead: {
              type: 'boolean',
              description: 'Statut de lecture'
            },
            actionUrl: {
              type: 'string',
              description: 'URL d\'action associée'
            },
            metadata: {
              type: 'object',
              description: 'Métadonnées supplémentaires'
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'ID de l\'utilisateur destinataire'
            },
            relatedReportId: {
              type: 'string',
              format: 'uuid',
              description: 'ID du signalement lié (si applicable)'
            },
            relatedEventId: {
              type: 'string',
              format: 'uuid',
              description: 'ID de l\'événement lié (si applicable)'
            }
          }
        },
        ChatMessage: {
          type: 'object',
          required: ['content', 'room', 'senderId'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID unique du message'
            },
            content: {
              type: 'string',
              description: 'Contenu du message'
            },
            messageType: {
              type: 'string',
              enum: ['text', 'image', 'file', 'system'],
              description: 'Type de message'
            },
            room: {
              type: 'string',
              description: 'Salle/room du chat'
            },
            senderId: {
              type: 'string',
              format: 'uuid',
              description: 'ID de l\'expéditeur'
            },
            recipientId: {
              type: 'string',
              format: 'uuid',
              description: 'ID du destinataire (pour les messages privés)'
            },
            isRead: {
              type: 'boolean',
              description: 'Statut de lecture'
            },
            attachments: {
              type: 'array',
              items: { type: 'string' },
              description: 'Pièces jointes associées'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: "Message d'erreur"
            },
            error: {
              type: 'string',
              description: "Détails de l'erreur"
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: "Message de succès"
            },
            data: {
              type: 'object',
              description: "Données de réponse"
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi
};