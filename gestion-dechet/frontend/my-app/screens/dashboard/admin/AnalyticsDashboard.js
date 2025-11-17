import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from 'react-native';
import { analysticsService } from '../../../services/analyticsService';

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState({
    overview: {
      totalUsers: 0,
      totalReports: 0,
      activeReports: 0,
      totalEcoPoints: 0
    },
    trends: {
      reports: []
    },
    topUsers: [],
    heatmapData: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('30days'); // 7days, 30days, 90days

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await analysticsService.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalyticsData();
  };

  const TimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      <Text style={styles.timeRangeLabel}>Période:</Text>
      {['7days', '30days', '90days'].map((range) => (
        <Text
          key={range}
          style={[
            styles.timeRangeButton,
            timeRange === range && styles.timeRangeButtonActive
          ]}
          onPress={() => setTimeRange(range)}
        >
          {range === '7days' ? '7j' : range === '30days' ? '30j' : '90j'}
        </Text>
      ))}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#9b59b6" />
        <Text style={styles.loadingText}>Chargement des statistiques...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#9b59b6']}
        />
      }
    >
      {/* Sélecteur de période */}
      <TimeRangeSelector />

      {/* Vue d'ensemble principale */}
      <Text style={styles.sectionTitle}>Vue d'Ensemble</Text>
      <View style={styles.overviewGrid}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewNumber}>{stats.overview.totalUsers}</Text>
          <Text style={styles.overviewLabel}>Utilisateurs Total</Text>
          <Text style={styles.overviewTrend}>+12% ce mois</Text>
        </View>

        <View style={styles.overviewCard}>
          <Text style={styles.overviewNumber}>{stats.overview.totalReports}</Text>
          <Text style={styles.overviewLabel}>Signalements Total</Text>
          <Text style={styles.overviewTrend}>+8% ce mois</Text>
        </View>

        <View style={styles.overviewCard}>
          <Text style={styles.overviewNumber}>{stats.overview.activeReports}</Text>
          <Text style={styles.overviewLabel}>Signalements Actifs</Text>
          <Text style={[styles.overviewTrend, styles.trendWarning]}>
            {((stats.overview.activeReports / stats.overview.totalReports) * 100).toFixed(1)}%
          </Text>
        </View>

        <View style={styles.overviewCard}>
          <Text style={styles.overviewNumber}>
            {stats.overview.totalEcoPoints?.toLocaleString() || 0}
          </Text>
          <Text style={styles.overviewLabel}>Points Éco Total</Text>
          <Text style={styles.overviewTrend}>+15% ce mois</Text>
        </View>
      </View>

      {/* Évolution des signalements */}
      <Text style={styles.sectionTitle}>Évolution des Signalements</Text>
      <View style={styles.trendCard}>
        <View style={styles.trendHeader}>
          <Text style={styles.trendTitle}>30 derniers jours</Text>
          <Text style={styles.trendValue}>
            {stats.trends.reports.reduce((sum, day) => sum + (day.count || 0), 0)} signalements
          </Text>
        </View>
        
        {stats.trends.reports.length > 0 ? (
          <View style={styles.trendChart}>
            {/* Graphique simplifié */}
            <View style={styles.chartBars}>
              {stats.trends.reports.slice(-7).map((day, index) => (
                <View key={index} style={styles.chartBarContainer}>
                  <View 
                    style={[
                      styles.chartBar,
                      { height: Math.min((day.count / 10) * 50, 50) }
                    ]} 
                  />
                  <Text style={styles.chartLabel}>
                    {new Date(day.date).getDate()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.noDataText}>Aucune donnée disponible</Text>
        )}
      </View>

      {/* Top utilisateurs */}
      <Text style={styles.sectionTitle}>Top Utilisateurs</Text>
      <View style={styles.topUsersCard}>
        {stats.topUsers && stats.topUsers.length > 0 ? (
          stats.topUsers.slice(0, 5).map((user, index) => (
            <View key={user.id} style={styles.userRow}>
              <View style={styles.userRank}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text style={styles.userDetails}>
                  Niveau {user.level} • {user.ecoPoints} pts
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>Aucun utilisateur trouvé</Text>
        )}
      </View>

      {/* Métriques de performance */}
      <Text style={styles.sectionTitle}>Métriques de Performance</Text>
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>78%</Text>
          <Text style={styles.metricLabel}>Taux de Résolution</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>2.3j</Text>
          <Text style={styles.metricLabel}>Temps Moyen</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>94%</Text>
          <Text style={styles.metricLabel}>Satisfaction</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>156</Text>
          <Text style={styles.metricLabel}>Actions Éco</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 10,
    color: '#7f8c8d',
    fontSize: 14,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  timeRangeLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginRight: 12,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f1f2f6',
    color: '#7f8c8d',
    fontSize: 12,
    fontWeight: '500',
  },
  timeRangeButtonActive: {
    backgroundColor: '#9b59b6',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    marginTop: 8,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  overviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9b59b6',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  overviewTrend: {
    fontSize: 11,
    color: '#27ae60',
    fontWeight: '500',
  },
  trendWarning: {
    color: '#e74c3c',
  },
  trendCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  trendValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9b59b6',
  },
  trendChart: {
    marginTop: 8,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: 8,
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 12,
    backgroundColor: '#9b59b6',
    borderRadius: 6,
    marginBottom: 4,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: '#7f8c8d',
  },
  topUsersCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  userRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7f8c8d',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  userDetails: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9b59b6',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  noDataText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontStyle: 'italic',
    padding: 20,
  },
});

export default AnalyticsDashboard;