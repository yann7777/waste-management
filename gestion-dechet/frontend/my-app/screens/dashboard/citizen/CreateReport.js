import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { reportService } from '../../../services/reportService';

// Composant de sélecteur personnalisé
const CustomPicker = ({ 
  items, 
  selectedValue, 
  onValueChange, 
  placeholder = "Sélectionner une option" 
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedItem = items.find(item => item.value === selectedValue);

  return (
    <View>
      <TouchableOpacity
        style={styles.pickerContainer}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.pickerText}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Text style={styles.pickerArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sélectionner une option</Text>
            <ScrollView style={styles.optionsList}>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.option,
                    selectedValue === item.value && styles.selectedOption
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    selectedValue === item.value && styles.selectedOptionText
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const CreateReport = ({ navigation }) => {
  const [formData, setFormData] = useState({
    type: 'illegal_dumping',
    description: '',
    severity: 'medium',
    wasteCategories: [],
    estimatedWasteVolume: '',
    location: {
      latitude: 48.8566,
      longitude: 2.3522,
      address: ''
    }
  });
  
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const reportTypes = [
    { label: 'Dépôt sauvage', value: 'illegal_dumping' },
    { label: 'Encombrants', value: 'bulky_waste' },
    { label: 'Déchets dangereux', value: 'hazardous_waste' },
    { label: 'Déchets électroniques', value: 'electronic_waste' },
    { label: 'Autre', value: 'other' }
  ];

  const severityLevels = [
    { label: 'Faible', value: 'low' },
    { label: 'Moyen', value: 'medium' },
    { label: 'Élevé', value: 'high' },
    { label: 'Critique', value: 'critical' }
  ];

  const wasteCategories = [
    { label: 'Plastique', value: 'plastic' },
    { label: 'Verre', value: 'glass' },
    { label: 'Métal', value: 'metal' },
    { label: 'Papier/Carton', value: 'paper' },
    { label: 'Organique', value: 'organic' },
    { label: 'Textile', value: 'textile' },
    { label: 'Électronique', value: 'electronic' },
    { label: 'Dangereux', value: 'hazardous' },
    { label: 'Encombrants', value: 'bulky' }
  ];

  useEffect(() => {
    requestPermissions();
    getCurrentLocation();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert('Permission requise', 'Les permissions pour la caméra et la galerie sont nécessaires.');
      }
    }
  };

  const getCurrentLocation = async () => {
    try {
      if (Platform.OS === 'web') {
        // Sur le web, utiliser une position par défaut
        console.log('Web: utilisation de la position par défaut (Paris)');
        return;
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission de localisation refusée');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      console.log('Position actuelle récupérée:', location.coords);
      
      handleLocationChange('latitude', location.coords.latitude);
      handleLocationChange('longitude', location.coords.longitude);
    } catch (error) {
      console.log('Erreur de localisation:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));
  };

  const toggleWasteCategory = (category) => {
    setFormData(prev => ({
      ...prev,
      wasteCategories: prev.wasteCategories.includes(category)
        ? prev.wasteCategories.filter(c => c !== category)
        : [...prev.wasteCategories, category]
    }));
  };

  const takePhoto = async () => {
    try {
      if (photos.length >= 5) {
        Alert.alert('Limite atteinte', 'Vous ne pouvez ajouter que 5 photos maximum');
        return;
      }

      // CORRECTION : Utilisation correcte de MediaTypeOptions
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotos(prev => [...prev, result.assets[0]]);
        console.log('Photo prise:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur caméra:', error);
      Alert.alert('Erreur', 'Impossible d\'accéder à la caméra');
    }
  };

  const pickImage = async () => {
    try {
      // Vérification pour le web
      if (Platform.OS === 'web') {
        Alert.alert('Info', 'La sélection d\'images depuis la galerie n\'est pas disponible sur le web. Utilisez la fonctionnalité de prise de photo.');
        return;
      }

      const remainingSlots = 5 - photos.length;
      if (remainingSlots <= 0) {
        Alert.alert('Limite atteinte', 'Vous ne pouvez ajouter que 5 photos maximum');
        return;
      }

      // CORRECTION : Utilisation correcte de MediaTypeOptions
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        aspect: [4, 3],
        quality: 0.8,
        selectionLimit: remainingSlots
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhotos = result.assets.slice(0, remainingSlots);
        setPhotos(prev => [...prev, ...newPhotos]);
        console.log('Photos sélectionnées:', newPhotos.length);
      }
    } catch (error) {
      console.error('Erreur galerie:', error);
      Alert.alert('Erreur', 'Impossible d\'accéder à la galerie');
    }
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.type) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type de signalement');
      return false;
    }

    if (!formData.location.latitude || !formData.location.longitude) {
      Alert.alert('Erreur', 'Veuillez sélectionner un emplacement');
      return false;
    }

    if (photos.length === 0) {
      Alert.alert('Attention', 'Aucune photo n\'a été ajoutée. Voulez-vous continuer ?', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Continuer', onPress: () => submitReport() }
      ]);
      return false;
    }

    return true;
  };

  const submitReport = async () => {
    if (!validateForm()) return;

    setLoading(true);
    console.log('=== DÉBUT CRÉATION SIGNALEMENT ===');

    try {
      // Préparer les données pour l'API
      const reportData = {
        type: formData.type,
        description: formData.description || '',
        severity: formData.severity,
        wasteCategories: formData.wasteCategories,
        estimatedWasteVolume: formData.estimatedWasteVolume ? parseFloat(formData.estimatedWasteVolume) : null,
        location: formData.location,
        isOffline: false
      };

      console.log('📦 Données du signalement:', reportData);
      console.log('🖼️ Nombre de photos:', photos.length);

      // Appel réel à l'API
      const response = await reportService.createReport(reportData, photos);
      
      console.log('✅ Réponse du serveur:', response);
      
      if (response.success) {
        Alert.alert(
          'Succès!', 
          `Signalement créé avec succès! 🎉\n\nVous avez gagné ${response.data.pointsEarned} points écologiques.`,
          [
            { 
              text: 'Voir mes signalements', 
              onPress: () => {
                console.log('Navigation vers UserReports');
                navigation.navigate('UserReports');
              }
            },
            { 
              text: 'Retour au tableau de bord',
              onPress: () => {
                console.log('Retour au tableau de bord');
                navigation.navigate('CitizenDashboard');
              }
            }
          ]
        );
      } else {
        Alert.alert('Erreur', response.message || 'Erreur lors de la création du signalement');
      }
    } catch (error) {
      console.error('❌ Erreur détaillée:', error);
      
      // Messages d'erreur plus spécifiques
      let errorMessage = 'Une erreur est survenue lors de la création du signalement';
      
      if (error.message) {
        errorMessage = error.message;
      } 
      
      if (error.response) {
        console.error('Réponse erreur:', error.response);
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorMessage = 'Problème de connexion. Vérifiez votre connexion internet et que le serveur est démarré.';
      }
      
      if (error.message?.includes('timeout')) {
        errorMessage = 'La requête a pris trop de temps. Vérifiez votre connexion internet.';
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
      console.log('=== FIN CRÉATION SIGNALEMENT ===');
    }
  };

  const handleSubmit = () => {
    console.log('Bouton de soumission cliqué');
    console.log('État du formulaire:', {
      type: formData.type,
      photos: photos.length,
      location: formData.location
    });

    Alert.alert(
      'Confirmer le signalement',
      `Êtes-vous sûr de vouloir créer ce signalement?\n\n• Type: ${reportTypes.find(t => t.value === formData.type)?.label}\n• Photos: ${photos.length}\n• Localisation: ${formData.location.latitude.toFixed(4)}, ${formData.location.longitude.toFixed(4)}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: submitReport }
      ]
    );
  };

  const openLocationModal = () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Localisation',
        `Position actuelle: ${formData.location.latitude.toFixed(4)}, ${formData.location.longitude.toFixed(4)}\n\nLa sélection sur carte n'est disponible que sur l'application mobile.`,
        [{ text: 'OK' }]
      );
    } else {
      setShowMap(true);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Nouveau Signalement</Text>
          <Text style={styles.subtitle}>Signalez un dépôt sauvage dans votre quartier</Text>
        </View>

        {/* Type de signalement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type de signalement *</Text>
          <CustomPicker
            items={reportTypes}
            selectedValue={formData.type}
            onValueChange={(value) => handleInputChange('type', value)}
            placeholder="Choisir le type de signalement"
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Décrivez le dépôt sauvage (type de déchets, quantité approximative, etc.)"
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Sévérité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Niveau de sévérité</Text>
          <View style={styles.severityContainer}>
            {severityLevels.map(level => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.severityButton,
                  formData.severity === level.value && styles.severityButtonSelected
                ]}
                onPress={() => handleInputChange('severity', level.value)}
              >
                <Text style={[
                  styles.severityText,
                  formData.severity === level.value && styles.severityTextSelected
                ]}>
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Catégories de déchets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catégories de déchets</Text>
          <View style={styles.categoriesContainer}>
            {wasteCategories.map(category => (
              <TouchableOpacity
                key={category.value}
                style={[
                  styles.categoryButton,
                  formData.wasteCategories.includes(category.value) && styles.categoryButtonSelected
                ]}
                onPress={() => toggleWasteCategory(category.value)}
              >
                <Text style={[
                  styles.categoryText,
                  formData.wasteCategories.includes(category.value) && styles.categoryTextSelected
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Volume estimé */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Volume estimé (m³)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 2.5"
            value={formData.estimatedWasteVolume}
            onChangeText={(value) => handleInputChange('estimatedWasteVolume', value)}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Localisation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Localisation *</Text>
          <TouchableOpacity 
            style={styles.mapButton}
            onPress={openLocationModal}
          >
            <Text style={styles.mapButtonText}>
              {`Position: ${formData.location.latitude.toFixed(4)}, ${formData.location.longitude.toFixed(4)}`}
            </Text>
          </TouchableOpacity>
          <Text style={styles.locationHelp}>
            {Platform.OS === 'web' 
              ? '📍 Utilisez l\'application mobile pour la sélection sur carte'
              : '📍 Appuyez pour sélectionner sur la carte'
            }
          </Text>
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos ({photos.length}/5) *</Text>
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
              <Text style={styles.photoButtonText}>📸 Prendre une photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
              <Text style={styles.photoButtonText}>🖼️ Choisir depuis la galerie</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal style={styles.photosContainer}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoItem}>
                <Image source={{ uri: photo.uri }} style={styles.photo} />
                <TouchableOpacity 
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(index)}
                >
                  <Text style={styles.removePhotoText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          {photos.length === 0 && (
            <Text style={styles.photoWarning}>Au moins une photo est recommandée</Text>
          )}
        </View>

        {/* Bouton de soumission */}
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {loading ? 'Création en cours...' : 'Créer le signalement'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  section: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  pickerText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    textAlign: 'center',
    color: '#2c3e50',
  },
  optionsList: {
    maxHeight: 300,
  },
  option: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedOption: {
    backgroundColor: '#3498db',
  },
  optionText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  selectedOptionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#f9f9f9',
    textAlignVertical: 'top',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  severityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  severityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  severityButtonSelected: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  severityText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  severityTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  categoryButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  categoryText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  categoryTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  mapButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  mapButtonText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
  },
  locationHelp: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 8,
    textAlign: 'center',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  photoButtonText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  photosContainer: {
    flexDirection: 'row',
  },
  photoItem: {
    marginRight: 12,
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  photoWarning: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 8,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CreateReport;