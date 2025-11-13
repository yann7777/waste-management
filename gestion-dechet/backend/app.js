const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { init: initSocket } = require('./socket/socket');

const sequelize = require('./config/database');
const { authenticate } = require('./middleware/auth');

// On importe les routes
const authRoute = require('./routes/authRoute');
const reportRoute = require('./routes/ReportRoute');
const analysticsRoute = require('./routes/analysticsRoute');
const docsRoute = require('./routes/docs');
const cleaningEventRoute = require('./routes/CleaningEventRoute');
const notificationRoute = require('./routes/NotificationRoute')
const chatRoute = require('./routes/ChatMessageRoute')

const collectionScheduleRoute = require('./routes/CollectionScheduleRoute');
const ecoActionRoute = require('./routes/EcoActionRoute');
const recyclingCenterRoute = require('./routes/RecyclingCenterRoute');

const app = express();

// Middleware de sécurité
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes publiques
app.use('/api/auth', authRoute);
app.use('/api/docs', docsRoute);

// Routes protégées
app.use('/api/reports', authenticate, reportRoute);
app.use('/api/analytics', authenticate, analysticsRoute);

app.use('/api/events', cleaningEventRoute);
app.use('/api/notifications', notificationRoute);
app.use('/api/chat', chatRoute);

app.use('/api/collection-schedules', collectionScheduleRoute);
app.use('/api/eco-actions', ecoActionRoute);
app.use('/api/recycling-centers', recyclingCenterRoute);

// Gestion des erreurs 404 - CORRIGÉ (CHOISISSEZ UNE DES DEUX OPTIONS)

// OPTION 1 (recommandée) :
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.method} ${req.originalUrl}`
  });
});

// OU OPTION 2 :
// app.all('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: `Route non trouvée: ${req.method} ${req.originalUrl}`
//   });
// });

// Gestionnaire d'erreurs global amélioré
app.use((error, req, res, next) => {
  console.error('Erreur:', error);
  
  // Erreur de validation Sequelize
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: "Erreur de validation des données",
      errors: error.errors.map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }
  
  // Erreur de contrainte Sequelize
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: "Donnée déjà existante",
      errors: error.errors.map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }
  
  // Erreur JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: "Token invalide"
    });
  }
  
  // Erreur d'expiration JWT
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: "Token expiré"
    });
  }

  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Synchronisation de la base de données
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connexion à la base de données établie');
    
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Base de données synchronisée (mode développement)');
    } else {
      await sequelize.sync();
      console.log('Base de données prête (mode production)');
    }
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 3000;

// Démarrage du serveur - UNIQUEMENT UNE FOIS
const server = app.listen(PORT, async () => {
    await syncDatabase();
    console.log(`Serveur démarré sur le port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Documentation API: http://localhost:${PORT}/api/docs`);
});

// Initialisation de Socket.io
const io = initSocket(server);
app.set('socketio', io);

// Gestion propre de l'arrêt du serveur
process.on('SIGINT', async () => {
  console.log('\nArrêt du serveur en cours...');
  await sequelize.close();
  server.close(() => {
    console.log('Serveur arrêté proprement');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\nArrêt du serveur demandé...');
  await sequelize.close();
  server.close(() => {
    console.log('Serveur arrêté proprement');
    process.exit(0);
  });
});

module.exports = app;