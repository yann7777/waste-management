import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';

// Screens Auth
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import LoadingScreen from '../screens/LoadingScreen';

// Screens par rôle
import CitizenDashboard from '../screens/dashboard/citizen/CitizenDashboard';
import WorkerDashboard from '../screens/dashboard/worker/WorkerDashboard';
import AdminDashboard from '../screens/dashboard/admin/AdminDashboard';

import CreateReport from '../screens/dashboard/citizen/CreateReport';
import UserReportsList from '../screens/dashboard/citizen/UserReportsList';
import EventsScreen from '../screens/dashboard/citizen/EventsScreen';
import RecyclingCenterSection from '../screens/dashboard/citizen/RecyclingCenterSection';
import EcoActionsScreen from '../screens/dashboard/citizen/EcoActionsScreen';
import ReportDetail from '../screens/dashboard/citizen/ReportDetail';
import EditReport from '../screens/dashboard/citizen/EditReport';
import UserManagement from '../screens/dashboard/admin/UserManagement';
import ReportsManagement from '../screens/dashboard/admin/ReportsManagement';
import AnalyticsDashboard from '../screens/dashboard/admin/AnalyticsDashboard';
import NotificationsAdmin from '../screens/dashboard/admin/NotificationsAdmin';
import CollectionPlanning from '../screens/dashboard/admin/CollectionPlanning';
import CollectionStats from '../screens/dashboard/admin/CollectionStats';
import AdminChat from '../screens/dashboard/admin/AdminChat';
import CitizenChat from '../screens/dashboard/citizen/CitizenChat';
import NotificationsCitizen from '../screens/dashboard/citizen/NotificationsCitizen';
import WorkerCollectionPlanning from '../screens/dashboard/worker/WorkerCollectionPlanning';
import WorkerStats from '../screens/dashboard/worker/WorkerStats';
import WorkerNotifications from '../screens/dashboard/worker/WorkerNotifications';
import WorkerChat from '../screens/dashboard/worker/WorkerChat';
import RecyclingCenterManagement from '../screens/dashboard/worker/RecyclingCenterManagement';
import ReportManagement from '../screens/dashboard/worker/ReportManagement';

const Stack = createNativeStackNavigator();

// Stack pour les utilisateurs non authentifiés
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Dans AppNavigator.js, dans le CitizenStack
const CitizenStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="CitizenDashboard" 
      component={CitizenDashboard} 
      options={{ 
        title: 'Tableau de Bord Citoyen',
        headerShown: false 
      }}
    />
    <Stack.Screen 
      name="CreateReport" 
      component={CreateReport}
      options={{
        title: 'Nouveau Signalement',
        headerShown: true
      }}
    />
    <Stack.Screen 
      name="UserReports" 
      component={UserReportsList}
      options={{ title: 'Mes Signalements' }}
    />
    {/* Ajoutez cette nouvelle route */}
    <Stack.Screen 
      name="Events" 
      component={EventsScreen}
      options={{ 
        title: 'Événements de Nettoyage',
        headerShown: false
      }}
    />
    <Stack.Screen 
      name="RecyclingCenters" 
      component={RecyclingCenterSection}
      options={{
        title: 'Centres de Recyclage',
        headerShown: true
      }}
    />
    <Stack.Screen 
      name="EcoActions" 
      component={EcoActionsScreen}
      options={{ 
        title: 'Actions Écologiques',
        headerShown: true
      }}
    />
    <Stack.Screen 
      name="ReportDetail" 
      component={ReportDetail}
      options={{ 
        title: 'Détail du Signalement',
        headerShown: true
      }}
    />
    <Stack.Screen 
      name="EditReport" 
      component={EditReport}
      options={{ 
        title: 'Modifier le Signalement',
        headerShown: true
      }}
    />
    <Stack.Screen 
      name="Chat" 
      component={CitizenChat}
      options={{ 
        title: 'Messagerie Communauté',
        headerShown: true
      }}
    />
    <Stack.Screen 
      name="Notifications" 
      component={NotificationsCitizen}
      options={{ 
        title: 'Notifications',
        headerShown: false
      }}
    />
  </Stack.Navigator>
);

// Stack pour les travailleurs
const WorkerStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="WorkerDashboard" 
      component={WorkerDashboard} 
      options={{ 
        title: 'Tableau de Bord Employé',
        headerShown: false 
      }}
    />
    <Stack.Screen 
      name="UpdateSchedule" 
      component={WorkerCollectionPlanning}
      options={{ 
        title: 'Planifier les Collectes',
        headerShown: true
      }}
    />
    <Stack.Screen 
      name="WorkerStats" 
      component={WorkerStats}
      options={{ 
        title: 'Mes Statistiques',
        headerShown: true
      }}
    />
    <Stack.Screen 
      name="WorkerNotifications" 
      component={WorkerNotifications}
      options={{ 
        title: 'Mes Notifications',
        headerShown: true
      }}
    />
    <Stack.Screen 
      name="WorkerChat" 
      component={WorkerChat}
      options={{ 
        title: 'Messagerie Employé',
        headerShown: true
      }}
    />
    <Stack.Screen 
      name="CenterManagement" 
      component={RecyclingCenterManagement}
      options={{ 
        title: 'Gestion des Centres',
        headerShown: true
      }}
    />
    <Stack.Screen 
      name="ReportManagement" 
      component={ReportManagement}
      options={{ 
        title: 'Gestion des Signalements',
        headerShown: true
      }}
    />
    {/* Ajoutez d'autres écrans travailleurs ici */}
  </Stack.Navigator>
);

// Stack pour les administrateurs
const AdminStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="AdminDashboard" 
      component={AdminDashboard} 
      options={{ 
        title: 'Tableau de Bord Administrateur',
        headerShown: false 
      }}
    />
    <Stack.Screen 
      name="UserManagement" 
      component={UserManagement}
      options={{ 
        title: 'Gestion des Utilisateurs',
        headerShown: true
      }}
    />
    <Stack.Screen 
      name="ReportsManagement" 
      component={ReportsManagement}
      options={{ 
        title: 'Gestion des Signalements',
        headerShown: true
      }}
    />
    <Stack.Screen 
      name="Analytics" 
      component={AnalyticsDashboard}
      options={{ 
        title: 'Tableau de Bord Analytique',
        headerShown: true
      }}
    />
    <Stack.Screen 
      name="NotificationsAdmin" 
      component={NotificationsAdmin}
      options={{ 
        title: 'Gestion des Notifications',
        headerShown: true
      }}
    />
    <Stack.Screen 
      name="CollectionPlanning" 
      component={CollectionPlanning}
      options={{ 
        title: 'Planning des Collectes',
        headerShown: true
      }}
    />
    <Stack.Screen 
      name="CollectionStats" 
      component={CollectionStats}
      options={{ 
        title: 'Statistiques des Collectes',
        headerShown: true
      }}
    />
    <Stack.Screen 
      name="AdminChat" 
      component={AdminChat}
      options={{ 
        title: 'Messagerie Admin',
        headerShown: true
      }}
    />
    {/* Ajoutez d'autres écrans administrateurs ici */}
  </Stack.Navigator>
);

// Composant pour choisir la stack selon le rôle
const RoleBasedNavigator = () => {
  const { user } = useAuth();

  if (!user) {
    return <AuthStack />;
  }

  switch (user.role) {
    case 'admin':
      return <AdminStack />;
    case 'worker':
      return <WorkerStack />;
    case 'citizen':
    default:
      return <CitizenStack />;
  }
};

const AppNavigator = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <RoleBasedNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;