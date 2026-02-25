import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../config/theme';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const getInitials = () => {
    const firstInitial = user.nom.charAt(0).toUpperCase();
    const lastInitial = user.prenom.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  };

  const getPermisLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      permis_a: 'Permis A (Moto)',
      permis_b: 'Permis B (Voiture)',
      permis_t: 'Permis T (Tracteur)',
    };
    return labels[type] || type;
  };

  const getCoursLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      en_ligne: 'En ligne',
      presentiel: 'En présentiel',
      les_deux: 'En ligne & Présentiel',
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: { text: string; color: string } } = {
      non_paye: { text: 'Non payé', color: '#EF4444' },
      paye: { text: 'Payé', color: '#10B981' },
      dispense: { text: 'Dispensé', color: '#3B82F6' },
    };
    return labels[status] || { text: status, color: '#6B7280' };
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            await logout();
            setIsLoggingOut(false);
          },
        },
      ]
    );
  };

  const InfoRow = ({ icon, label, value, onPress }: any) => (
    <TouchableOpacity
      style={styles.infoRow}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.infoLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  const StatusBadge = ({ status, label }: { status: string; label: string }) => {
    const statusInfo = getStatusLabel(status);
    return (
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>{label}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
     <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
     
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section Avatar */}
        <View style={styles.avatarSection}>
          <LinearGradient
            colors={['#667EEA', '#764BA2']}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </LinearGradient>
          <Text style={styles.userName}>
            {user.prenom} {user.nom}
          </Text>
          <Text style={styles.userCode}>Code: {user.code_parrainage}</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.editButtonText}>Modifier le profil</Text>
          </TouchableOpacity>
        </View>

        {/* Carte Solde */}
        <View style={styles.section}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.soldeCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.soldeHeader}>
              <Ionicons name="wallet" size={24} color="#fff" />
              <Text style={styles.soldeLabel}>Solde disponible</Text>
            </View>
            <Text style={styles.soldeAmount}>
              {user.solde.toLocaleString('fr-FR')} FCFA
            </Text>
          </LinearGradient>
        </View>

        {/* Informations personnelles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          <View style={styles.card}>
            <InfoRow
              icon="call"
              label="Téléphone"
              value={user.telephone}
            />
            <InfoRow
              icon="calendar"
              label="Date de naissance"
              value={user.date_naissance || 'Non renseignée'}
            />
            <InfoRow
              icon="location"
              label="Quartier"
              value={user.quartier || 'Non renseigné'}
            />
          </View>
        </View>

        {/* Informations de formation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Formation</Text>
          <View style={styles.card}>
            <InfoRow
              icon="car-sport"
              label="Type de permis"
              value={getPermisLabel(user.type_permis)}
            />
            <InfoRow
              icon="school"
              label="Type de cours"
              value={getCoursLabel(user.type_cours)}
            />
            <InfoRow
              icon="ribbon"
              label="Vague"
              value={`Vague ${user.vague}`}
            />
            <InfoRow
              icon="trophy"
              label="Niveau de parrainage"
              value={`Niveau ${user.niveau_parrainage}`}
            />
            {user.session && (
              <InfoRow
                icon="calendar-outline"
                label="Session d'examen"
                value={user.session.nom}
              />
            )}
            {user.centreExamen && (
              <InfoRow
                icon="business"
                label="Centre d'examen"
                value={user.centreExamen.nom}
              />
            )}
          </View>
        </View>

        

        {/* Lieux de pratique */}
        {user.lieuxPratique && user.lieuxPratique.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lieux de pratique</Text>
            <View style={styles.card}>
              {user.lieuxPratique.map((lieu) => (
                <View key={lieu.id} style={styles.lieuItem}>
                  <Ionicons name="location-sharp" size={20} color={theme.colors.primary} />
                  <Text style={styles.lieuText}>{lieu.nom}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Informations supplémentaires */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations supplémentaires</Text>
          <View style={styles.card}>
            <InfoRow
              icon="checkmark-circle"
              label="Cours débloqués"
              value={user.cours_debloques ? 'Oui' : 'Non'}
            />
            <InfoRow
              icon="shield-checkmark"
              label="Compte validé"
              value={user.validated ? 'Oui' : 'En attente'}
            />
            {user.premier_depot_at && (
              <InfoRow
                icon="calendar-outline"
                label="Premier dépôt"
                value={new Date(user.premier_depot_at).toLocaleDateString('fr-FR')}
              />
            )}
            <InfoRow
              icon="time"
              label="Membre depuis"
              value={new Date(user.created_at).toLocaleDateString('fr-FR')}
            />
          </View>
        </View>

        {/* Bouton de déconnexion */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
            <Text style={styles.logoutText}>
              {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  userCode: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    marginHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  soldeCard: {
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  soldeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  soldeLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  soldeAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  lieuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  lieuText: {
    fontSize: 15,
    color: '#374151',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FEE2E2',
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  bottomSpacer: {
    height: 32,
  },
});

export default ProfileScreen;