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
  FlatList
} from 'react-native';
import { collectionScheduleService } from '../../../services/collectionScheduleService';

const CollectionPlanning = ({ navigation }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [formData, setFormData] = useState({
    zone: '',
    wasteType: '',
    days: '',
    time: '',
    nextCollection: '',
    frequency: 'weekly'
  });

  // Types de déchets et fréquences prédéfinis
    const wasteTypes = [
        { label: 'Ordures ménagères', value: 'general' },
        { label: 'Recyclable', value: 'recyclable' },
        { label: 'Déchets verts', value: 'organic' },
        { label: 'Déchets dangereux', value: 'hazardous' }
    ];
  const frequencies = ['daily', 'weekly', 'biweekly', 'monthly'];
  const frequencyLabels = {
    daily: 'Quotidienne',
    weekly: 'Hebdomadaire',
    biweekly: 'Bimensuelle',
    monthly: 'Mensuelle'
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const response = await collectionScheduleService.getSchedules();
      if (response.success) {
        setSchedules(response.data.schedules || []);
      }
    } catch (error) {
      console.error('Erreur chargement plannings:', error);
      Alert.alert('Erreur', 'Impossible de charger les plannings de collecte');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSchedules();
  };

  const openAddModal = () => {
    setSelectedSchedule(null);
    setFormData({
      zone: '',
      wasteType: '',
      days: '',
      time: '',
      nextCollection: '',
      frequency: 'weekly'
    });
    setModalVisible(true);
  };

  const openEditModal = (schedule) => {
    setSelectedSchedule(schedule);
    
    // Gérer le format du schedule (peut être un objet ou une string)
    let days = '';
    let time = '';
    
    if (typeof schedule.schedule === 'object') {
      days = schedule.schedule.days || '';
      time = schedule.schedule.time || '';
    } else {
      // Si c'est une string, essayer de parser
      days = schedule.schedule || '';
    }

    setFormData({
      zone: schedule.zone || '',
      wasteType: schedule.wasteType || '',
      days: days,
      time: time,
      nextCollection: schedule.nextCollection ? schedule.nextCollection.split('T')[0] : '',
      frequency: schedule.frequency || 'weekly'
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.zone || !formData.wasteType || !formData.days || !formData.nextCollection) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
        return;
      }

      // Préparer les données pour l'API
      const submitData = {
        zone: formData.zone,
        wasteType: formData.wasteType,
        schedule: {
          days: formData.days,
          time: formData.time
        },
        nextCollection: formData.nextCollection,
        frequency: formData.frequency
      };

      if (selectedSchedule) {
        // Mise à jour
        const response = await collectionScheduleService.updateSchedule(selectedSchedule.id, submitData);
        if (response.success) {
          Alert.alert('Succès', 'Planning mis à jour avec succès');
          setModalVisible(false);
          loadSchedules();
        }
      } else {
        // Création
        const response = await collectionScheduleService.createSchedule(submitData);
        if (response.success) {
          Alert.alert('Succès', 'Planning créé avec succès');
          setModalVisible(false);
          loadSchedules();
        }
      }
    } catch (error) {
      console.error('Erreur sauvegarde planning:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = (schedule) => {
    Alert.alert(
      'Confirmation',
      `Supprimer le planning pour la zone ${schedule.zone} - ${schedule.wasteType} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await collectionScheduleService.deleteSchedule(schedule.id);
              if (response.success) {
                Alert.alert('Succès', 'Planning supprimé avec succès');
                loadSchedules();
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le planning');
            }
          }
        }
      ]
    );
  };

  const calculateNextCollection = async (schedule) => {
    try {
      const response = await collectionScheduleService.calculateNextCollection(schedule.id);
      if (response.success) {
        Alert.alert('Succès', 'Prochaine collecte calculée');
        loadSchedules();
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de calculer la prochaine collecte');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Fonction pour formater l'affichage du planning
  const formatScheduleDisplay = (schedule) => {
    if (!schedule.schedule) return 'Non défini';
    
    if (typeof schedule.schedule === 'object') {
      const days = schedule.schedule.days || '';
      const time = schedule.schedule.time || '';
      return time ? `${days} ${time}` : days;
    }
    
    return schedule.schedule;
  };

  const renderScheduleItem = ({ item }) => (
    <View style={styles.scheduleCard}>
      <View style={styles.scheduleHeader}>
        <Text style={styles.zoneText}>Zone {item.zone}</Text>
        <Text style={styles.wasteTypeText}>{item.wasteType}</Text>
      </View>
      
      <View style={styles.scheduleDetails}>
        <Text style={styles.detailText}>📅 {formatScheduleDisplay(item)}</Text>
        <Text style={styles.detailText}>🔄 {frequencyLabels[item.frequency] || item.frequency}</Text>
        <Text style={styles.detailText}>
          ⏰ Prochaine: {formatDate(item.nextCollection)}
        </Text>
      </View>

      <View style={styles.scheduleActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.actionButtonText}>Modifier</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.calculateButton]}
          onPress={() => calculateNextCollection(item)}
        >
          <Text style={styles.actionButtonText}>Recalculer</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item)}
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
        <Text style={styles.loadingText}>Chargement des plannings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Planning des Collectes</Text>
        <Text style={styles.headerSubtitle}>
          Gérer les plannings de collecte par zone
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Nouveau Planning</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.statsButton}
          onPress={() => navigation.navigate('CollectionStats')}
        >
          <Text style={styles.statsButtonText}>📊 Statistiques</Text>
        </TouchableOpacity>
      </View>

      {/* Liste des plannings */}
      <FlatList
        data={schedules}
        renderItem={renderScheduleItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun planning de collecte</Text>
            <Text style={styles.emptySubtext}>
              Créez votre premier planning de collecte
            </Text>
          </View>
        }
      />

      {/* Modal d'ajout/modification */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedSchedule ? 'Modifier le Planning' : 'Nouveau Planning'}
            </Text>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Zone *</Text>
              <TextInput
                style={styles.input}
                value={formData.zone}
                onChangeText={(text) => setFormData({...formData, zone: text})}
                placeholder="Ex: A, B, Centre-ville..."
              />

              <Text style={styles.label}>Type de déchet *</Text>
                <View style={styles.pickerContainer}>
                    {wasteTypes.map((type) => (
                        <TouchableOpacity
                        key={type.value}
                        style={[
                            styles.pickerOption,
                            formData.wasteType === type.value && styles.pickerOptionSelected
                        ]}
                        onPress={() => setFormData({...formData, wasteType: type.value})}
                        >
                        <Text style={[
                            styles.pickerOptionText,
                            formData.wasteType === type.value && styles.pickerOptionTextSelected
                        ]}>
                            {type.label}
                        </Text>
                        </TouchableOpacity>
                    ))}
                </View>

              <Text style={styles.label}>Jours de collecte *</Text>
              <TextInput
                style={styles.input}
                value={formData.days}
                onChangeText={(text) => setFormData({...formData, days: text})}
                placeholder="Ex: Lundi, Mercredi, Vendredi"
                multiline
              />

              <Text style={styles.label}>Heure de collecte</Text>
              <TextInput
                style={styles.input}
                value={formData.time}
                onChangeText={(text) => setFormData({...formData, time: text})}
                placeholder="Ex: 8h-12h, 14h-18h"
              />

              <Text style={styles.label}>Fréquence *</Text>
              <View style={styles.pickerContainer}>
                {frequencies.map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.pickerOption,
                      formData.frequency === freq && styles.pickerOptionSelected
                    ]}
                    onPress={() => setFormData({...formData, frequency: freq})}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      formData.frequency === freq && styles.pickerOptionTextSelected
                    ]}>
                      {frequencyLabels[freq]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Prochaine collecte *</Text>
              <TextInput
                style={styles.input}
                value={formData.nextCollection}
                onChangeText={(text) => setFormData({...formData, nextCollection: text})}
                placeholder="YYYY-MM-DD"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>
                  {selectedSchedule ? 'Modifier' : 'Créer'}
                </Text>
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
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  addButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
    flex: 1,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
  },
  statsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
  },
  scheduleCard: {
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
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  zoneText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  wasteTypeText: {
    fontSize: 14,
    color: '#9b59b6',
    fontWeight: '600',
  },
  scheduleDetails: {
    marginBottom: 15,
  },
  detailText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  scheduleActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
  },
  editButton: {
    backgroundColor: '#3498db',
  },
  calculateButton: {
    backgroundColor: '#f39c12',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: {
    maxHeight: 400,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  pickerOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    margin: 5,
    flex: 1,
    minWidth: '45%',
  },
  pickerOptionSelected: {
    borderColor: '#9b59b6',
    backgroundColor: '#9b59b620',
  },
  pickerOptionText: {
    textAlign: 'center',
    color: '#7f8c8d',
  },
  pickerOptionTextSelected: {
    color: '#9b59b6',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
  submitButton: {
    backgroundColor: '#27ae60',
  },
  cancelButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  submitButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default CollectionPlanning;