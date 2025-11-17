// EditReport.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { reportService } from '../../../services/reportService';

const EditReport = ({ route, navigation }) => {
  const { reportId } = route.params;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    severity: 'medium'
  });

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await reportService.getReportById(reportId);
      if (response.success) {
        setReport(response.data.report);
        setFormData({
          description: response.data.report.description || '',
          severity: response.data.report.severity || 'medium'
        });
      } else {
        Alert.alert('Erreur', response.message || 'Impossible de charger le signalement');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Erreur chargement signalement:', error);
      Alert.alert('Erreur', 'Impossible de charger le signalement');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.description.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir une description');
      return;
    }

    try {
      setSaving(true);
      const response = await reportService.updateReport(reportId, formData);
      
      if (response.success) {
        Alert.alert('Succès', 'Signalement modifié avec succès', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Erreur', response.message || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur modification:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de la modification');
    } finally {
      setSaving(false);
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

  const getSeverityText = (severity) => {
    const severities = {
      'low': 'Faible',
      'medium': 'Moyenne',
      'high': 'Élevée',
      'critical': 'Critique'
    };
    return severities[severity] || severity;
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
        <Text style={styles.title}>Modifier le Signalement</Text>
        <Text style={styles.subtitle}>{getTypeText(report.type)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Informations du signalement</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Type:</Text>
          <Text style={styles.infoValue}>{getTypeText(report.type)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Statut:</Text>
          <Text style={styles.infoValue}>{report.status}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>
            {new Date(report.createdAt).toLocaleDateString('fr-FR')}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Localisation:</Text>
          <Text style={styles.infoValue}>
            {report.location?.address || 
             `${report.location?.latitude?.toFixed(6)}, ${report.location?.longitude?.toFixed(6)}`}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Modifier la description</Text>
        
        <TextInput
          style={styles.textInput}
          value={formData.description}
          onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
          placeholder="Décrivez le problème en détail..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Niveau de sévérité</Text>
        
        <View style={styles.severityOptions}>
          {['low', 'medium', 'high', 'critical'].map((severity) => (
            <TouchableOpacity
              key={severity}
              style={[
                styles.severityOption,
                formData.severity === severity && styles.severityOptionSelected
              ]}
              onPress={() => setFormData(prev => ({ ...prev, severity }))}
            >
              <Text style={[
                styles.severityText,
                formData.severity === severity && styles.severityTextSelected
              ]}>
                {getSeverityText(severity)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={saving}
        >
          <Text style={styles.buttonText}>Annuler</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.warningCard}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={styles.warningText}>
          Note: Vous ne pouvez modifier que la description et la sévérité du signalement.
          Le type et la localisation ne peuvent pas être modifiés après création.
        </Text>
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
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
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
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  severityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  severityOption: {
    flex: 1,
    minWidth: '48%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  severityOptionSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  severityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  severityTextSelected: {
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  saveButton: {
    backgroundColor: '#3498db',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningCard: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 8,
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditReport;