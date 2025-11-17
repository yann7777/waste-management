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
    { label: 'Poubelle pleine', value: 'full_bin' },
    { label: 'Poubelle cassée', value: 'broken_bin' },
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

      if (Platform.OS === 'web') {
        Alert.alert(
          'Fonctionnalité limitée',
          'La prise de photo directe est limitée sur le web. Vous pouvez créer le signalement sans photos ou utiliser l\'application mobile pour une expérience complète.',
          [{ text: 'Compris' }]
        );
        return;
      }

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
      if (Platform.OS === 'web') {
        Alert.alert(
          'Fonctionnalité désactivée',
          'L\'ajout de photos depuis la galerie est temporairement désactivé sur la version web. Vous pouvez créer le signalement sans photos ou utiliser l\'application mobile.',
          [{ text: 'Compris' }]
        );
        return;
      }

      const remainingSlots = 5 - photos.length;
      if (remainingSlots <= 0) {
        Alert.alert('Limite atteinte', 'Vous ne pouvez ajouter que 5 photos maximum');
        return;
      }

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
    console.log('🔍 Validation du formulaire...');
    
    if (!formData.type) {
      console.log('❌ Type manquant');
      if (Platform.OS === 'web') {
        alert('Erreur: Veuillez sélectionner un type de signalement');
      } else {
        Alert.alert('Erreur', 'Veuillez sélectionner un type de signalement');
      }
      return false;
    }
    console.log('✅ Type OK:', formData.type);

    if (!formData.location.latitude || !formData.location.longitude) {
      console.log('❌ Location manquante:', formData.location);
      if (Platform.OS === 'web') {
        alert('Erreur: Veuillez sélectionner un emplacement');
      } else {
        Alert.alert('Erreur', 'Veuillez sélectionner un emplacement');
      }
      return false;
    }
    console.log('✅ Location OK:', formData.location);

    console.log('✅ Validation complète réussie');
    return true;
  };

  const submitReport = async () => {
    console.log('🚀 === DÉBUT submitReport ===');
    console.log('📊 État complet du formulaire:', formData);
    
    setLoading(true);
    console.log('=== DÉBUT CRÉATION SIGNALEMENT ===');

    try {
      const reportData = {
        type: formData.type,
        description: formData.description || '',
        severity: formData.severity,
        wasteCategories: formData.wasteCategories,
        estimatedWasteVolume: formData.estimatedWasteVolume || null,
        location: {
          lat: formData.location.latitude,
          lng: formData.location.longitude,
          address: formData.location.address || ''
        },
        isOffline: false
      };

      console.log('📦 Données du signalement préparées:', JSON.stringify(reportData, null, 2));
      console.log('🖼️ Nombre de photos:', photos.length);
      console.log('📍 Location format:', reportData.location);

      console.log('🔍 Vérification pré-envoi:');
      console.log('  - Type:', reportData.type);
      console.log('  - Severity:', reportData.severity);
      console.log('  - Location.lat:', reportData.location.lat);
      console.log('  - Location.lng:', reportData.location.lng);
      console.log('  - wasteCategories:', reportData.wasteCategories);

      let photosToSend = [];
      if (Platform.OS !== 'web') {
        photosToSend = photos.filter(photo => photo.uri && !photo.uri.startsWith('blob:'));
        console.log('📱 Mode mobile: photos envoyées:', photosToSend.length);
      } else {
        console.log('🌐 Mode web: photos désactivées');
      }

      console.log('📸 Photos à envoyer:', photosToSend.length);
      console.log('🚀 Envoi vers API...');

      const response = await reportService.createReport(reportData, photosToSend);
      
      console.log('✅ Réponse du serveur:', response);
      
      if (response.success) {
        const successMessage = `Signalement créé avec succès! 🎉\n\nVous avez gagné ${response.data.pointsEarned} points écologiques.`;
        
        if (Platform.OS === 'web') {
          alert(successMessage);
          navigation.navigate('CitizenDashboard');
        } else {
          Alert.alert(
            'Succès!', 
            successMessage,
            [
              { 
                text: 'Voir mes signalements', 
                onPress: () => navigation.navigate('UserReports')
              },
              { 
                text: 'Retour au tableau de bord',
                onPress: () => navigation.navigate('CitizenDashboard')
              }
            ]
          );
        }
        
        // Réinitialiser le formulaire
        setFormData({
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
        setPhotos([]);
      } else {
        console.log('❌ Erreur serveur:', response.message);
        if (Platform.OS === 'web') {
          alert('Erreur: ' + (response.message || 'Erreur lors de la création du signalement'));
        } else {
          Alert.alert('Erreur', response.message || 'Erreur lors de la création du signalement');
        }
      }
    } catch (error) {
      console.error('❌ Erreur détaillée:', error);
      
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
      
      if (error.errors) {
        const validationErrors = error.errors.map(err => `${err.field}: ${err.message}`).join('\n');
        errorMessage = `Erreurs de validation:\n${validationErrors}`;
      }
      
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorMessage = 'Problème de connexion. Vérifiez votre connexion internet et que le serveur est démarré.';
      }
      
      if (error.message?.includes('timeout')) {
        errorMessage = 'La requête a pris trop de temps. Vérifiez votre connexion internet.';
      }
      
      if (Platform.OS === 'web') {
        alert('Erreur: ' + errorMessage);
      } else {
        Alert.alert('Erreur', errorMessage);
      }
    } finally {
      setLoading(false);
      console.log('=== FIN CRÉATION SIGNALEMENT ===');
    }
  };

  const handleSubmit = () => {
    console.log('🔵 Bouton de soumission cliqué');
    console.log('📋 État du formulaire:', {
      type: formData.type,
      photos: photos.length,
      location: formData.location,
      platform: Platform.OS
    });

    // Valider d'abord le formulaire
    if (!validateForm()) {
      console.log('❌ Validation échouée');
      return;
    }

    console.log('✅ Validation réussie');

    const selectedType = reportTypes.find(t => t.value === formData.type)?.label;
    const selectedSeverity = severityLevels.find(s => s.value === formData.severity)?.label;
    
    let confirmationMessage = `Êtes-vous sûr de vouloir créer ce signalement?\n\n• Type: ${selectedType}\n• Sévérité: ${selectedSeverity}\n• Localisation: ${formData.location.latitude.toFixed(4)}, ${formData.location.longitude.toFixed(4)}`;
    
    if (Platform.OS === 'web' && photos.length > 0) {
      confirmationMessage += `\n\n⚠️ Note: ${photos.length} photo(s) seront ignorées (limitation technique web)`;
    } else if (Platform.OS !== 'web') {
      confirmationMessage += `\n• Photos: ${photos.length}`;
    } else {
      confirmationMessage += `\n• Photos: Aucune (version web)`;
    }

    // Sur le web, utiliser window.confirm
    if (Platform.OS === 'web') {
      console.log('🌐 Utilisation de window.confirm pour le web');
      if (window.confirm(confirmationMessage)) {
        console.log('✅ Confirmation acceptée - Appel submitReport');
        submitReport();
      } else {
        console.log('❌ Confirmation annulée');
      }
    } else {
      // Sur mobile, utiliser Alert.alert
      Alert.alert(
        'Confirmer le signalement',
        confirmationMessage,
        [
          { 
            text: 'Annuler', 
            style: 'cancel',
            onPress: () => console.log('❌ Confirmation annulée')
          },
          { 
            text: 'Confirmer', 
            onPress: () => {
              console.log('✅ Confirmation acceptée - Appel submitReport');
              submitReport();
            }
          }
        ]
      );
    }
  };

  const openLocationModal = () => {
    if (Platform.OS === 'web') {
      alert(`Position actuelle: ${formData.location.latitude.toFixed(4)}, ${formData.location.longitude.toFixed(4)}\n\nLa sélection sur carte n'est disponible que sur l'application mobile.`);
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
          
          {Platform.OS === 'web' && (
            <View style={styles.webWarning}>
              <Text style={styles.webWarningText}>
                ⚠️ Version Web: Les photos sont temporairement désactivées
              </Text>
            </View>
          )}
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
          <Text style={styles.sectionTitle}>
            Photos ({photos.length}/5)
            {Platform.OS === 'web' && ' 🚫'}
          </Text>
          
          <View style={styles.photoButtons}>
            <TouchableOpacity 
              style={[
                styles.photoButton, 
                Platform.OS === 'web' && styles.photoButtonDisabled
              ]} 
              onPress={takePhoto}
              disabled={Platform.OS === 'web'}
            >
              <Text style={[
                styles.photoButtonText,
                Platform.OS === 'web' && styles.photoButtonTextDisabled
              ]}>
                {Platform.OS === 'web' ? '🚫 Prendre une photo' : '📸 Prendre une photo'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.photoButton, 
                Platform.OS === 'web' && styles.photoButtonDisabled
              ]} 
              onPress={pickImage}
              disabled={Platform.OS === 'web'}
            >
              <Text style={[
                styles.photoButtonText,
                Platform.OS === 'web' && styles.photoButtonTextDisabled
              ]}>
                {Platform.OS === 'web' ? '🚫 Choisir depuis la galerie' : '🖼️ Choisir depuis la galerie'}
              </Text>
            </TouchableOpacity>
          </View>

          {Platform.OS !== 'web' && photos.length > 0 && (
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
          )}
          
          {Platform.OS === 'web' ? (
            <Text style={styles.photoWarningWeb}>
              📷 Les photos sont temporairement désactivées sur la version web
            </Text>
          ) : photos.length === 0 ? (
            <Text style={styles.photoWarning}>
              Les photos sont recommandées pour faciliter le traitement
            </Text>
          ) : null}
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
    marginBottom: 12,
  },
  webWarning: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  webWarningText: {
    color: '#856404',
    textAlign: 'center',
    fontWeight: '500',
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
  photoButtonDisabled: {
    backgroundColor: '#e9ecef',
    borderColor: '#dee2e6',
  },
  photoButtonText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  photoButtonTextDisabled: {
    color: '#6c757d',
    textDecorationLine: 'line-through',
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
    textAlign: 'center',
  },
  photoWarningWeb: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
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