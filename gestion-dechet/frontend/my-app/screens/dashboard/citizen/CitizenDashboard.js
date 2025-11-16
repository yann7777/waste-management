import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { reportService } from '../../../services/reportService';
import { ecoActionService } from '../../../services/ecoActionService';


const CitizenDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    reportsCount: 0,
    eventsCount: 0,
    totalPoints: 0
  });
  const [userReports, setUserReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Charger les données au montage du composant
  useEffect(() => {
    loadUserStats();
    loadUserReports();
  }, []);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      
      // Récupérer les signalements de l'utilisateur
      const reportsResponse = await reportService.getUserReports(1, 1);
      const reportsCount = reportsResponse.data?.pagination?.count || 0;

      // Récupérer les actions écologiques pour avoir les points à jour
      const ecoActionsResponse = await ecoActionService.getUserActions();
      const totalPoints = ecoActionsResponse.data?.summary?.totalPoints || user?.ecoPoints || 0;

      // Pour les événements, on peut utiliser une valeur par défaut pour l'instant
      const eventsCount = 0;

      setStats({
        reportsCount,
        eventsCount,
        totalPoints
      });

    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      // En cas d'erreur, utiliser les points de l'utilisateur depuis le contexte
      setStats(prevStats => ({
        ...prevStats,
        totalPoints: user?.ecoPoints || 0
      }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // NOUVELLE FONCTION : Charger les signalements de l'utilisateur
  const loadUserReports = async (page = 1, limit = 5) => {
    try {
      setReportsLoading(true);
      const response = await reportService.getUserReports(page, limit);
      
      if (response.success) {
        setUserReports(response.data.reports);
        
        // Mettre à jour le compteur de signalements dans les stats
        setStats(prevStats => ({
          ...prevStats,
          reportsCount: response.data.pagination.count
        }));
      } else {
        Alert.alert('Erreur', response.message || 'Erreur lors du chargement des signalements');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des signalements:', error);
      Alert.alert('Erreur', 'Impossible de charger vos signalements');
    } finally {
      setReportsLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserStats();
    loadUserReports();
  };

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

  // Fonction pour naviguer vers la liste complète des signalements
  const navigateToReportsList = () => {
    navigation.navigate('UserReports');
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Fonction pour obtenir la couleur selon le statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'in_progress': return '#3498db';
      case 'resolved': return '#27ae60';
      case 'cancelled': return '#e74c3c';
      default: return '#7f8c8d';
    }
  };

  // Fonction pour traduire le statut
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'in_progress': return 'En cours';
      case 'resolved': return 'Résolu';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.welcome}>Bonjour, {user?.firstName}!</Text>
          <Text style={styles.role}>Citoyen CleanCity</Text>
          <View style={styles.pointsContainer}>
            <Text style={styles.points}>
              {loading ? '...' : stats.totalPoints} points écologiques
            </Text>
            <Text style={styles.level}>Niveau {user?.level || 1}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#27ae60']}
          />
        }
      >
        {/* Actions rapides */}
        <Text style={styles.sectionTitle}>Actions Rapides</Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('CreateReport')}
          >
            <Text style={styles.actionIcon}>🚨</Text>
            <Text style={styles.actionTitle}>Signaler</Text>
            <Text style={styles.actionDescription}>Dépôt sauvage</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={navigateToReportsList}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionTitle}>Mes Signalements</Text>
            <Text style={styles.actionDescription}>Voir l'historique</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Events')}  // Changement ici
          >
            <Text style={styles.actionIcon}>🧹</Text>
            <Text style={styles.actionTitle}>Événements</Text>
            <Text style={styles.actionDescription}>Nettoyage</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('RecyclingCenters')}  // Nouvelle route à créer
          >
            <Text style={styles.actionIcon}>♻️</Text>
            <Text style={styles.actionTitle}>Recyclage</Text>
            <Text style={styles.actionDescription}>Centres proches</Text>
          </TouchableOpacity>
        </View>

        {/* Derniers signalements */}
        <View style={styles.reportsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes Derniers Signalements</Text>
            <TouchableOpacity onPress={navigateToReportsList}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {reportsLoading ? (
            <ActivityIndicator size="small" color="#27ae60" />
          ) : userReports.length > 0 ? (
            <View style={styles.reportsList}>
              {userReports.slice(0, 3).map((report) => (
                <TouchableOpacity 
                  key={report.id} 
                  style={styles.reportItem}
                  onPress={() => navigation.navigate('UserReports', { reportId: report.id })}
                >
                  <View style={styles.reportHeader}>
                    <Text style={styles.reportType}>{report.type}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(report.status)}</Text>
                    </View>
                  </View>
                  {report.description && (
                    <Text style={styles.reportDescription} numberOfLines={2}>
                      {report.description}
                    </Text>
                  )}
                  <Text style={styles.reportDate}>
                    {formatDate(report.createdAt)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📋</Text>
              <Text style={styles.emptyStateText}>Aucun signalement</Text>
              <Text style={styles.emptyStateSubtext}>
                Créez votre premier signalement pour contribuer à CleanCity
              </Text>
            </View>
          )}
        </View>

        {/* Statistiques réelles */}
        <Text style={styles.sectionTitle}>Mes Statistiques</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {loading ? '...' : stats.reportsCount}
            </Text>
            <Text style={styles.statLabel}>Signalements</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {loading ? '...' : stats.eventsCount}
            </Text>
            <Text style={styles.statLabel}>Événements</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {loading ? '...' : stats.totalPoints}
            </Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        </View>

        {/* Section d'information */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Comment ça marche ?</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📸</Text>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoStep}>1. Prenez des photos</Text>
              <Text style={styles.infoDescription}>Photographiez le dépôt sauvage sous différents angles</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📍</Text>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoStep}>2. Localisez le problème</Text>
              <Text style={styles.infoDescription}>La géolocalisation se fait automatiquement</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>⏱️</Text>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoStep}>3. Suivez le traitement</Text>
              <Text style={styles.infoDescription}>Consultez l'avancement de vos signalements</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🏆</Text>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoStep}>4. Gagnez des points</Text>
              <Text style={styles.infoDescription}>Chaque signalement vous rapporte des points écologiques</Text>
            </View>
          </View>
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
    backgroundColor: '#27ae60',
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
  pointsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  points: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 10,
  },
  level: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    color: '#27ae60',
    fontWeight: '600',
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  reportsSection: {
    marginBottom: 20,
  },
  reportsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
  },
  reportItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  reportDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  reportDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 5,
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoStep: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  infoDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    lineHeight: 16,
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
});

export default CitizenDashboard;