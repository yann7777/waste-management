import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { reportService } from '../../../services/reportService';
import { collectionScheduleService } from '../../../services/collectionScheduleService';

const WorkerDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [scheduledCollectionsCount, setScheduledCollectionsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Récupérer les données des signalements et collectes
  const fetchWorkerData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les signalements en attente
      const reportsResponse = await reportService.getReports({ 
        status: 'pending',
        limit: 100
      });
      
      if (reportsResponse.success) {
        setPendingReportsCount(reportsResponse.data.reports.length);
      }

      // Récupérer les collectes programmées pour aujourd'hui
      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      const todayEnd = new Date(today.setHours(23, 59, 59, 999));

      const collectionsResponse = await collectionScheduleService.getUpcomingCollections(1);
      
      if (collectionsResponse.success) {
        // Filtrer les collectes pour aujourd'hui seulement
        const todayCollections = collectionsResponse.data.upcomingCollections.filter(schedule => {
          const collectionDate = new Date(schedule.nextCollection);
          return collectionDate >= todayStart && collectionDate <= todayEnd;
        });
        
        setScheduledCollectionsCount(todayCollections.length);
      }

    } catch (error) {
      console.error('Erreur lors du chargement des données worker:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerData();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  // Afficher un indicateur de chargement
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Chargement des données...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.welcome}>Bonjour, {user?.firstName}!</Text>
          <Text style={styles.role}>Employé CleanCity</Text>
          <View style={styles.statsBadge}>
            <Text style={styles.statsText}>Zone: Centre-ville</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Tâches du jour */}
        <Text style={styles.sectionTitle}>Tâches du Jour</Text>
        
        <View style={styles.tasksContainer}>
          <TouchableOpacity 
            style={styles.taskCard}
            onPress={() => navigation.navigate('PendingReports')}
          >
            <View style={styles.taskHeader}>
              <Text style={styles.taskIcon}>📋</Text>
              <Text style={styles.taskBadge}>{pendingReportsCount}</Text>
            </View>
            <Text style={styles.taskTitle}>Signalements en attente</Text>
            <Text style={styles.taskDescription}>À traiter aujourd'hui</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.taskCard}
            onPress={() => navigation.navigate('CollectionRoute')}
          >
            <View style={styles.taskHeader}>
              <Text style={styles.taskIcon}>🚚</Text>
              <Text style={styles.taskBadge}>{scheduledCollectionsCount}</Text>
            </View>
            <Text style={styles.taskTitle}>Collectes programmées</Text>
            <Text style={styles.taskDescription}>Itinéraire optimisé</Text>
          </TouchableOpacity>
        </View>

        {/* Actions rapides */}
        <Text style={styles.sectionTitle}>Actions Rapides</Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('ReportManagement')}
          >
            <Text style={styles.actionIcon}>✅</Text>
            <Text style={styles.actionTitle}>Traiter</Text>
            <Text style={styles.actionDescription}>Signalements</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('UpdateSchedule')}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionTitle}>Planifier</Text>
            <Text style={styles.actionDescription}>Collectes</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('CenterManagement')}
          >
            <Text style={styles.actionIcon}>🏢</Text>
            <Text style={styles.actionTitle}>Centres</Text>
            <Text style={styles.actionDescription}>Recyclage</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('WorkerStats')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionTitle}>Statistiques</Text>
            <Text style={styles.actionDescription}>Performance</Text>
          </TouchableOpacity>

          {/* Nouvelle carte Chat */}
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('WorkerChat')}
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionTitle}>Chat</Text>
            <Text style={styles.actionDescription}>Communication</Text>
          </TouchableOpacity>

          {/* Nouvelle carte Notifications */}
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('WorkerNotifications')}
          >
            <Text style={styles.actionIcon}>🔔</Text>
            <Text style={styles.actionTitle}>Notifications</Text>
            <Text style={styles.actionDescription}>Alertes</Text>
          </TouchableOpacity>
        </View>

        {/* Déconnexion */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#3498db',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  userInfo: {
    alignItems: 'center',
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  role: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 15,
  },
  statsBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  statsText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    marginTop: 10,
  },
  tasksContainer: {
    marginBottom: 20,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskIcon: {
    fontSize: 24,
  },
  taskBadge: {
    backgroundColor: '#e74c3c',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  taskDescription: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  actionDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Styles pour l'indicateur de chargement
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
});

export default WorkerDashboard;