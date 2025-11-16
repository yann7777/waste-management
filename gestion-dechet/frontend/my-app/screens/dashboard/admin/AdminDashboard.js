import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';

const AdminDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.welcome}>Bonjour, {user?.firstName}!</Text>
          <Text style={styles.role}>Administrateur CleanCity</Text>
          <View style={styles.adminBadge}>
            <Text style={styles.adminText}>ACCÈS COMPLET</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Vue d'ensemble */}
        <Text style={styles.sectionTitle}>Vue d'Ensemble</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>1,254</Text>
            <Text style={styles.statLabel}>Utilisateurs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>89</Text>
            <Text style={styles.statLabel}>Signalements</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>15</Text>
            <Text style={styles.statLabel}>Événements</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Employés</Text>
          </View>
        </View>

        {/* Gestion du système */}
        <Text style={styles.sectionTitle}>Gestion du Système</Text>
        
        <View style={styles.adminGrid}>
          <TouchableOpacity 
            style={styles.adminCard}
            onPress={() => navigation.navigate('UserManagement')}
          >
            <Text style={styles.adminIcon}>👥</Text>
            <Text style={styles.adminTitle}>Utilisateurs</Text>
            <Text style={styles.adminDescription}>Gérer les comptes</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.adminCard}
            onPress={() => navigation.navigate('ReportsManagement')}
          >
            <Text style={styles.adminIcon}>📊</Text>
            <Text style={styles.adminTitle}>Signalements</Text>
            <Text style={styles.adminDescription}>Superviser</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.adminCard}
            onPress={() => navigation.navigate('WorkersManagement')}
          >
            <Text style={styles.adminIcon}>🛠️</Text>
            <Text style={styles.adminTitle}>Employés</Text>
            <Text style={styles.adminDescription}>Gérer l'équipe</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.adminCard}
            onPress={() => navigation.navigate('Analytics')}
          >
            <Text style={styles.adminIcon}>📈</Text>
            <Text style={styles.adminTitle}>Analytics</Text>
            <Text style={styles.adminDescription}>Statistiques</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.adminCard}
            onPress={() => navigation.navigate('SystemSettings')}
          >
            <Text style={styles.adminIcon}>⚙️</Text>
            <Text style={styles.adminTitle}>Paramètres</Text>
            <Text style={styles.adminDescription}>Configuration</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.adminCard}
            onPress={() => navigation.navigate('NotificationsAdmin')}
          >
            <Text style={styles.adminIcon}>🔔</Text>
            <Text style={styles.adminTitle}>Notifications</Text>
            <Text style={styles.adminDescription}>Messages globaux</Text>
          </TouchableOpacity>
        </View>

        {/* Déconnexion */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
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
  header: {
    backgroundColor: '#9b59b6',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  userInfo: {
    alignItems: 'center',
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  role: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 15,
  },
  adminBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  adminText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    width: '48%',
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
  adminGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  adminCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '48%',
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
  adminIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  adminTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  adminDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdminDashboard;