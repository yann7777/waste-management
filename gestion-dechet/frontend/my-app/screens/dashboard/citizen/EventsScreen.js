// screens/dashboard/citizen/EventsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput
} from 'react-native';
import { cleaningEventService } from '../../../services/cleaningEventService';
import { useAuth } from '../../../contexts/AuthContext';

const EventsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'my', 'joined'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Formulaire de création
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    duration: '',
    maxParticipants: '',
    ecoPointsReward: '50'
  });

  useEffect(() => {
    loadEvents();
  }, [activeTab]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      let response;
      if (activeTab === 'my') {
        response = await cleaningEventService.getUserEvents('upcoming');
        setUserEvents(response.data?.events || []);
      } else if (activeTab === 'joined') {
        response = await cleaningEventService.getUserEvents('upcoming');
        setUserEvents(response.data?.events || []);
      } else {
        response = await cleaningEventService.getPublicEvents({ upcoming: "true" });
        setEvents(response.data?.events || []);
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
      Alert.alert('Erreur', error.message || 'Impossible de charger les événements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const handleJoinEvent = async (eventId) => {
    try {
      const response = await cleaningEventService.joinEvent(eventId);
      if (response.success) {
        Alert.alert('Succès', 'Inscription réussie !');
        loadEvents();
      }
    } catch (error) {
      Alert.alert('Erreur', error.message || "Erreur lors de l'inscription");
    }
  };

  const handleLeaveEvent = async (eventId) => {
    try {
      const response = await cleaningEventService.leaveEvent(eventId);
      if (response.success) {
        Alert.alert('Succès', 'Désinscription réussie !');
        loadEvents();
      }
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la désinscription');
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.location || !eventForm.date) {
      Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires');
      return;
    }

    try {
      setCreating(true);
      const response = await cleaningEventService.createEvent(eventForm);
      if (response.success) {
        Alert.alert('Succès', 'Événement créé avec succès !');
        setShowCreateModal(false);
        setEventForm({
          title: '',
          description: '',
          location: '',
          date: '',
          duration: '',
          maxParticipants: '',
          ecoPointsReward: '50'
        });
        loadEvents();
      }
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUserParticipant = (event) => {
    return event.participants?.some(participant => participant.id === user.id);
  };

  const isUserOrganizer = (event) => {
    return event.organizerId === user.id;
  };

  const renderEventCard = (event) => {
    const userIsParticipant = isUserParticipant(event);
    const userIsOrganizer = isUserOrganizer(event);
    const isFull = event.maxParticipants && event.participants?.length >= event.maxParticipants;

    return (
      <View key={event.id} style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(event.status) }
          ]}>
            <Text style={styles.statusText}>{event.status}</Text>
          </View>
        </View>

        <Text style={styles.eventDescription}>{event.description}</Text>
        
        <View style={styles.eventDetails}>
          <Text style={styles.eventDetail}>📍 {event.location}</Text>
          <Text style={styles.eventDetail}>📅 {formatDate(event.date)}</Text>
          <Text style={styles.eventDetail}>⏱️ {event.duration} minutes</Text>
          <Text style={styles.eventDetail}>
            👥 {event.participants?.length || 0} / {event.maxParticipants || '∞'} participants
          </Text>
          <Text style={styles.eventDetail}>🏆 {event.ecoPointsReward} points</Text>
        </View>

        <View style={styles.eventFooter}>
          <Text style={styles.organizerText}>
            Organisé par {event.organizer?.firstName} {event.organizer?.lastName}
          </Text>
          
          <View style={styles.actionButtons}>
            {userIsOrganizer ? (
              <TouchableOpacity style={styles.organizerButton}>
                <Text style={styles.organizerButtonText}>Vous organisez</Text>
              </TouchableOpacity>
            ) : userIsParticipant ? (
              <TouchableOpacity 
                style={styles.leaveButton}
                onPress={() => handleLeaveEvent(event.id)}
              >
                <Text style={styles.leaveButtonText}>Se désinscrire</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.joinButton, isFull && styles.disabledButton]}
                onPress={() => !isFull && handleJoinEvent(event.id)}
                disabled={isFull}
              >
                <Text style={styles.joinButtonText}>
                  {isFull ? 'Complet' : 'Rejoindre'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return '#3498db';
      case 'in_progress': return '#f39c12';
      case 'completed': return '#27ae60';
      case 'cancelled': return '#e74c3c';
      default: return '#7f8c8d';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Événements de Nettoyage</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>+ Créer</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            Tous les événements
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'joined' && styles.activeTab]}
          onPress={() => setActiveTab('joined')}
        >
          <Text style={[styles.tabText, activeTab === 'joined' && styles.activeTabText]}>
            Mes participations
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'my' && styles.activeTab]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
            Mes événements
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenu */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#27ae60']}
          />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#27ae60" style={styles.loader} />
        ) : activeTab === 'all' ? (
          events.length > 0 ? (
            events.map(renderEventCard)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🧹</Text>
              <Text style={styles.emptyStateText}>Aucun événement à venir</Text>
              <Text style={styles.emptyStateSubtext}>
                Soyez le premier à créer un événement de nettoyage !
              </Text>
            </View>
          )
        ) : userEvents.length > 0 ? (
          userEvents.map(renderEventCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>
              {activeTab === 'joined' ? '📋' : '🎯'}
            </Text>
            <Text style={styles.emptyStateText}>
              {activeTab === 'joined' ? 'Aucune participation' : 'Aucun événement créé'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {activeTab === 'joined' 
                ? 'Rejoignez un événement pour le voir ici' 
                : 'Créez votre premier événement de nettoyage'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal de création */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Créer un événement</Text>
            
            <ScrollView style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Titre de l'événement *"
                value={eventForm.title}
                onChangeText={(text) => setEventForm({...eventForm, title: text})}
              />
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                value={eventForm.description}
                onChangeText={(text) => setEventForm({...eventForm, description: text})}
                multiline
                numberOfLines={3}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Lieu *"
                value={eventForm.location}
                onChangeText={(text) => setEventForm({...eventForm, location: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Date et heure (YYYY-MM-DD HH:MM) *"
                value={eventForm.date}
                onChangeText={(text) => setEventForm({...eventForm, date: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Durée (minutes)"
                value={eventForm.duration}
                onChangeText={(text) => setEventForm({...eventForm, duration: text})}
                keyboardType="numeric"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Nombre maximum de participants"
                value={eventForm.maxParticipants}
                onChangeText={(text) => setEventForm({...eventForm, maxParticipants: text})}
                keyboardType="numeric"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Points écologiques"
                value={eventForm.ecoPointsReward}
                onChangeText={(text) => setEventForm({...eventForm, ecoPointsReward: text})}
                keyboardType="numeric"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.createModalButton]}
                onPress={handleCreateEvent}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.createModalButtonText}>Créer</Text>
                )}
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
    backgroundColor: '#27ae60',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  createButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#27ae60',
  },
  tabText: {
    color: '#7f8c8d',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#27ae60',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  loader: {
    marginTop: 50,
  },
  eventCard: {
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
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  eventDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 15,
    lineHeight: 20,
  },
  eventDetails: {
    marginBottom: 15,
  },
  eventDetail: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 5,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 15,
  },
  organizerText: {
    fontSize: 12,
    color: '#7f8c8d',
    flex: 1,
  },
  actionButtons: {
    marginLeft: 10,
  },
  joinButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  leaveButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  leaveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  organizerButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  organizerButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginTop: 50,
  },
  emptyStateIcon: {
    fontSize: 50,
    marginBottom: 15,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  formContainer: {
    padding: 20,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ecf0f1',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#ecf0f1',
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontWeight: '600',
  },
  createModalButton: {
    backgroundColor: '#27ae60',
  },
  createModalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default EventsScreen;