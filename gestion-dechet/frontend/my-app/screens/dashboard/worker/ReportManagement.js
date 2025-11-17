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
  Modal,
  TextInput
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { reportService } from '../../../services/reportService';

const ReportManagement = ({ navigation }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    resolved: 0,
    total: 0
  });

  // Charger les signalements
  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await reportService.getReports({ 
        limit: 50,
        page: 1
      });
      
      if (response.success) {
        setReports(response.data.reports);
        calculateStats(response.data.reports);
      }
    } catch (error) {
      console.error('Erreur chargement signalements:', error);
      Alert.alert('Erreur', 'Impossible de charger les signalements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculer les statistiques
  const calculateStats = (reportsList) => {
    const stats = {
      pending: reportsList.filter(r => r.status === 'pending').length,
      inProgress: reportsList.filter(r => r.status === 'in_progress').length,
      resolved: reportsList.filter(r => r.status === 'resolved').length,
      total: reportsList.length
    };
    setStats(stats);
  };

  // Rafraîchir la liste
  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  // Ouvrir le modal de changement de statut
  const openStatusModal = (report, status) => {
    setSelectedReport(report);
    setSelectedStatus(status);
    setResolutionNotes('');
    setStatusModalVisible(true);
  };

  // Mettre à jour le statut d'un signalement
  const updateReportStatus = async () => {
    if (!selectedReport) return;

    try {
      const response = await reportService.updateReportStatus(
        selectedReport.id,
        selectedStatus,
        resolutionNotes
      );

      if (response.success) {
        Alert.alert('Succès', 'Statut mis à jour avec succès');
        setStatusModalVisible(false);
        loadReports(); // Recharger la liste
        
        // Navigation vers les détails si résolu
        if (selectedStatus === 'resolved') {
          navigation.navigate('ReportDetail', { 
            reportId: selectedReport.id 
          });
        }
      }
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  // Navigation vers les détails
  const viewReportDetails = (report) => {
    navigation.navigate('ReportDetail', { 
      reportId: report.id 
    });
  };

  // Filtrer les signalements par statut
  const filterReportsByStatus = (status) => {
    if (status === 'all') return reports;
    return reports.filter(report => report.status === status);
  };

  // Obtenir la couleur selon le statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#e74c3c';
      case 'in_progress': return '#f39c12';
      case 'resolved': return '#27ae60';
      default: return '#7f8c8d';
    }
  };

  // Obtenir le texte du statut
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'in_progress': return 'En cours';
      case 'resolved': return 'Résolu';
      default: return status;
    }
  };

  // Obtenir la couleur selon la sévérité
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#e74c3c';
      case 'high': return '#e67e22';
      case 'medium': return '#f1c40f';
      case 'low': return '#27ae60';
      default: return '#7f8c8d';
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Composant de carte de signalement
  const ReportCard = ({ report }) => (
    <TouchableOpacity 
      style={styles.reportCard}
      onPress={() => viewReportDetails(report)}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportType}>
          <Text style={styles.reportTypeText}>
            {report.type || 'Non spécifié'}
          </Text>
        </View>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: getStatusColor(report.status) }
        ]}>
          <Text style={styles.statusText}>
            {getStatusText(report.status)}
          </Text>
        </View>
      </View>

      <Text style={styles.reportDescription} numberOfLines={2}>
        {report.description || 'Aucune description'}
      </Text>

      <View style={styles.reportDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Sévérité:</Text>
          <View style={[
            styles.severityBadge,
            { backgroundColor: getSeverityColor(report.severity) }
          ]}>
            <Text style={styles.severityText}>
              {report.severity || 'medium'}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Signalé par:</Text>
          <Text style={styles.detailValue}>
            {report.user?.firstName} {report.user?.lastName}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>
            {new Date(report.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Actions rapides */}
      <View style={styles.actionsContainer}>
        {report.status === 'pending' && (
          <>
            <TouchableOpacity 
              style={[styles.actionButton, styles.startButton]}
              onPress={() => openStatusModal(report, 'in_progress')}
            >
              <Text style={styles.actionButtonText}>Démarrer</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.resolveButton]}
              onPress={() => openStatusModal(report, 'resolved')}
            >
              <Text style={styles.actionButtonText}>Résoudre</Text>
            </TouchableOpacity>
          </>
        )}

        {report.status === 'in_progress' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.resolveButton]}
            onPress={() => openStatusModal(report, 'resolved')}
          >
            <Text style={styles.actionButtonText}>Marquer résolu</Text>
          </TouchableOpacity>
        )}

        {report.status === 'resolved' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.reopenButton]}
            onPress={() => openStatusModal(report, 'pending')}
          >
            <Text style={styles.actionButtonText}>Rouvrir</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.actionButton, styles.detailsButton]}
          onPress={() => viewReportDetails(report)}
        >
          <Text style={styles.actionButtonText}>Détails</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Chargement des signalements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header avec statistiques */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestion des Signalements</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#e74c3c' }]}>
              {stats.pending}
            </Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#f39c12' }]}>
              {stats.inProgress}
            </Text>
            <Text style={styles.statLabel}>En cours</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#27ae60' }]}>
              {stats.resolved}
            </Text>
            <Text style={styles.statLabel}>Résolus</Text>
          </View>
        </View>
      </View>

      {/* Liste des signalements */}
      <ScrollView
        style={styles.reportsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3498db']}
          />
        }
      >
        {reports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun signalement à traiter</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={loadReports}
            >
              <Text style={styles.refreshButtonText}>Actualiser</Text>
            </TouchableOpacity>
          </View>
        ) : (
          reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))
        )}
      </ScrollView>

      {/* Modal de changement de statut */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={statusModalVisible}
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Changer le statut du signalement
            </Text>
            
            <Text style={styles.modalSubtitle}>
              Type: {selectedReport?.type}
            </Text>
            
            <Text style={styles.statusChangeText}>
              Nouveau statut: {getStatusText(selectedStatus)}
            </Text>

            <Text style={styles.notesLabel}>Notes de résolution:</Text>
            <TextInput
              style={styles.notesInput}
              multiline
              numberOfLines={4}
              placeholder="Ajoutez des notes sur la résolution..."
              value={resolutionNotes}
              onChangeText={setResolutionNotes}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setStatusModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={updateReportStatus}
              >
                <Text style={styles.confirmButtonText}>Confirmer</Text>
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
  header: {
    backgroundColor: '#3498db',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  reportsList: {
    flex: 1,
    padding: 15,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
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
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reportType: {
    flex: 1,
  },
  reportTypeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reportDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  reportDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '500',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  severityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: '#f39c12',
  },
  resolveButton: {
    backgroundColor: '#27ae60',
  },
  reopenButton: {
    backgroundColor: '#e74c3c',
  },
  detailsButton: {
    backgroundColor: '#3498db',
  },
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 20,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Styles pour le modal
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
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 15,
    textAlign: 'center',
  },
  statusChangeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 15,
    textAlign: 'center',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#3498db',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ReportManagement;