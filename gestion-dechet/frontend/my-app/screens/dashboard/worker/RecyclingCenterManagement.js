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
  FlatList,
  Linking,
  Platform,
  RefreshControl
} from 'react-native';
import { recyclingCenterService } from '../../../services/recyclingCenterService';

const RecyclingCenterManagement = ({ navigation }) => {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // États pour le formulaire d'édition/ajout
  const [editForm, setEditForm] = useState({
    name: '',
    address: '',
    openingHours: '',
    contact: '',
    capacity: '',
    currentOccupancy: ''
  });

  // Matériaux disponibles
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const availableMaterials = [
    'plastique', 'verre', 'papier', 'carton', 'métal', 
    'aluminium', 'acier', 'textile', 'électronique', 'batteries',
    'bois', 'déchets verts', 'encombrants', 'dangereux'
  ];

  useEffect(() => {
    loadCenters();
  }, []);

  const loadCenters = async () => {
    try {
      setLoading(true);
      const response = await recyclingCenterService.getAllCenters();
      
      if (response.success) {
        setCenters(response.data.recyclingCenters);
      } else {
        Alert.alert('Erreur', response.message || 'Impossible de charger les centres');
      }
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de charger les centres de recyclage');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCenters();
  };

  const searchCenters = async () => {
    try {
      setLoading(true);
      const filters = {};
      
      if (searchQuery) {
        filters.search = searchQuery;
      }

      const response = await recyclingCenterService.getCenters(filters);
      
      if (response.success) {
        setCenters(response.data.recyclingCenters);
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
      Alert.alert('Erreur', 'Recherche échouée');
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchQuery('');
    loadCenters();
  };

  const openCenterDetails = (center) => {
    setSelectedCenter(center);
    setShowDetails(true);
  };

  const openEditCenter = (center) => {
    setSelectedCenter(center);
    setEditForm({
      name: center.name,
      address: center.address,
      openingHours: center.openingHours || '',
      contact: center.contact || '',
      capacity: center.capacity ? center.capacity.toString() : '',
      currentOccupancy: center.currentOccupancy ? center.currentOccupancy.toString() : ''
    });
    setSelectedMaterials(center.acceptedMaterials || []);
    setShowEditModal(true);
  };

  const openAddCenter = () => {
    setEditForm({
      name: '',
      address: '',
      openingHours: '',
      contact: '',
      capacity: '',
      currentOccupancy: ''
    });
    setSelectedMaterials([]);
    setShowAddModal(true);
  };

  const toggleMaterial = (material) => {
    setSelectedMaterials(prev => 
      prev.includes(material) 
        ? prev.filter(m => m !== material)
        : [...prev, material]
    );
  };

  const handleUpdateCenter = async () => {
    try {
      if (!editForm.name || !editForm.address) {
        Alert.alert('Erreur', 'Le nom et l\'adresse sont obligatoires');
        return;
      }

      const updateData = {
        name: editForm.name,
        address: editForm.address,
        openingHours: editForm.openingHours,
        contact: editForm.contact,
        capacity: editForm.capacity ? parseInt(editForm.capacity) : null,
        currentOccupancy: editForm.currentOccupancy ? parseFloat(editForm.currentOccupancy) : 0,
        acceptedMaterials: selectedMaterials
      };

      const response = await recyclingCenterService.updateCenter(selectedCenter.id, updateData);
      
      if (response.success) {
        Alert.alert('Succès', 'Centre mis à jour avec succès');
        setShowEditModal(false);
        loadCenters();
      } else {
        Alert.alert('Erreur', response.message || 'Échec de la mise à jour');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le centre');
    }
  };

  const handleAddCenter = async () => {
    try {
      if (!editForm.name || !editForm.address) {
        Alert.alert('Erreur', 'Le nom et l\'adresse sont obligatoires');
        return;
      }

      const newCenter = {
        name: editForm.name,
        address: editForm.address,
        openingHours: editForm.openingHours,
        contact: editForm.contact,
        capacity: editForm.capacity ? parseInt(editForm.capacity) : null,
        currentOccupancy: editForm.currentOccupancy ? parseFloat(editForm.currentOccupancy) : 0,
        acceptedMaterials: selectedMaterials,
        location: { lat: 0, lng: 0 } // À compléter avec la géolocalisation
      };

      const response = await recyclingCenterService.createCenter(newCenter);
      
      if (response.success) {
        Alert.alert('Succès', 'Centre créé avec succès');
        setShowAddModal(false);
        loadCenters();
      } else {
        Alert.alert('Erreur', response.message || 'Échec de la création');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer le centre');
    }
  };

  const handleDeleteCenter = (center) => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer le centre "${center.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await recyclingCenterService.deleteCenter(center.id);
              if (response.success) {
                Alert.alert('Succès', 'Centre supprimé avec succès');
                loadCenters();
              } else {
                Alert.alert('Erreur', response.message || 'Échec de la suppression');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le centre');
            }
          }
        }
      ]
    );
  };

  const updateOccupancy = async (centerId, occupancy) => {
    try {
      const response = await recyclingCenterService.updateOccupancy(centerId, occupancy);
      if (response.success) {
        Alert.alert('Succès', 'Taux d\'occupation mis à jour');
        loadCenters();
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour l\'occupation');
    }
  };

  const renderCenterCard = ({ item: center }) => (
    <View style={styles.centerCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.centerName}>{center.name}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => openEditCenter(center)}
          >
            <Text style={styles.actionText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteCenter(center)}
          >
            <Text style={styles.actionText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.centerAddress}>{center.address}</Text>
      
      <View style={styles.materialsContainer}>
        {center.acceptedMaterials?.slice(0, 3).map((material, index) => (
          <View key={index} style={styles.materialTag}>
            <Text style={styles.materialText}>{material}</Text>
          </View>
        ))}
        {center.acceptedMaterials?.length > 3 && (
          <Text style={styles.moreMaterials}>
            +{center.acceptedMaterials.length - 3}
          </Text>
        )}
      </View>

      {center.openingHours && (
        <Text style={styles.hours}>🕒 {center.openingHours}</Text>
      )}

      <View style={styles.occupancyContainer}>
        <Text style={styles.occupancyLabel}>Occupation actuelle:</Text>
        <View style={styles.occupancyControls}>
          <Text style={styles.occupancyText}>{center.currentOccupancy}%</Text>
          <View style={styles.occupancyButtons}>
            <TouchableOpacity 
              style={styles.occupancyButton}
              onPress={() => updateOccupancy(center.id, Math.max(0, center.currentOccupancy - 10))}
            >
              <Text style={styles.occupancyButtonText}>-10%</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.occupancyButton}
              onPress={() => updateOccupancy(center.id, Math.min(100, center.currentOccupancy + 10))}
            >
              <Text style={styles.occupancyButtonText}>+10%</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.occupancyBar}>
          <View 
            style={[
              styles.occupancyFill,
              { 
                width: `${center.currentOccupancy}%`,
                backgroundColor: center.currentOccupancy > 80 ? '#e74c3c' : 
                center.currentOccupancy > 60 ? '#f39c12' : '#27ae60'
              }
            ]} 
          />
        </View>
      </View>

      <TouchableOpacity 
        style={styles.detailsButton}
        onPress={() => openCenterDetails(center)}
      >
        <Text style={styles.detailsButtonText}>Voir les détails</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* En-tête avec titre et bouton d'ajout */}
      <View style={styles.header}>
        <Text style={styles.title}>🏢 Gestion des Centres</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={openAddCenter}
        >
          <Text style={styles.addButtonText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un centre..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchCenters}
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchCenters}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resetButton} onPress={resetSearch}>
          <Text style={styles.resetButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Indicateur de chargement */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      )}

      {/* Liste des centres */}
      {!loading && (
        <FlatList
          data={centers}
          renderItem={renderCenterCard}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          style={styles.centersList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3498db']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🏢</Text>
              <Text style={styles.emptyStateText}>Aucun centre de recyclage</Text>
              <Text style={styles.emptyStateSubtext}>
                Ajoutez votre premier centre de recyclage
              </Text>
            </View>
          }
        />
      )}

      {/* Modal de détails */}
      <Modal
        visible={showDetails}
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedCenter?.name}</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowDetails(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Contenu des détails similaire à RecyclingCenterSection */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>📍 Adresse</Text>
              <Text style={styles.detailValue}>{selectedCenter?.address}</Text>
            </View>

            {selectedCenter?.openingHours && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>🕒 Horaires</Text>
                <Text style={styles.detailValue}>{selectedCenter.openingHours}</Text>
              </View>
            )}

            {selectedCenter?.contact && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>📞 Contact</Text>
                <Text style={styles.detailValue}>{selectedCenter.contact}</Text>
              </View>
            )}

            {selectedCenter?.acceptedMaterials && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>♻️ Matériaux acceptés</Text>
                <View style={styles.materialsGrid}>
                  {selectedCenter.acceptedMaterials.map((material, index) => (
                    <View key={index} style={styles.detailMaterialTag}>
                      <Text style={styles.detailMaterialText}>{material}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {selectedCenter?.capacity && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>📊 Capacité</Text>
                <Text style={styles.detailValue}>{selectedCenter.capacity}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal d'édition */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Modifier le centre</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.formInput}
              placeholder="Nom du centre"
              value={editForm.name}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
            />
            
            <TextInput
              style={styles.formInput}
              placeholder="Adresse"
              value={editForm.address}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, address: text }))}
            />
            
            <TextInput
              style={styles.formInput}
              placeholder="Horaires d'ouverture"
              value={editForm.openingHours}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, openingHours: text }))}
            />
            
            <TextInput
              style={styles.formInput}
              placeholder="Contact"
              value={editForm.contact}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, contact: text }))}
            />
            
            <TextInput
              style={styles.formInput}
              placeholder="Capacité"
              value={editForm.capacity}
              keyboardType="numeric"
              onChangeText={(text) => setEditForm(prev => ({ ...prev, capacity: text }))}
            />
            
            <TextInput
              style={styles.formInput}
              placeholder="Taux d'occupation (%)"
              value={editForm.currentOccupancy}
              keyboardType="numeric"
              onChangeText={(text) => setEditForm(prev => ({ ...prev, currentOccupancy: text }))}
            />

            <Text style={styles.sectionLabel}>Matériaux acceptés</Text>
            <View style={styles.materialsGrid}>
              {availableMaterials.map((material) => (
                <TouchableOpacity
                  key={material}
                  style={[
                    styles.materialOption,
                    selectedMaterials.includes(material) && styles.materialOptionSelected
                  ]}
                  onPress={() => toggleMaterial(material)}
                >
                  <Text style={[
                    styles.materialOptionText,
                    selectedMaterials.includes(material) && styles.materialOptionTextSelected
                  ]}>
                    {material}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleUpdateCenter}
            >
              <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal d'ajout (similaire au modal d'édition) */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nouveau centre</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Formulaire identique au modal d'édition */}
            <TextInput
              style={styles.formInput}
              placeholder="Nom du centre"
              value={editForm.name}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
            />
            
            <TextInput
              style={styles.formInput}
              placeholder="Adresse"
              value={editForm.address}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, address: text }))}
            />
            
            <TextInput
              style={styles.formInput}
              placeholder="Horaires d'ouverture"
              value={editForm.openingHours}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, openingHours: text }))}
            />
            
            <TextInput
              style={styles.formInput}
              placeholder="Contact"
              value={editForm.contact}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, contact: text }))}
            />
            
            <TextInput
              style={styles.formInput}
              placeholder="Capacité"
              value={editForm.capacity}
              keyboardType="numeric"
              onChangeText={(text) => setEditForm(prev => ({ ...prev, capacity: text }))}
            />

            <Text style={styles.sectionLabel}>Matériaux acceptés</Text>
            <View style={styles.materialsGrid}>
              {availableMaterials.map((material) => (
                <TouchableOpacity
                  key={material}
                  style={[
                    styles.materialOption,
                    selectedMaterials.includes(material) && styles.materialOptionSelected
                  ]}
                  onPress={() => toggleMaterial(material)}
                >
                  <Text style={[
                    styles.materialOptionText,
                    selectedMaterials.includes(material) && styles.materialOptionTextSelected
                  ]}>
                    {material}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleAddCenter}
            >
              <Text style={styles.saveButtonText}>Créer le centre</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  addButton: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  resetButton: {
    backgroundColor: '#95a5a6',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#7f8c8d',
  },
  centersList: {
    flex: 1,
  },
  centerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  centerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteButton: {
    // Style spécifique pour le bouton suppression
  },
  actionText: {
    fontSize: 16,
  },
  centerAddress: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  materialsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  materialTag: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  materialText: {
    fontSize: 12,
    color: '#27ae60',
  },
  moreMaterials: {
    fontSize: 12,
    color: '#95a5a6',
    alignSelf: 'center',
  },
  hours: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  occupancyContainer: {
    marginTop: 8,
  },
  occupancyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  occupancyControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  occupancyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  occupancyButtons: {
    flexDirection: 'row',
  },
  occupancyButton: {
    backgroundColor: '#3498db',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  occupancyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  occupancyBar: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  occupancyFill: {
    height: '100%',
    borderRadius: 4,
  },
  detailsButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  detailsButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#7f8c8d',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 22,
  },
  materialsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailMaterialTag: {
    backgroundColor: '#e8f5e8',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  detailMaterialText: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '500',
  },
  formInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  materialOption: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  materialOptionSelected: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  materialOptionText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  materialOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RecyclingCenterManagement;