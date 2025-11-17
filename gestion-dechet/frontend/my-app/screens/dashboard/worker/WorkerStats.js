// WorkerStats.js
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
import { useAuth } from '../../../contexts/AuthContext';
import { reportService } from '../../../services/reportService';
import { collectionScheduleService } from '../../../services/collectionScheduleService';

const WorkerStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    overview: {
      reportsResolved: 0,
      collectionsCompleted: 0,
      efficiencyRate: 0,
      avgResolutionTime: 0
    },
    weeklyPerformance: [],
    reportTypes: [],
    zoneStats: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('7days'); // 7days, 30days, 90days

  useEffect(() => {
    loadWorkerStats();
  }, [timeRange]);

  const loadWorkerStats = async () => {
    try {
      setLoading(true);
      
      // Récupérer les données des signalements traités par le worker
      const reportsResponse = await reportService.getWorkerReports({
        workerId: user?.id,
        timeRange: timeRange
      });
      
      // Récupérer les données des collectes effectuées
      const collectionsResponse = await collectionScheduleService.getWorkerCollections({
        workerId: user?.id,
        timeRange: timeRange
      });

      // Calculer les statistiques
      const reportsData = reportsResponse.success ? reportsResponse.data : { reports: [] };
      const collectionsData = collectionsResponse.success ? collectionsResponse.data : { collections: [] };
      
      const resolvedReports = reportsData.reports.filter(report => 
        report.status === 'resolved' || report.status === 'completed'
      );
      
      const completedCollections = collectionsData.collections.filter(collection => 
        collection.status === 'completed'
      );

      // Calcul du temps moyen de résolution
      const avgResolutionTime = calculateAverageResolutionTime(resolvedReports);
      
      // Calcul du taux d'efficacité
      const efficiencyRate = calculateEfficiencyRate(resolvedReports, reportsData.reports);

      // Statistiques par type de signalement
      const reportTypes = calculateReportTypes(reportsData.reports);
      
      // Statistiques par zone
      const zoneStats = calculateZoneStats(reportsData.reports);

      // Performance hebdomadaire
      const weeklyPerformance = calculateWeeklyPerformance(resolvedReports, timeRange);

      setStats({
        overview: {
          reportsResolved: resolvedReports.length,
          collectionsCompleted: completedCollections.length,
          efficiencyRate,
          avgResolutionTime
        },
        weeklyPerformance,
        reportTypes,
        zoneStats
      });

    } catch (error) {
      console.error('Erreur chargement stats worker:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateAverageResolutionTime = (reports) => {
    if (reports.length === 0) return 0;
    
    const totalTime = reports.reduce((sum, report) => {
      if (report.resolvedAt && report.createdAt) {
        const created = new Date(report.createdAt);
        const resolved = new Date(report.resolvedAt);
        return sum + (resolved - created);
      }
      return sum;
    }, 0);
    
    return Math.round(totalTime / reports.length / (1000 * 60 * 60)); // en heures
  };

  const calculateEfficiencyRate = (resolvedReports, allReports) => {
    if (allReports.length === 0) return 0;
    return Math.round((resolvedReports.length / allReports.length) * 100);
  };

  const calculateReportTypes = (reports) => {
    const types = {};
    reports.forEach(report => {
      types[report.type] = (types[report.type] || 0) + 1;
    });
    return Object.entries(types).map(([type, count]) => ({ type, count }));
  };

  const calculateZoneStats = (reports) => {
    const zones = {};
    reports.forEach(report => {
      if (report.location) {
        const zone = report.location.zone || 'Non spécifiée';
        zones[zone] = (zones[zone] || 0) + 1;
      }
    });
    return Object.entries(zones).map(([zone, count]) => ({ zone, count }));
  };

  const calculateWeeklyPerformance = (resolvedReports, range) => {
    // Simulation de données de performance hebdomadaire
    const days = range === '7days' ? 7 : range === '30days' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      reports: Math.floor(Math.random() * 10) + 5, // Données simulées
      efficiency: Math.floor(Math.random() * 20) + 80 // 80-100%
    }));
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWorkerStats();
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
        <ActivityIndicator size="large" color="#3498db" />
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
          colors={['#3498db']}
        />
      }
    >
      {/* En-tête avec informations du worker */}
      <View style={styles.header}>
        <Text style={styles.welcome}>Statistiques de Performance</Text>
        <Text style={styles.subtitle}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.role}>Employé CleanCity</Text>
      </View>

      {/* Sélecteur de période */}
      <TimeRangeSelector />

      {/* Vue d'ensemble des performances */}
      <Text style={styles.sectionTitle}>Vue d'Ensemble</Text>
      <View style={styles.overviewGrid}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewNumber}>{stats.overview.reportsResolved}</Text>
          <Text style={styles.overviewLabel}>Signalements Résolus</Text>
          <Text style={styles.overviewTrend}>+15% cette semaine</Text>
        </View>

        <View style={styles.overviewCard}>
          <Text style={styles.overviewNumber}>{stats.overview.collectionsCompleted}</Text>
          <Text style={styles.overviewLabel}>Collectes Effectuées</Text>
          <Text style={styles.overviewTrend}>+8% cette semaine</Text>
        </View>

        <View style={styles.overviewCard}>
          <Text style={styles.overviewNumber}>{stats.overview.efficiencyRate}%</Text>
          <Text style={styles.overviewLabel}>Taux d'Efficacité</Text>
          <Text style={[styles.overviewTrend, styles.trendPositive]}>
            Excellente performance
          </Text>
        </View>

        <View style={styles.overviewCard}>
          <Text style={styles.overviewNumber}>{stats.overview.avgResolutionTime}h</Text>
          <Text style={styles.overviewLabel}>Temps Moyen</Text>
          <Text style={styles.overviewTrend}>Résolution rapide</Text>
        </View>
      </View>

      {/* Performance hebdomadaire */}
      <Text style={styles.sectionTitle}>Performance Hebdomadaire</Text>
      <View style={styles.trendCard}>
        <View style={styles.trendHeader}>
          <Text style={styles.trendTitle}>Derniers {timeRange === '7days' ? '7' : timeRange === '30days' ? '30' : '90'} jours</Text>
          <Text style={styles.trendValue}>
            {stats.weeklyPerformance.reduce((sum, day) => sum + day.reports, 0)} signalements
          </Text>
        </View>
        
        {stats.weeklyPerformance.length > 0 ? (
          <View style={styles.trendChart}>
            <View style={styles.chartBars}>
              {stats.weeklyPerformance.slice(-7).map((day, index) => (
                <View key={index} style={styles.chartBarContainer}>
                  <View 
                    style={[
                      styles.chartBar,
                      { height: Math.min((day.reports / 15) * 60, 60) }
                    ]} 
                  />
                  <Text style={styles.chartLabel}>
                    J{day.day}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.noDataText}>Aucune donnée disponible</Text>
        )}
      </View>

      {/* Répartition par type de signalement */}
      <Text style={styles.sectionTitle}>Types de Signalements</Text>
      <View style={styles.typesCard}>
        {stats.reportTypes.length > 0 ? (
          stats.reportTypes.map((type, index) => (
            <View key={index} style={styles.typeRow}>
              <View style={styles.typeInfo}>
                <Text style={styles.typeName}>{type.type}</Text>
                <Text style={styles.typeCount}>{type.count} signalements</Text>
              </View>
              <View style={styles.typePercentage}>
                <Text style={styles.percentageText}>
                  {Math.round((type.count / stats.overview.reportsResolved) * 100)}%
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>Aucun signalement traité</Text>
        )}
      </View>

      {/* Statistiques par zone */}
      <Text style={styles.sectionTitle}>Performance par Zone</Text>
      <View style={styles.zonesCard}>
        {stats.zoneStats.length > 0 ? (
          stats.zoneStats.map((zone, index) => (
            <View key={index} style={styles.zoneRow}>
              <View style={styles.zoneInfo}>
                <Text style={styles.zoneName}>{zone.zone}</Text>
                <Text style={styles.zoneCount}>{zone.count} interventions</Text>
              </View>
              <View style={[
                styles.zoneEfficiency,
                { backgroundColor: zone.count > 10 ? '#27ae60' : '#f39c12' }
              ]}>
                <Text style={styles.efficiencyText}>
                  {zone.count > 10 ? 'Élevée' : 'Moyenne'}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>Aucune donnée de zone</Text>
        )}
      </View>

      {/* Objectifs et récompenses */}
      <Text style={styles.sectionTitle}>Objectifs du Mois</Text>
      <View style={styles.goalsCard}>
        <View style={styles.goalItem}>
          <Text style={styles.goalLabel}>Signalements à résoudre</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: '75%' }]} />
          </View>
          <Text style={styles.goalProgress}>75/100</Text>
        </View>
        
        <View style={styles.goalItem}>
          <Text style={styles.goalLabel}>Collectes à effectuer</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: '60%' }]} />
          </View>
          <Text style={styles.goalProgress}>30/50</Text>
        </View>
        
        <View style={styles.goalItem}>
          <Text style={styles.goalLabel}>Taux de satisfaction</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: '90%', backgroundColor: '#27ae60' }]} />
          </View>
          <Text style={styles.goalProgress}>90%</Text>
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
  header: {
    backgroundColor: '#3498db',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  welcome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 5,
  },
  role: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
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
    backgroundColor: '#3498db',
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
    color: '#3498db',
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
  trendPositive: {
    color: '#27ae60',
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
    color: '#3498db',
  },
  trendChart: {
    marginTop: 8,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
    paddingHorizontal: 8,
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 12,
    backgroundColor: '#3498db',
    borderRadius: 6,
    marginBottom: 4,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: '#7f8c8d',
  },
  typesCard: {
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
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  typeCount: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  typePercentage: {
    backgroundColor: '#f1f2f6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3498db',
  },
  zonesCard: {
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
  zoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  zoneCount: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  zoneEfficiency: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  efficiencyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  goalsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  goalItem: {
    marginBottom: 15,
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#f1f2f6',
    borderRadius: 4,
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
  goalProgress: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'right',
  },
  noDataText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontStyle: 'italic',
    padding: 20,
  },
});

export default WorkerStats;