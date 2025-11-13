const sequelize = require('../config/database');
const User = require('./User');
const Report = require('./Report');
const CollectionSchedule = require('./CollectionSchedule');
const RecyclingCenter = require('./RecyclingCenter');
const EcoAction = require('./EcoAction');
const CleaningEvent = require('./CleaningEvent');
const Notification = require('./Notification');
const ChatMessage = require('./ChatMessage');

// Relations principales
// User <-> Report (Un utilisateur peut avoir plusieurs signalements)
User.hasMany(Report, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
    as: 'reports'
});
Report.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// User <-> EcoAction (Un utilisateur peut avoir plusieurs actions écologiques)
User.hasMany(EcoAction, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
    as: 'ecoActions'
});
EcoAction.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// User <-> Notification (Un utilisateur peut avoir plusieurs notifications)
User.hasMany(Notification, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
    as: 'notifications'
});
Notification.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// User <-> ChatMessage (Un utilisateur peut envoyer plusieurs messages)
User.hasMany(ChatMessage, {
    foreignKey: 'senderId',
    onDelete: 'CASCADE',
    as: 'sentMessages'
});
ChatMessage.belongsTo(User, {
    foreignKey: 'senderId',
    as: 'sender'
});

// ChatMessage -> User (Un message peut avoir un destinataire)
ChatMessage.belongsTo(User, {
    foreignKey: 'recipientId',
    as: 'recipient'
});
User.hasMany(ChatMessage, {
    foreignKey: 'recipientId',
    as: 'receivedMessages'
});

// Relations cleaning event
// User <-> CleaningEvent (Un utilisateur peut organiser plusieurs événements)
User.hasMany(CleaningEvent, {
    foreignKey: 'organizerId',
    onDelete: 'CASCADE',
    as: 'organizedEvents'
});
CleaningEvent.belongsTo(User, {
    foreignKey: 'organizerId',
    as: 'organizer'
});

// Relation Many-to-Many User <-> CleaningEvent (Participants aux événements)
User.belongsToMany(CleaningEvent, {
    through: 'EventParticipants',
    foreignKey: 'userId',
    otherKey: 'eventId',
    as: 'participatedEvents',
    onDelete: 'CASCADE'
});
CleaningEvent.belongsToMany(User, {
    through: 'EventParticipants',
    foreignKey: 'eventId',
    otherKey: 'userId',
    as: 'participants',
    onDelete: 'CASCADE'
});

// Relation eco actions avec CleaningEvent
CleaningEvent.hasMany(EcoAction, {
    foreignKey: 'eventId',
    as: 'eventEcoActions'
});
EcoAction.belongsTo(CleaningEvent, {
    foreignKey: 'eventId',
    as: 'cleaningEvent'
});

// Report EcoAction (Un signalement peut générer une action écologique)
Report.hasOne(EcoAction, {
    foreignKey: 'reportId',
    as: 'reportedEcoAction'
});
EcoAction.belongsTo(Report, {
    foreignKey: 'reportId',
    as: 'report'
});

// Relations de suivi
// User peut "suivre" des RecyclingCenter (relation optionnelle)
User.belongsToMany(RecyclingCenter, {
    through: 'UserRecyclingCenterFavorites',
    foreignKey: 'userId',
    otherKey: 'recyclingCenterId',
    as: 'favoriteRecyclingCenters',
    onDelete: 'CASCADE'
});
RecyclingCenter.belongsToMany(User, {
    through: 'UserRecyclingCenterFavorites',
    foreignKey: 'recyclingCenterId',
    otherKey: 'userId',
    as: 'favoritedByUsers',
    onDelete: 'CASCADE'
});

// Relations de notification
// Notification peut référencer différents types d'entités
Notification.belongsTo(Report, {
    foreignKey: 'relatedReportId',
    as: 'relatedReport'
});
Report.hasMany(Notification, {
    foreignKey: 'relatedReportId',
    as: 'relatedNotifications'
});

Notification.belongsTo(CleaningEvent, {
    foreignKey: 'relatedEventId',
    as: 'relatedEvent'
});
CleaningEvent.hasMany(Notification, {
    foreignKey: 'relatedEventId',
    as: 'relatedNotifications'
});

module.exports = {
    sequelize,
    User,
    Report,
    CollectionSchedule,
    RecyclingCenter,
    EcoAction,
    CleaningEvent,
    Notification,
    ChatMessage
};