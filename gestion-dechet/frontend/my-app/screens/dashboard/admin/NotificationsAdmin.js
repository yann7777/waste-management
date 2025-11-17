import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch
} from 'react-native';
import { notificationService } from '../../../services/notificationService';

const NotificationsAdmin = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState('all');
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info',
    actionUrl: '',
    isGlobal: false,
    targetRole: 'citizen'
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications({ limit: 50 });
      if (response.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
      Alert.alert('Erreur', 'Impossible de charger les notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationForm.title || !notificationForm.message) {
      Alert.alert('Erreur', 'Veuillez remplir le titre et le message');
      return;
    }

    try {
      setLoading(true);
      
      if (notificationForm.isGlobal) {
        // Notification globale à tous les utilisateurs
        const response = await notificationService.broadcastNotification({
          title: notificationForm.title,
          message: notificationForm.message,
          type: notificationForm.type,
          actionUrl: notificationForm.actionUrl
        });

        if (response.success) {
          Alert.alert('Succès', `Notification envoyée à ${response.data.usersCount} utilisateurs`);
        }
      } else {
        // Notification à un rôle spécifique
        const response = await notificationService.sendNotificationToRole({
          role: notificationForm.targetRole,
          title: notificationForm.title,
          message: notificationForm.message,
          type: notificationForm.type,
          actionUrl: notificationForm.actionUrl
        });

        if (response.success) {
          Alert.alert('Succès', `Notification envoyée aux ${notificationForm.targetRole}s`);
        }
      }

      setModalVisible(false);
      setNotificationForm({
        title: '',
        message: '',
        type: 'info',
        actionUrl: '',
        isGlobal: false,
        targetRole: 'citizen'
      });
      loadNotifications();
      
    } catch (error) {
      console.error('Erreur envoi notification:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer la notification');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationStats = () => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.isRead).length;
    const globalCount = notifications.filter(n => 
      n.title?.includes('[GLOBAL]') || n.metadata?.isGlobal
    ).length;
    
    return { total, unread, globalCount };
  };

  const stats = getNotificationStats();

  if (loading && notifications.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#9b59b6" />
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
        <Text style={styles.headerTitle}>Gestion des Notifications</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Statistiques */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.unread}</Text>
              <Text style={styles.statLabel}>Non lues</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.globalCount}</Text>
              <Text style={styles.statLabel}>Globales</Text>
            </View>
          </View>
        </View>

        {/* Bouton Nouvelle Notification */}
        <TouchableOpacity 
          style={styles.newNotificationButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.newNotificationButtonText}>+ Nouvelle Notification</Text>
        </TouchableOpacity>

        {/* Liste des notifications récentes */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Notifications Récentes</Text>
          {notifications.slice(0, 10).map((notification) => (
            <View key={notification.id} style={styles.notificationItem}>
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <View style={[
                  styles.notificationBadge,
                  notification.type === 'alert' && styles.alertBadge,
                  notification.type === 'success' && styles.successBadge
                ]}>
                  <Text style={styles.notificationBadgeText}>
                    {notification.type}
                  </Text>
                </View>
              </View>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              <View style={styles.notificationFooter}>
                <Text style={styles.notificationDate}>
                  {new Date(notification.createdAt).toLocaleDateString()}
                </Text>
                <Text style={styles.notificationStatus}>
                  {notification.isRead ? '✅ Lu' : '🔴 Non lu'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modal Nouvelle Notification */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouvelle Notification</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Titre de la notification"
              value={notificationForm.title}
              onChangeText={(text) => setNotificationForm({...notificationForm, title: text})}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Message de la notification"
              value={notificationForm.message}
              onChangeText={(text) => setNotificationForm({...notificationForm, message: text})}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Notification globale</Text>
              <Switch
                value={notificationForm.isGlobal}
                onValueChange={(value) => setNotificationForm({...notificationForm, isGlobal: value})}
                trackColor={{ false: '#767577', true: '#9b59b6' }}
              />
            </View>
            
            {!notificationForm.isGlobal && (
              <View style={styles.roleSelector}>
                <Text style={styles.selectorLabel}>Destinataires :</Text>
                <View style={styles.roleButtons}>
                  {['citizen', 'worker', 'admin'].map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleButton,
                        notificationForm.targetRole === role && styles.roleButtonSelected
                      ]}
                      onPress={() => setNotificationForm({...notificationForm, targetRole: role})}
                    >
                      <Text style={[
                        styles.roleButtonText,
                        notificationForm.targetRole === role && styles.roleButtonTextSelected
                      ]}>
                        {role === 'citizen' ? 'Citoyens' : 
                         role === 'worker' ? 'Employés' : 'Admins'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            <View style={styles.typeSelector}>
              <Text style={styles.selectorLabel}>Type :</Text>
              <View style={styles.typeButtons}>
                {[
                  { value: 'info', label: 'Information', emoji: 'ℹ️' },
                  { value: 'alert', label: 'Alerte', emoji: '⚠️' },
                  { value: 'success', label: 'Succès', emoji: '✅' }
                ].map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeButton,
                      notificationForm.type === type.value && styles.typeButtonSelected
                    ]}
                    onPress={() => setNotificationForm({...notificationForm, type: type.value})}
                  >
                    <Text style={styles.typeEmoji}>{type.emoji}</Text>
                    <Text style={[
                      styles.typeButtonText,
                      notificationForm.type === type.value && styles.typeButtonTextSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.sendButton]}
                onPress={handleSendNotification}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.sendButtonText}>Envoyer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#9b59b6',
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
    color: '#9b59b6',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  newNotificationButton: {
    backgroundColor: '#9b59b6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  newNotificationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recentSection: {
    marginBottom: 20,
  },
  notificationItem: {
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
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  notificationBadge: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  alertBadge: {
    backgroundColor: '#e74c3c',
  },
  successBadge: {
    backgroundColor: '#2ecc71',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notificationDate: {
    fontSize: 12,
    color: '#bdc3c7',
  },
  notificationStatus: {
    fontSize: 12,
    color: '#bdc3c7',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 16,
    color: '#2c3e50',
  },
  roleSelector: {
    marginBottom: 15,
  },
  typeSelector: {
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 10,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 2,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    alignItems: 'center',
  },
  roleButtonSelected: {
    backgroundColor: '#9b59b6',
  },
  roleButtonText: {
    color: '#7f8c8d',
    fontSize: 12,
    fontWeight: 'bold',
  },
  roleButtonTextSelected: {
    color: '#fff',
  },
  typeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 2,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    alignItems: 'center',
  },
  typeButtonSelected: {
    backgroundColor: '#9b59b6',
  },
  typeEmoji: {
    fontSize: 20,
    marginBottom: 5,
  },
  typeButtonText: {
    color: '#7f8c8d',
    fontSize: 12,
    fontWeight: 'bold',
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
  sendButton: {
    backgroundColor: '#2ecc71',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default NotificationsAdmin;