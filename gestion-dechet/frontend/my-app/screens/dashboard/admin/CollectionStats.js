import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { collectionScheduleService } from '../../../services/collectionScheduleService';

const CollectionStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await collectionScheduleService.getCollectionStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#9b59b6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Statistiques des Collectes</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Par Type de Déchet</Text>
        {stats?.byWasteType?.map((item, index) => (
          <View key={index} style={styles.statItem}>
            <Text style={styles.statLabel}>{item.wasteType}</Text>
            <Text style={styles.statValue}>{item.totalSchedules} plannings</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Par Zone</Text>
        {stats?.byZone?.map((item, index) => (
          <View key={index} style={styles.statItem}>
            <Text style={styles.statLabel}>Zone {item.zone}</Text>
            <Text style={styles.statValue}>{item.scheduleCount} plannings</Text>
          </View>
        ))}
      </View>
    </ScrollView>
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
  header: {
    backgroundColor: '#9b59b6',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  statLabel: {
    fontSize: 16,
    color: '#2c3e50',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9b59b6',
  },
});

export default CollectionStats;