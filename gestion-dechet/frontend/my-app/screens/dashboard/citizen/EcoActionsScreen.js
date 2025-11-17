// EcoActionsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { ecoActionService } from '../../../services/ecoActionService';

const EcoActionsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [ecoActions, setEcoActions] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [stats, setStats] = useState({
    totalPoints: 0,
    totalActions: 0,
    userRank: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEcoActionsData();
  }, []);

  const loadEcoActionsData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUserEcoActions(),
        loadRanking(),
        loadUserStats()
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données des actions écologiques');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUserEcoActions = async () => {
    try {
      const response = await ecoActionService.getUserActions();
      if (response.success) {
        setEcoActions(response.data.ecoActions || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des actions:', error);
    }
  };

  const loadRanking = async () => {
    try {
      const response = await ecoActionService.getRanking(10, 'all');
      if (response.success) {
        setRanking(response.data.ranking || []);
        
        // Trouver le rang de l'utilisateur actuel
        const userRank = response.data.ranking.findIndex(
          item => item.userId === user.id
        );
        if (userRank !== -1) {
          setStats(prev => ({ ...prev, userRank: userRank + 1 }));
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du classement:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await ecoActionService.getStats({ userId: user.id });
      if (response.success) {
        setStats(prev => ({
          ...prev,
          totalPoints: response.data.summary?.totalPoints || user.ecoPoints || 0,
          totalActions: response.data.summary?.totalActions || 0
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
      // Utiliser les données de base de l'utilisateur
      setStats(prev => ({
        ...prev,
        totalPoints: user.ecoPoints || 0
      }));
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEcoActionsData();
  };

  // Fonction pour obtenir le texte du type d'action
  const getActionTypeText = (type) => {
    const types = {
      'report_created': 'Signalement créé',
      'report_resolved': 'Signalement résolu',
      'event_participation': 'Participation événement',
      'daily_login': 'Connexion quotidienne',
      'recycling': 'Recyclage',
      'cleanup': 'Nettoyage'
    };
    return types[type] || type;
  };

  // Fonction pour obtenir l'icône du type d'action
  const getActionIcon = (type) => {
    const icons = {
      'report_created': '🚨',
      'report_resolved': '✅',
      'event_participation': '🧹',
      'daily_login': '📱',
      'recycling': '♻️',
      'cleanup': '🌱'
    };
    return icons[type] || '⭐';
  };

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Rendu d'un élément d'action
  const renderActionItem = ({ item }) => (
    <View style={styles.actionItem}>
      <View style={styles.actionHeader}>
        <Text style={styles.actionIcon}>{getActionIcon(item.type)}</Text>
        <View style={styles.actionInfo}>
          <Text style={styles.actionType}>{getActionTypeText(item.type)}</Text>
          <Text style={styles.actionDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>+{item.points}</Text>
        </View>
      </View>
      {item.description && (
        <Text style={styles.actionDescription}>{item.description}</Text>
      )}
    </View>
  );

  // Rendu d'un élément du classement
  const renderRankingItem = ({ item, index }) => (
    <View style={[
      styles.rankingItem,
      item.userId === user.id && styles.currentUserRanking
    ]}>
      <View style={styles.rankPosition}>
        <Text style={styles.rankNumber}>#{index + 1}</Text>
      </View>
      <View style={styles.rankingUserInfo}>
        <Text style={styles.rankingUserName}>
          {item.firstName} {item.lastName}
          {item.userId === user.id && ' (Vous)'}
        </Text>
        <Text style={styles.rankingUserPoints}>{item.totalPoints} points</Text>
      </View>
      <View style={styles.rankingStats}>
        <Text style={styles.rankingActions}>{item.actionCount} actions</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27ae60" />
        <Text style={styles.loadingText}>Chargement des actions écologiques...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Actions Écologiques</Text>
        <Text style={styles.headerSubtitle}>
          Gagnez des points en participant à la propreté de votre ville
        </Text>
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
        {/* Statistiques utilisateur */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Mes Statistiques</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalPoints}</Text>
              <Text style={styles.statLabel}>Points totaux</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalActions}</Text>
              <Text style={styles.statLabel}>Actions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {stats.userRank > 0 ? `#${stats.userRank}` : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Classement</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{user?.level || 1}</Text>
              <Text style={styles.statLabel}>Niveau</Text>
            </View>
          </View>
        </View>

        {/* Comment gagner des points */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Comment gagner des points ?</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>🚨</Text>
              <Text style={styles.infoTitle}>Signalements</Text>
              <Text style={styles.infoPoints}>+10 à +50 pts</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>🧹</Text>
              <Text style={styles.infoTitle}>Événements</Text>
              <Text style={styles.infoPoints}>+100 pts</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>♻️</Text>
              <Text style={styles.infoTitle}>Recyclage</Text>
              <Text style={styles.infoPoints}>+20 pts</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>📱</Text>
              <Text style={styles.infoTitle}>Quotidien</Text>
              <Text style={styles.infoPoints}>+5 pts/jour</Text>
            </View>
          </View>
        </View>

        {/* Dernières actions */}
        <View style={styles.actionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes Dernières Actions</Text>
            <TouchableOpacity onPress={loadUserEcoActions}>
              <Text style={styles.seeAllText}>Actualiser</Text>
            </TouchableOpacity>
          </View>

          {ecoActions.length > 0 ? (
            <FlatList
              data={ecoActions.slice(0, 10)}
              renderItem={renderActionItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🌱</Text>
              <Text style={styles.emptyStateText}>Aucune action écologique</Text>
              <Text style={styles.emptyStateSubtext}>
                Commencez par créer un signalement ou participez à un événement !
              </Text>
            </View>
          )}
        </View>

        {/* Classement */}
        <View style={styles.rankingSection}>
          <Text style={styles.sectionTitle}>Classement Communautaire</Text>
          {ranking.length > 0 ? (
            <FlatList
              data={ranking}
              renderItem={renderRankingItem}
              keyExtractor={(item) => item.userId.toString()}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🏆</Text>
              <Text style={styles.emptyStateText}>Classement vide</Text>
              <Text style={styles.emptyStateSubtext}>
                Soyez le premier à gagner des points !
              </Text>
            </View>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    color: '#7f8c8d',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#27ae60',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
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
  statsSection: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    width: '48%',
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
  },
  infoIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 4,
  },
  infoPoints: {
    fontSize: 11,
    color: '#27ae60',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionsSection: {
    marginBottom: 20,
  },
  actionItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  actionDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
  pointsBadge: {
    backgroundColor: '#27ae60',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pointsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionDescription: {
    fontSize: 13,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  rankingSection: {
    marginBottom: 20,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  currentUserRanking: {
    backgroundColor: '#e8f5e8',
    borderColor: '#27ae60',
    borderWidth: 1,
  },
  rankPosition: {
    width: 40,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  rankingUserInfo: {
    flex: 1,
    marginLeft: 10,
  },
  rankingUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  rankingUserPoints: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: 'bold',
  },
  rankingStats: {
    alignItems: 'flex-end',
  },
  rankingActions: {
    fontSize: 11,
    color: '#7f8c8d',
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
});

export default EcoActionsScreen;