import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Dimensions
} from 'react-native';
import { userService } from '../../../services/userService';
import { useAuth } from '../../../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const UserManagement = ({ navigation }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    citizens: 0,
    workers: 0,
    admins: 0
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers();
      if (response.success) {
        setUsers(response.data.users);
        calculateStats(response.data.users);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (usersList) => {
    const stats = {
      total: usersList.length,
      citizens: usersList.filter(u => u.role === 'citizen').length,
      workers: usersList.filter(u => u.role === 'worker').length,
      admins: usersList.filter(u => u.role === 'admin').length
    };
    setStats(stats);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserPress = (user) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const handleRoleChange = async (newRole) => {
    if (!selectedUser) return;

    Alert.alert(
      'Changer le rôle',
      `Êtes-vous sûr de vouloir changer le rôle de ${selectedUser.firstName} ${selectedUser.lastName} en ${getRoleLabel(newRole)} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: () => updateUserRole(selectedUser.id, newRole)
        }
      ]
    );
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const response = await userService.updateUserRole(userId, newRole);
      if (response.success) {
        Alert.alert('Succès', 'Rôle utilisateur mis à jour');
        setModalVisible(false);
        loadUsers();
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le rôle');
    }
  };

  const handleDeleteUser = (user) => {
    if (user.id === currentUser.id) {
      Alert.alert('Erreur', 'Vous ne pouvez pas supprimer votre propre compte');
      return;
    }

    Alert.alert(
      'Supprimer l\'utilisateur',
      `Êtes-vous sûr de vouloir supprimer ${user.firstName} ${user.lastName} ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteUser(user.id)
        }
      ]
    );
  };

  const deleteUser = async (userId) => {
    try {
      const response = await userService.deleteUser(userId);
      if (response.success) {
        Alert.alert('Succès', 'Utilisateur supprimé');
        setModalVisible(false);
        loadUsers();
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de supprimer l\'utilisateur');
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'worker': return 'Employé';
      case 'citizen': return 'Citoyen';
      default: return role;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#e74c3c';
      case 'worker': return '#3498db';
      case 'citizen': return '#27ae60';
      default: return '#7f8c8d';
    }
  };

  const UserCard = ({ user }) => (
    <TouchableOpacity 
      style={styles.userCard}
      onPress={() => handleUserPress(user)}
    >
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.firstName[0]}{user.lastName[0]}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
            <Text style={styles.roleText}>{getRoleLabel(user.role)}</Text>
          </View>
        </View>
      </View>
      <View style={styles.userMeta}>
        <Text style={styles.metaText}>
          Inscrit le {new Date(user.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.metaText}>
          EcoPoints: {user.ecoPoints || 0}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const closeModal = () => {
    setModalVisible(false);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#9b59b6" />
        <Text style={styles.loadingText}>Chargement des utilisateurs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestion des Utilisateurs</Text>
        <Text style={styles.headerSubtitle}>
          {stats.total} utilisateur(s) au total
        </Text>
      </View>

      {/* Statistiques */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
      >
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.citizens}</Text>
          <Text style={styles.statLabel}>Citoyens</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.workers}</Text>
          <Text style={styles.statLabel}>Employés</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.admins}</Text>
          <Text style={styles.statLabel}>Admins</Text>
        </View>
      </ScrollView>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un utilisateur..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Liste des utilisateurs */}
      <FlatList
        data={filteredUsers}
        renderItem={({ item }) => <UserCard user={item} />}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#9b59b6']}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      {/* Modal de détails utilisateur - CORRIGÉ */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header du modal avec bouton fermer */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Détails de l'utilisateur
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={closeModal}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {selectedUser && (
                <>
                  {/* Avatar et nom */}
                  <View style={styles.userHeader}>
                    <View style={styles.modalAvatar}>
                      <Text style={styles.modalAvatarText}>
                        {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                      </Text>
                    </View>
                    <Text style={styles.userNameLarge}>
                      {selectedUser.firstName} {selectedUser.lastName}
                    </Text>
                    <View style={[styles.roleBadgeLarge, { backgroundColor: getRoleColor(selectedUser.role) }]}>
                      <Text style={styles.roleTextLarge}>{getRoleLabel(selectedUser.role)}</Text>
                    </View>
                  </View>

                  {/* Informations utilisateur */}
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Informations personnelles</Text>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Email:</Text>
                      <Text style={styles.infoValue}>{selectedUser.email}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>EcoPoints:</Text>
                      <Text style={styles.infoValue}>{selectedUser.ecoPoints || 0}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Date d'inscription:</Text>
                      <Text style={styles.infoValue}>
                        {new Date(selectedUser.createdAt).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Dernière connexion:</Text>
                      <Text style={styles.infoValue}>
                        {selectedUser.lastLogin 
                          ? new Date(selectedUser.lastLogin).toLocaleDateString('fr-FR')
                          : 'Non disponible'
                        }
                      </Text>
                    </View>
                  </View>

                  {/* Gestion des rôles */}
                  <View style={styles.roleSection}>
                    <Text style={styles.sectionTitle}>Gestion du rôle</Text>
                    <Text style={styles.sectionSubtitle}>
                      Changer le rôle de cet utilisateur:
                    </Text>

                    <View style={styles.roleButtons}>
                      <TouchableOpacity 
                        style={[
                          styles.roleOption,
                          selectedUser.role === 'citizen' && styles.roleOptionActive
                        ]}
                        onPress={() => handleRoleChange('citizen')}
                        disabled={selectedUser.role === 'citizen'}
                      >
                        <Text style={[
                          styles.roleOptionText,
                          selectedUser.role === 'citizen' && styles.roleOptionTextActive
                        ]}>
                          👤 Citoyen
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[
                          styles.roleOption,
                          selectedUser.role === 'worker' && styles.roleOptionActive
                        ]}
                        onPress={() => handleRoleChange('worker')}
                        disabled={selectedUser.role === 'worker'}
                      >
                        <Text style={[
                          styles.roleOptionText,
                          selectedUser.role === 'worker' && styles.roleOptionTextActive
                        ]}>
                          🛠️ Employé
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[
                          styles.roleOption,
                          selectedUser.role === 'admin' && styles.roleOptionActive
                        ]}
                        onPress={() => handleRoleChange('admin')}
                        disabled={selectedUser.role === 'admin'}
                      >
                        <Text style={[
                          styles.roleOptionText,
                          selectedUser.role === 'admin' && styles.roleOptionTextActive
                        ]}>
                          ⚙️ Administrateur
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Actions dangereuses */}
                  <View style={styles.dangerSection}>
                    <Text style={styles.dangerTitle}>Zone de danger</Text>
                    
                    <TouchableOpacity 
                      style={[
                        styles.deleteButton,
                        selectedUser.id === currentUser.id && styles.deleteButtonDisabled
                      ]}
                      onPress={() => handleDeleteUser(selectedUser)}
                      disabled={selectedUser.id === currentUser.id}
                    >
                      <Text style={styles.deleteButtonText}>
                        🗑️ Supprimer cet utilisateur
                      </Text>
                    </TouchableOpacity>

                    {selectedUser.id === currentUser.id && (
                      <Text style={styles.warningText}>
                        Vous ne pouvez pas supprimer votre propre compte
                      </Text>
                    )}
                  </View>
                </>
              )}
            </ScrollView>

            {/* Bouton de fermeture en bas */}
            <TouchableOpacity 
              style={styles.bottomCloseButton}
              onPress={closeModal}
            >
              <Text style={styles.bottomCloseButtonText}>Fermer</Text>
            </TouchableOpacity>
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
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
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  statItem: {
    alignItems: 'center',
    marginRight: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9b59b6',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  searchContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  listContainer: {
    padding: 20,
  },
  userCard: {
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#9b59b6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    color: '#95a5a6',
  },
  // NOUVEAUX STYLES POUR LE MODAL CORRIGÉ
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: height * 0.85,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
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
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#7f8c8d',
    fontWeight: 'bold',
    lineHeight: 20,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  userHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#9b59b6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalAvatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userNameLarge: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  roleBadgeLarge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roleTextLarge: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  roleSection: {
    marginBottom: 25,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 15,
  },
  roleButtons: {
    gap: 10,
  },
  roleOption: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleOptionActive: {
    backgroundColor: '#9b59b6',
    borderColor: '#9b59b6',
  },
  roleOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  roleOptionTextActive: {
    color: '#fff',
  },
  dangerSection: {
    marginBottom: 20,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 15,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningText: {
    fontSize: 12,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  bottomCloseButton: {
    backgroundColor: '#9b59b6',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  bottomCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UserManagement;