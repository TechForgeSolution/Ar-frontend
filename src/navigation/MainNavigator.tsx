import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from '../types';
import { theme } from '../config/theme';

// Dashboard & Profile
import DashboardScreen from '../screens/main/DashboardScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';

// Paiement
import PaiementScreen from '../screens/paiement/PaiementScreen';
import TransfertScreen from '../screens/paiement/TransfertScreen';
import HistoriqueScreen from '../screens/paiement/HistoriqueScreen';
import PayerFraisScreen from '../screens/paiement/PayerFraisScreen';

// Cours
import CoursTheoriqueScreen from '../screens/cours/CoursTheoriqueScreen';
import CoursPratiqueScreen from '../screens/cours/CoursPratiqueScreen';
import ModuleDetailScreen from '../screens/cours/ModuleDetailScreen';
import ChapitreDetailScreen from '../screens/cours/ChapitreDetailScreen';
import LeconDetailScreen from '../screens/cours/LeconDetailScreen';
import LeconWebViewScreen from '../screens/cours/LeconWebViewScreen';
import LeconVideoScreen from '../screens/cours/LeconVideoScreen';
import QuizScreen from '../screens/cours/QuizScreen';
import QuizResultatScreen from '../screens/cours/QuizResultatScreen';

// Parrainage
import ParrainageScreen from '../screens/parrainage/ParrainageScreen';
import FilleulsScreen from '../screens/parrainage/FilleulsScreen';
import ArbreParrainageScreen from '../screens/parrainage/ArbreParrainageScreen';

// CNI
import CniInscriptionScreen from '../screens/cni/CniInscriptionscreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.textInverse,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      {/* Dashboard & Profile */}
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Mon Profil' }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ title: 'Modifier le Profil' }}
      />

      {/* Paiement */}
      <Stack.Screen 
        name="Paiement" 
        component={PaiementScreen}
        options={{ title: 'Recharger mon compte' }}
      />
      <Stack.Screen 
        name="Transfert" 
        component={TransfertScreen}
        options={{ title: 'Transférer' }}
      />
      <Stack.Screen 
        name="Historique" 
        component={HistoriqueScreen}
        options={{ title: 'Historique' }}
      />
      <Stack.Screen 
        name="PayerFrais" 
        component={PayerFraisScreen}
        options={{ title: 'Payer les Frais' }}
      />

      {/* Cours Théorique */}
      <Stack.Screen 
        name="CoursTheorique" 
        component={CoursTheoriqueScreen}
        options={{ title: 'Cours Théoriques' }}
      />
      <Stack.Screen 
        name="CoursPratique" 
        component={CoursPratiqueScreen}
        options={{ title: 'Cours Pratiques' }}
      />
      <Stack.Screen 
        name="ModuleDetail" 
        component={ModuleDetailScreen}
        options={{ title: 'Module' }}
      />
      <Stack.Screen 
        name="ChapitreDetail" 
        component={ChapitreDetailScreen}
        options={{ title: 'Chapitre' }}
      />
      <Stack.Screen 
        name="LeconDetail" 
        component={LeconDetailScreen}
        options={{ title: 'Leçon' }}
      />
      <Stack.Screen 
        name="LeconWebView" 
        component={LeconWebViewScreen}
        options={{ title: 'Cours' }}
      />
      <Stack.Screen 
        name="LeconVideo" 
        component={LeconVideoScreen}
        options={{ title: 'Cours Vidéo' }}
      />
      <Stack.Screen 
        name="Quiz" 
        component={QuizScreen}
        options={{ title: 'Quiz', headerBackVisible: false }}
      />
      <Stack.Screen 
        name="QuizResultat" 
        component={QuizResultatScreen}
        options={{ title: 'Résultat du Quiz', headerBackVisible: false }}
      />

      {/* Parrainage */}
      <Stack.Screen 
        name="Parrainage" 
        component={ParrainageScreen}
        options={{ title: 'Parrainage' }}
      />
      <Stack.Screen 
        name="Filleuls" 
        component={FilleulsScreen}
        options={{ title: 'Mes Filleuls' }}
      />
      <Stack.Screen 
        name="ArbreParrainage" 
        component={ArbreParrainageScreen}
        options={{ title: 'Arbre de Parrainage' }}
      />

      {/* CNI - Inscription Examen */}
      <Stack.Screen 
        name="CniInscription" 
        component={CniInscriptionScreen}
        options={{ title: "Inscription à l'examen" }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;