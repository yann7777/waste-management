// ReportDetail.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity
} from 'react-native';
import { reportService } from '../../../services/reportService';

const ReportDetail = ({ route, navigation }) => {
  const { reportId } = route.params;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportDetail();
  }, [reportId]);

  const loadReportDetail = async () => {
    try {
      setLoading(true);
      const response = await reportService.getReportById(reportId);
      if (response.success) {
        setReport(response.data.report);
      } else {
        Alert.alert('Erreur', response.message || 'Impossible de charger le signalement');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Erreur détail signalement:', error);
      Alert.alert('Erreur', 'Impossible de charger le signalement');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'in_progress': return '#3498db';
      case 'resolved': return '#27ae60';
      case 'cancelled': return '#e74c3c';
      default: return '#7f8c8d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'in_progress': return 'En cours';
      case 'resolved': return 'Résolu';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const getTypeText = (type) => {
    const types = {
      'illegal_dumping': 'Dépôt sauvage',
      'bulky_waste': 'Encombrants',
      'hazardous_waste': 'Déchets dangereux',
      'electronic_waste': 'Déchets électroniques',
      'other': 'Autre'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Chargement du signalement...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Signalement non trouvé</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Détail du Signalement</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
          <Text style={styles.statusText}>{getStatusText(report.status)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Informations</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Type:</Text>
          <Text style={styles.infoValue}>{getTypeText(report.type)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Sévérité:</Text>
          <Text style={styles.infoValue}>{report.severity}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>
            {new Date(report.createdAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>

        {report.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.infoLabel}>Description:</Text>
            <Text style={styles.descriptionText}>{report.description}</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Localisation</Text>
        <Text style={styles.locationText}>
          {report.location?.address || 
           `${report.location?.latitude?.toFixed(6)}, ${report.location?.longitude?.toFixed(6)}`}
        </Text>
      </View>

      {report.photos && report.photos.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Photos ({report.photos.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photosContainer}>
              {report.photos.map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo.url || photo.uri }}
                  style={styles.photo}
                  resizeMode="cover"
                />
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {report.resolutionNotes && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes de résolution</Text>
          <Text style={styles.notesText}>{report.resolutionNotes}</Text>
        </View>
      )}

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Retour à la liste</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#7f8c8d',
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#7f8c8d',
    flex: 2,
    textAlign: 'right',
  },
  descriptionSection: {
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
    marginTop: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  photosContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  photo: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  backButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginVertical: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReportDetail;