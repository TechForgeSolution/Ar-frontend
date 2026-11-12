import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from '../types';

// Tab navigator (PagerView)
import MainNavigator from './MainNavigator';

// Stack screens
import ProfileScreen from '../screens/main/ProfileScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import PaiementScreen from '../screens/paiement/PaiementScreen';
import TransfertScreen from '../screens/paiement/TransfertScreen';
import HistoriqueScreen from '../screens/paiement/HistoriqueScreen';
import PayerFraisScreen from '../screens/paiement/PayerFraisScreen';
import CoursTheoriqueScreen from '../screens/cours/CoursTheoriqueScreen';
import CoursPratiqueScreen from '../screens/cours/CoursPratiqueScreen';
import ModuleDetailScreen from '../screens/cours/ModuleDetailScreen';
import ChapitreDetailScreen from '../screens/cours/ChapitreDetailScreen';
import LeconDetailScreen from '../screens/cours/LeconDetailScreen';
import LeconWebViewScreen from '../screens/cours/LeconWebViewScreen';
import LeconVideoScreen from '../screens/cours/LeconVideoScreen';
import QuizScreen from '../screens/cours/QuizScreen';
import QuizResultatScreen from '../screens/cours/QuizResultatScreen';
import ParrainageScreen from '../screens/parrainage/ParrainageScreen';
import FilleulsScreen from '../screens/parrainage/FilleulsScreen';
import ArbreParrainageScreen from '../screens/parrainage/ArbreParrainageScreen';
import CniInscriptionScreen from '../screens/cni/CniInscriptionscreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

const MainStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Écran principal avec PagerView + TabBar */}
      <Stack.Screen name="Dashboard" component={MainNavigator} />

      {/* Profil */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />

      {/* Paiements */}
      <Stack.Screen name="Paiement" component={PaiementScreen} />
      <Stack.Screen name="Transfert" component={TransfertScreen} />
      <Stack.Screen name="Historique" component={HistoriqueScreen} />
      <Stack.Screen name="PayerFrais" component={PayerFraisScreen} />

      {/* Cours */}
      <Stack.Screen name="CoursTheorique" component={CoursTheoriqueScreen} />
      <Stack.Screen name="CoursPratique" component={CoursPratiqueScreen} />
      <Stack.Screen name="ModuleDetail" component={ModuleDetailScreen} />
      <Stack.Screen name="ChapitreDetail" component={ChapitreDetailScreen} />
      <Stack.Screen name="LeconDetail" component={LeconDetailScreen} />
      <Stack.Screen name="LeconWebView" component={LeconWebViewScreen} />
      <Stack.Screen name="LeconVideo" component={LeconVideoScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen name="QuizResultat" component={QuizResultatScreen} />

      {/* Parrainage */}
      <Stack.Screen name="Parrainage" component={ParrainageScreen} />
      <Stack.Screen name="Filleuls" component={FilleulsScreen} />
      <Stack.Screen name="ArbreParrainage" component={ArbreParrainageScreen} />

      {/* CNI / Examen */}
      <Stack.Screen name="CniInscription" component={CniInscriptionScreen} />
    </Stack.Navigator>
  );
};

export default MainStackNavigator;