// RecyclingCenterSection.js
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
  Platform
} from 'react-native';
import { recyclingCenterService } from '../../../services/recyclingCenterService';
import * as Location from 'expo-location';

const RecyclingCenterSection = ({ navigation }) => {
  const [centers, setCenters] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');

  // Matériaux courants pour le filtrage
  const commonMaterials = [
    'plastique', 'verre', 'papier', 'carton', 'métal', 
    'aluminium', 'acier', 'textile', 'électronique', 'batteries'
  ];

  useEffect(() => {
    loadNearbyCenters();
    loadUserLocation();
    loadFavorites();
  }, []);

  const loadUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'La localisation est nécessaire pour trouver les centres à proximité.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Erreur de localisation:', error);
    }
  };

  const loadNearbyCenters = async () => {
    try {
      setLoading(true);
      let location = userLocation;

      // Si pas de localisation utilisateur, utiliser une position par défaut (Paris)
      if (!location) {
        location = { latitude: 48.8566, longitude: 2.3522 };
      }

      const response = await recyclingCenterService.getNearbyCenters(
        location.latitude,
        location.longitude,
        10 // 10km de rayon
      );

      if (response.success) {
        // Marquer les favoris
        const centersWithFavorites = response.data.recyclingCenters.map(center => ({
          ...center,
          isFavorite: favorites.some(fav => fav.id === center.id)
        }));
        setCenters(centersWithFavorites);
      } else {
        Alert.alert('Erreur', response.message || 'Impossible de charger les centres');
      }
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de charger les centres de recyclage');
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const response = await recyclingCenterService.getFavorites();
      if (response.success) {
        setFavorites(response.data.recyclingCenters);
        // Mettre à jour l'état des favoris dans la liste des centres
        const updatedCenters = centers.map(center => ({
          ...center,
          isFavorite: response.data.recyclingCenters.some(fav => fav.id === center.id)
        }));
        setCenters(updatedCenters);
      }
    } catch (error) {
      console.error('Erreur chargement favoris:', error);
    }
  };

  const toggleFavorite = async (centerId) => {
    try {
      const response = await recyclingCenterService.toggleFavorite(centerId);
      if (response.success) {
        // Mettre à jour l'état local
        const updatedCenters = centers.map(center => 
          center.id === centerId 
            ? { ...center, isFavorite: response.data.isFavorite }
            : center
        );
        setCenters(updatedCenters);
        
        // Recharger les favoris
        loadFavorites();
        
        Alert.alert(
          'Succès', 
          response.data.isFavorite 
            ? 'Centre ajouté aux favoris' 
            : 'Centre retiré des favoris'
        );
      }
    } catch (error) {
      Alert.alert('Erreur', "Impossible de modifier les favoris");
    }
  };

  const searchCenters = async () => {
    try {
      setLoading(true);
      const filters = {};
      
      if (searchQuery) {
        filters.search = searchQuery;
      }
      
      if (selectedMaterial) {
        filters.materials = selectedMaterial;
      }

      const response = await recyclingCenterService.getCenters(filters);
      
      if (response.success) {
        const centersWithFavorites = response.data.recyclingCenters.map(center => ({
          ...center,
          isFavorite: favorites.some(fav => fav.id === center.id)
        }));
        setCenters(centersWithFavorites);
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
      Alert.alert('Erreur', 'Recherche échouée');
    } finally {
      setLoading(false);
    }
  };

  const filterByMaterial = async (material) => {
    setSelectedMaterial(material);
    try {
      setLoading(true);
      const response = await recyclingCenterService.getCentersByMaterial(material);
      
      if (response.success) {
        const centersWithFavorites = response.data.recyclingCenters.map(center => ({
          ...center,
          isFavorite: favorites.some(fav => fav.id === center.id)
        }));
        setCenters(centersWithFavorites);
      }
    } catch (error) {
      console.error('Erreur filtre:', error);
      Alert.alert('Erreur', 'Filtrage échoué');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedMaterial('');
    loadNearbyCenters();
  };

  const openCenterDetails = (center) => {
    setSelectedCenter(center);
    setShowDetails(true);
  };

  const openMaps = (center) => {
    if (!center.location) return;
    
    const { lat, lng } = center.location;
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lng}`;
    const label = center.name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    Linking.openURL(url).catch(err => {
      Alert.alert('Erreur', "Impossible d'ouvrir l'application de cartes");
    });
  };

  const callCenter = (phoneNumber) => {
    if (!phoneNumber) return;
    
    const url = `tel:${phoneNumber}`;
    Linking.openURL(url).catch(err => {
      Alert.alert('Erreur', "Impossible de composer le numéro");
    });
  };

  const renderCenterCard = ({ item: center }) => (
    <TouchableOpacity 
      style={styles.centerCard}
      onPress={() => openCenterDetails(center)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.centerName}>{center.name}</Text>
        <TouchableOpacity onPress={() => toggleFavorite(center.id)}>
          <Text style={styles.favoriteIcon}>
            {center.isFavorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.centerAddress}>{center.address}</Text>
      
      {center.distance && (
        <Text style={styles.distance}>
          📍 {center.distance.toFixed(1)} km
        </Text>
      )}
      
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
        <Text style={styles.hours}>
          🕒 {center.openingHours}
        </Text>
      )}

      {center.currentOccupancy !== undefined && (
        <View style={styles.occupancyContainer}>
          <Text style={styles.occupancyText}>
            Occupation: {center.currentOccupancy}%
          </Text>
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
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* En-tête avec titre et actions */}
      <View style={styles.header}>
        <Text style={styles.title}>♻️ Centres de Recyclage</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={loadNearbyCenters}
        >
          <Text style={styles.refreshText}>🔄</Text>
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
      </View>

      {/* Filtres par matériaux */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.materialsScroll}
      >
        <TouchableOpacity 
          style={[styles.materialFilter, !selectedMaterial && styles.materialFilterActive]}
          onPress={resetFilters}
        >
          <Text style={[styles.materialFilterText, !selectedMaterial && styles.materialFilterTextActive]}>
            Tous
          </Text>
        </TouchableOpacity>
        
        {commonMaterials.map((material) => (
          <TouchableOpacity 
            key={material}
            style={[
              styles.materialFilter,
              selectedMaterial === material && styles.materialFilterActive
            ]}
            onPress={() => filterByMaterial(material)}
          >
            <Text style={[
              styles.materialFilterText,
              selectedMaterial === material && styles.materialFilterTextActive
            ]}>
              {material}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Indicateur de chargement */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#27ae60" />
          <Text style={styles.loadingText}>Chargement des centres...</Text>
        </View>
      )}

      {/* Liste des centres */}
      {!loading && centers.length > 0 ? (
        <FlatList
          data={centers}
          renderItem={renderCenterCard}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          style={styles.centersList}
        />
      ) : (
        !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>♻️</Text>
            <Text style={styles.emptyStateText}>Aucun centre trouvé</Text>
            <Text style={styles.emptyStateSubtext}>
              Essayez de modifier vos critères de recherche
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={resetFilters}>
              <Text style={styles.retryButtonText}>Réinitialiser les filtres</Text>
            </TouchableOpacity>
          </View>
        )
      )}

      {/* Modal avec les détails */}
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
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>📍 Adresse</Text>
              <Text style={styles.detailValue}>{selectedCenter?.address}</Text>
            </View>

            {selectedCenter?.openingHours && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>🕒 Horaires d'ouverture</Text>
                <Text style={styles.detailValue}>{selectedCenter.openingHours}</Text>
              </View>
            )}

            {selectedCenter?.contact && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>📞 Contact</Text>
                <Text style={styles.detailValue}>{selectedCenter.contact}</Text>
              </View>
            )}

            {selectedCenter?.acceptedMaterials && selectedCenter.acceptedMaterials.length > 0 && (
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

            {selectedCenter?.currentOccupancy !== undefined && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>📈 Taux d'occupation actuel</Text>
                <View style={styles.occupancyContainer}>
                  <Text style={styles.occupancyText}>
                    {selectedCenter.currentOccupancy}%
                  </Text>
                  <View style={styles.occupancyBar}>
                    <View 
                      style={[
                        styles.occupancyFill,
                        { 
                          width: `${selectedCenter.currentOccupancy}%`,
                          backgroundColor: selectedCenter.currentOccupancy > 80 ? '#e74c3c' : 
                                       selectedCenter.currentOccupancy > 60 ? '#f39c12' : '#27ae60'
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionButtons}>
              {selectedCenter?.location && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => openMaps(selectedCenter)}
                >
                  <Text style={styles.actionButtonText}>🗺️ Ouvrir dans Maps</Text>
                </TouchableOpacity>
              )}
              
              {selectedCenter?.contact && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.callButton]}
                  onPress={() => callCenter(selectedCenter.contact)}
                >
                  <Text style={styles.actionButtonText}>📞 Appeler</Text>
                </TouchableOpacity>
              )}
            </View>
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
  refreshButton: {
    padding: 8,
  },
  refreshText: {
    fontSize: 20,
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
    backgroundColor: '#27ae60',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  materialsScroll: {
    marginBottom: 16,
  },
  materialFilter: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  materialFilterActive: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  materialFilterText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  materialFilterTextActive: {
    color: '#fff',
    fontWeight: '600',
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
    marginRight: 8,
  },
  favoriteIcon: {
    fontSize: 20,
  },
  centerAddress: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  distance: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
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
  occupancyText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  occupancyBar: {
    height: 6,
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    overflow: 'hidden',
  },
  occupancyFill: {
    height: '100%',
    borderRadius: 3,
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
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
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
  actionButtons: {
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  callButton: {
    backgroundColor: '#3498db',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RecyclingCenterSection;