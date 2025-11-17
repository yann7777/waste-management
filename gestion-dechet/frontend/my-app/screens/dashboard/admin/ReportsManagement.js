import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput
} from 'react-native';
import { reportService } from '../../../services/reportService';
import { useAuth } from '../../../contexts/AuthContext';

const ReportsManagement = ({ navigation }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    severity: ''
  });

  useEffect(() => {
    loadReports();
  }, [filters]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await reportService.getReports(filters);
      if (response.success) {
        setReports(response.data.reports);
      }
    } catch (error) {
      console.error('Erreur chargement signalements:', error);
      Alert.alert('Erreur', 'Impossible de charger les signalements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const handleStatusUpdate = async () => {
    if (!selectedReport || !selectedStatus) return;

    try {
      const response = await reportService.updateReportStatus(
        selectedReport.id,
        selectedStatus,
        resolutionNotes
      );

      if (response.success) {
        Alert.alert('Succès', 'Statut mis à jour avec succès');
        setStatusModalVisible(false);
        setResolutionNotes('');
        setSelectedStatus('');
        loadReports();
      }
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la mise à jour');
    }
  };

  const openStatusModal = (report, status) => {
    setSelectedReport(report);
    setSelectedStatus(status);
    setStatusModalVisible(true);
  };

  const handleDeleteReport = (report) => {
    Alert.alert(
      'Supprimer le signalement',
      `Êtes-vous sûr de vouloir supprimer le signalement #${report.id} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await reportService.deleteReport(report.id);
              if (response.success) {
                Alert.alert('Succès', 'Signalement supprimé');
                loadReports();
              }
            } catch (error) {
              Alert.alert('Erreur', error.message || 'Erreur lors de la suppression');
            }
          }
        }
      ]
    );
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

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#e74c3c';
      case 'high': return '#e67e22';
      case 'medium': return '#f1c40f';
      case 'low': return '#27ae60';
      default: return '#7f8c8d';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fonction pour formater le nom de l'utilisateur
  const formatUserName = (user) => {
    if (!user) return 'Utilisateur inconnu';
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else {
      return 'Utilisateur';
    }
  };

  const ReportCard = ({ report }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.reportId}>
          <Text style={styles.reportIdText}>#{report.id}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
          <Text style={styles.statusText}>
            {report.status === 'pending' ? 'En attente' : 
             report.status === 'in_progress' ? 'En cours' :
             report.status === 'resolved' ? 'Résolu' : 'Annulé'}
          </Text>
        </View>
      </View>

      <View style={styles.reportContent}>
        <Text style={styles.reportType}>{report.type}</Text>
        <Text style={styles.reportDescription} numberOfLines={2}>
          {report.description || 'Aucune description'}
        </Text>
        
        <View style={styles.reportMeta}>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(report.severity) }]}>
            <Text style={styles.severityText}>
              {report.severity === 'critical' ? 'Critique' :
               report.severity === 'high' ? 'Élevée' :
               report.severity === 'medium' ? 'Moyenne' : 'Faible'}
            </Text>
          </View>
          
          <Text style={styles.dateText}>
            {formatDate(report.createdAt)}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userText}>
            Signalé par: {formatUserName(report.user)}
          </Text>
          {report.user?.email && (
            <Text style={styles.userEmail}>
              {report.user.email}
            </Text>
          )}
        </View>

        {report.photos && report.photos.length > 0 && (
          <View style={styles.photosInfo}>
            <Text style={styles.photosText}>
              📷 {report.photos.length} photo(s)
            </Text>
          </View>
        )}
      </View>

      <View style={styles.reportActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('ReportDetail', { reportId: report.id })}
        >
          <Text style={styles.actionButtonText}>Voir</Text>
        </TouchableOpacity>

        {report.status !== 'resolved' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.progressButton]}
            onPress={() => openStatusModal(report, 'in_progress')}
          >
            <Text style={styles.actionButtonText}>En cours</Text>
          </TouchableOpacity>
        )}

        {report.status !== 'resolved' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.resolveButton]}
            onPress={() => openStatusModal(report, 'resolved')}
          >
            <Text style={styles.actionButtonText}>Résoudre</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteReport(report)}
        >
          <Text style={styles.actionButtonText}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#9b59b6" />
        <Text style={styles.loadingText}>Chargement des signalements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestion des Signalements</Text>
        <Text style={styles.headerSubtitle}>
          {reports.length} signalement(s) trouvé(s)
        </Text>
      </View>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Filtres</Text>
        <View style={styles.filtersRow}>
          <TouchableOpacity 
            style={[styles.filterButton, filters.status === '' && styles.filterButtonActive]}
            onPress={() => setFilters({...filters, status: ''})}
          >
            <Text style={styles.filterButtonText}>Tous</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filters.status === 'pending' && styles.filterButtonActive]}
            onPress={() => setFilters({...filters, status: 'pending'})}
          >
            <Text style={styles.filterButtonText}>En attente</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filters.status === 'in_progress' && styles.filterButtonActive]}
            onPress={() => setFilters({...filters, status: 'in_progress'})}
          >
            <Text style={styles.filterButtonText}>En cours</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filters.status === 'resolved' && styles.filterButtonActive]}
            onPress={() => setFilters({...filters, status: 'resolved'})}
          >
            <Text style={styles.filterButtonText}>Résolus</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste des signalements */}
      <ScrollView 
        style={styles.reportsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#9b59b6']}
          />
        }
      >
        {reports.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Aucun signalement trouvé</Text>
            <Text style={styles.emptyStateSubtext}>
              Aucun signalement ne correspond aux critères sélectionnés
            </Text>
          </View>
        ) : (
          reports.map(report => (
            <ReportCard key={report.id} report={report} />
          ))
        )}
      </ScrollView>

      {/* Modal de mise à jour du statut */}
      <Modal
        visible={statusModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Mettre à jour le statut
            </Text>
            <Text style={styles.modalSubtitle}>
              Signalement #{selectedReport?.id}
            </Text>

            <TextInput
              style={styles.notesInput}
              placeholder="Notes de résolution (optionnel)"
              value={resolutionNotes}
              onChangeText={setResolutionNotes}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setStatusModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleStatusUpdate}
              >
                <Text style={styles.modalButtonText}>Confirmer</Text>
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
    padding: 15,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 15,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 6,
  },
  filterButtonActive: {
    backgroundColor: '#9b59b6',
  },
  filterButtonText: {
    color: '#2c3e50',
    fontSize: 11,
    fontWeight: '500',
  },
  reportsList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportId: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  reportIdText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#7f8c8d',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  reportContent: {
    marginBottom: 12,
  },
  reportType: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  reportMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  severityText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 11,
    color: '#95a5a6',
  },
  userInfo: {
    marginBottom: 4,
  },
  userText: {
    fontSize: 11,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 10,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  photosInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photosText: {
    fontSize: 11,
    color: '#7f8c8d',
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  actionButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  progressButton: {
    backgroundColor: '#f39c12',
  },
  resolveButton: {
    backgroundColor: '#27ae60',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#bdc3c7',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 15,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  confirmButton: {
    backgroundColor: '#9b59b6',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ReportsManagement;