import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Switch
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { notificationService } from '../../../services/notificationService';

const WorkerNotifications = ({ navigation }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState({
    reportAlerts: true,
    collectionAlerts: true,
    scheduleChanges: true,
    emergencyAlerts: true,
    dailySummary: false
  });

  useEffect(() => {
    loadNotifications();
    loadNotificationSettings();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications({ 
        limit: 50,
        unreadOnly: false 
      });
      
      if (response.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
      Alert.alert('Erreur', 'Impossible de charger les notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadNotificationSettings = async () => {
    // En production, récupérer depuis l'API
    const defaultSettings = {
      reportAlerts: true,
      collectionAlerts: true,
      scheduleChanges: true,
      emergencyAlerts: true,
      dailySummary: false
    };
    setSettings(defaultSettings);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success) {
        // Mettre à jour localement
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
      }
    } catch (error) {
      console.error('Erreur marquage comme lu:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        // Mettre à jour toutes les notifications comme lues
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        );
        Alert.alert('Succès', 'Toutes les notifications marquées comme lues');
      }
    } catch (error) {
      console.error('Erreur marquage multiple:', error);
      Alert.alert('Erreur', 'Impossible de marquer toutes les notifications comme lues');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    Alert.alert(
      'Supprimer la notification',
      'Êtes-vous sûr de vouloir supprimer cette notification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await notificationService.deleteNotification(notificationId);
              if (response.success) {
                setNotifications(prev => 
                  prev.filter(n => n.id !== notificationId)
                );
              }
            } catch (error) {
              console.error('Erreur suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la notification');
            }
          }
        }
      ]
    );
  };

  const handleSettingToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    // En production, sauvegarder les préférences via API
  };

  const getNotificationStats = () => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.isRead).length;
    const urgent = notifications.filter(n => n.type === 'alert' || n.type === 'emergency').length;
    
    return { total, unread, urgent };
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'alert':
        return '⚠️';
      case 'emergency':
        return '🚨';
      case 'success':
        return '✅';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getPriorityColor = (type) => {
    switch (type) {
      case 'emergency':
        return '#e74c3c';
      case 'alert':
        return '#f39c12';
      case 'success':
        return '#2ecc71';
      case 'info':
      default:
        return '#3498db';
    }
  };

  const stats = getNotificationStats();

  if (loading && notifications.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Chargement des notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Notifications</Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3498db']}
          />
        }
      >
        {/* Statistiques */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Aperçu</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, styles.unreadStat]}>{stats.unread}</Text>
              <Text style={styles.statLabel}>Non lues</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, styles.urgentStat]}>{stats.urgent}</Text>
              <Text style={styles.statLabel}>Urgentes</Text>
            </View>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleMarkAllAsRead}
            disabled={stats.unread === 0}
          >
            <Text style={[
              styles.actionButtonText,
              stats.unread === 0 && styles.actionButtonDisabled
            ]}>
              📋 Tout marquer comme lu
            </Text>
          </TouchableOpacity>
        </View>

        {/* Paramètres des notifications */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Paramètres des Alertes</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Alertes Signalements</Text>
              <Text style={styles.settingDescription}>Nouveaux signalements urgents</Text>
            </View>
            <Switch
              value={settings.reportAlerts}
              onValueChange={() => handleSettingToggle('reportAlerts')}
              trackColor={{ false: '#767577', true: '#3498db' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Alertes Collectes</Text>
              <Text style={styles.settingDescription}>Changements d'horaire</Text>
            </View>
            <Switch
              value={settings.collectionAlerts}
              onValueChange={() => handleSettingToggle('collectionAlerts')}
              trackColor={{ false: '#767577', true: '#3498db' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Modifications Planning</Text>
              <Text style={styles.settingDescription}>Changements d'affectation</Text>
            </View>
            <Switch
              value={settings.scheduleChanges}
              onValueChange={() => handleSettingToggle('scheduleChanges')}
              trackColor={{ false: '#767577', true: '#3498db' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Alertes Urgence</Text>
              <Text style={styles.settingDescription}>Situations critiques</Text>
            </View>
            <Switch
              value={settings.emergencyAlerts}
              onValueChange={() => handleSettingToggle('emergencyAlerts')}
              trackColor={{ false: '#767577', true: '#3498db' }}
            />
          </View>
        </View>

        {/* Liste des notifications */}
        <View style={styles.notificationsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notifications Récentes</Text>
            <Text style={styles.notificationsCount}>
              {notifications.length} notification(s)
            </Text>
          </View>

          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📭</Text>
              <Text style={styles.emptyStateTitle}>Aucune notification</Text>
              <Text style={styles.emptyStateText}>
                Vous serez notifié des nouveaux signalements et alertes ici.
              </Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationItem,
                  !notification.isRead && styles.unreadNotification,
                  { borderLeftColor: getPriorityColor(notification.type) }
                ]}
                onPress={() => handleMarkAsRead(notification.id)}
                onLongPress={() => handleDeleteNotification(notification.id)}
              >
                <View style={styles.notificationHeader}>
                  <View style={styles.notificationTitleContainer}>
                    <Text style={styles.notificationIcon}>
                      {getNotificationIcon(notification.type)}
                    </Text>
                    <Text style={styles.notificationTitle}>
                      {notification.title}
                    </Text>
                  </View>
                  {!notification.isRead && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>Nouveau</Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>
                
                <View style={styles.notificationFooter}>
                  <Text style={styles.notificationDate}>
                    {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteNotification(notification.id)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#7f8c8d',
  },
  header: {
    backgroundColor: '#3498db',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  statsSection: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 5,
  },
  unreadStat: {
    color: '#e74c3c',
  },
  urgentStat: {
    color: '#f39c12',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  actionsSection: {
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  settingsSection: {
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  notificationsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  notificationsCount: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  unreadNotification: {
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
    lineHeight: 18,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationDate: {
    fontSize: 12,
    color: '#bdc3c7',
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#e74c3c',
  },
});

export default WorkerNotifications;