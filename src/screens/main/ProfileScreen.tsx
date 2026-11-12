import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Linking,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../config/theme';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { apiRequest } from '../../config/api'; // adapte le chemin si besoin

export const ProfileScreen = () => {
  const { user, logout, token } = useAuth(); // assure-toi que token est exposé par useAuth
  const navigation = useNavigation<any>();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const getPermisLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      permis_a: 'Type A (Moto)',
      permis_b: 'Type B (Véhicules légers)',
      permis_t: 'Type T (Tracteur)',
    };
    return labels[type] || type;
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
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

  const handleSupprimerCompte = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Votre compte sera définitivement supprimé. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingAccount(true);
            try {
              await apiRequest(
                '/compte/supprimer',
                { method: 'DELETE' },
                token
              );
              Alert.alert('Compte supprimé', 'Votre compte a été supprimé avec succès.', [
                {
                  text: 'OK',
                  onPress: async () => {
                    await logout();
                  },
                },
              ]);
            } catch (error: any) {
              Alert.alert('Erreur', error?.message || 'Une erreur est survenue.');
            } finally {
              setIsDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  const handleConfidentialite = () => {
    Linking.openURL('https://ange-raphael.supahuman.site/politique.html');
  };

  // ─── Info row ────────────────────────────────────────────────────────────────
  const InfoRow = ({
    icon,
    label,
    value,
    badge,
  }: {
    icon: any;
    label: string;
    value: string;
    badge?: { text: string; color: string };
  }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
      {badge && (
        <View style={[styles.badge, { backgroundColor: badge.color + '18' }]}>
          <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
        </View>
      )}
    </View>
  );

  // ─── Preference row ───────────────────────────────────────────────────────────
  const PrefRow = ({
    icon,
    label,
    onPress,
    destructive,
  }: {
    icon: any;
    label: string;
    onPress: () => void;
    destructive?: boolean;
  }) => (
    <TouchableOpacity style={styles.prefRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.prefLeft}>
        <Ionicons
          name={icon}
          size={20}
          color={destructive ? '#EF4444' : '#374151'}
        />
        <Text style={[styles.prefLabel, destructive && { color: '#EF4444' }]}>
          {label}
        </Text>
      </View>
      {!destructive && (
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mon Profil</Text>
          <TouchableOpacity style={styles.headerBtn} />
        </View>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Avatar card ── */}
          <View style={styles.avatarCard}>
            <View style={styles.avatarWrap}>
              <LinearGradient colors={['#C68642', '#A0522D']} style={styles.avatarGradient}>
                <Ionicons name="person-circle-outline" size={64} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={styles.userName}>
              {user.prenom} {user.nom}
            </Text>

            {user.validated && (
              <View style={styles.verifiedRow}>
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                <Text style={styles.verifiedText}>Utilisateur vérifié</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('EditProfile')}
              activeOpacity={0.85}
            >
              <Ionicons name="pencil" size={16} color="#fff" />
              <Text style={styles.editBtnText}>Modifier le profil</Text>
            </TouchableOpacity>
          </View>

          {/* ── Informations personnelles ── */}
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          <View style={styles.card}>
            <InfoRow icon="call-outline" label="TÉLÉPHONE" value={user.telephone} />
            <View style={styles.divider} />
            <InfoRow icon="mail-outline" label="EMAIL" value={user.email || 'Non renseigné'} />
            <View style={styles.divider} />
            <InfoRow
              icon="car-outline"
              label="PERMIS DE CONDUIRE"
              value={getPermisLabel(user.type_permis)}
              badge={
                user.validated
                  ? { text: 'VALIDE', color: '#10B981' }
                  : { text: 'EN ATTENTE', color: '#F59E0B' }
              }
            />
            {user.session && (
              <>
                <View style={styles.divider} />
                <InfoRow
                  icon="calendar-outline"
                  label="SESSION D'EXAMEN"
                  value={user.session.nom}
                />
              </>
            )}
            <View style={styles.divider} />
            <InfoRow
              icon="book-outline"
              label="COURS DÉBLOQUÉS"
              value={user.cours_debloques ? 'Oui' : 'Non'}
              badge={
                user.cours_debloques
                  ? { text: 'OUI', color: '#10B981' }
                  : { text: 'NON', color: '#EF4444' }
              }
            />
            <View style={styles.divider} />
            <InfoRow
              icon="shield-checkmark-outline"
              label="COMPTE VALIDÉ"
              value={user.validated ? 'Validé' : 'En attente'}
              badge={
                user.validated
                  ? { text: 'VALIDÉ', color: '#10B981' }
                  : { text: 'EN ATTENTE', color: '#F59E0B' }
              }
            />
          </View>

          {/* ── Préférences & Sécurité ── */}
          <Text style={styles.sectionTitle}>Préférences &amp; Sécurité</Text>
          <View style={styles.card}>
            <PrefRow
              icon="notifications-outline"
              label="Notifications"
              onPress={() => setShowNotifications(true)}
            />
            <View style={styles.divider} />
            <PrefRow
              icon="shield-outline"
              label="Confidentialité"
              onPress={handleConfidentialite}
            />
            <View style={styles.divider} />
            <PrefRow
              icon="log-out-outline"
              label={isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
              onPress={handleLogout}
              destructive
            />
            <View style={styles.divider} />
            <PrefRow
              icon="trash-outline"
              label={isDeletingAccount ? 'Suppression...' : 'Supprimer mon compte'}
              onPress={handleSupprimerCompte}
              destructive
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* ── Modal Notifications ── */}
        <Modal
          visible={showNotifications}
          transparent
          animationType="slide"
          onRequestClose={() => setShowNotifications(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Notifications</Text>
                <TouchableOpacity onPress={() => setShowNotifications(false)}>
                  <Ionicons name="close" size={22} color="#111827" />
                </TouchableOpacity>
              </View>
              <View style={styles.emptyNotif}>
                <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyNotifText}>Aucune notification</Text>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#6B7280' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
  },
  headerBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  avatarCard: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatarGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: { fontSize: 32, fontWeight: '700', color: '#fff' },
  userName: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 4 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  verifiedText: { fontSize: 13, color: theme.colors.primary, fontWeight: '500' },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderRadius: 30,
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  editBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    marginHorizontal: 16,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  divider: { height: 1, backgroundColor: '#F3F4F6' },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextWrap: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#111827' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  prefLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  prefLabel: { fontSize: 15, fontWeight: '500', color: '#374151' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    minHeight: 260,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  emptyNotif: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyNotifText: { fontSize: 15, color: '#9CA3AF', fontWeight: '500' },
});

export default ProfileScreen;