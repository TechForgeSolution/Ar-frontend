import React, { useCallback, useState, useEffect } from 'react';
import {
  Image,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { MainStackParamList, Dashboard } from '../../types';
import { theme } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../config/api';
import { formatCurrency } from '../../utils/formatters';
import Card from '../../components/common/Card';
import ProgressBar from '../../components/common/ProgressBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';

type Props = { navigation: NativeStackNavigationProp<MainStackParamList, 'Dashboard'> };

// ─────────────────────────────────────────────────────────────────────────────

const WHATSAPP_NUMBER = '237659292001'; // Cameroun (+237) + numéro

interface Advertisement {
  id: number;
  image_url: string;
  redirect_url: string;
  expires_at: number;
}

const isAdvertisement = (value: unknown): value is Advertisement => {
  if (!value || typeof value !== 'object') return false;
  return 'id' in value
    && Number.isInteger(value.id)
    && 'image_url' in value
    && typeof value.image_url === 'string'
    && 'redirect_url' in value
    && typeof value.redirect_url === 'string'
    && 'expires_at' in value
    && typeof value.expires_at === 'number';
};

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user, token } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [advertisement, setAdvertisement] = useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState({ jours: 0, heures: 0, minutes: 0, secondes: 0 });

  useEffect(() => { fetchDashboard(); }, []);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id || !token) return undefined;

      let isCurrent = true;
      const storageKey = `publicite_vue_${user.id}`;

      const loadAdvertisement = async () => {
        let cachedAdvertisement: Advertisement | null = null;

        try {
          const cachedValue = await SecureStore.getItemAsync(storageKey);
          if (cachedValue) {
            const parsedValue: unknown = JSON.parse(cachedValue);
            if (isAdvertisement(parsedValue) && parsedValue.expires_at > Date.now()) {
              cachedAdvertisement = parsedValue;
              if (isCurrent) setAdvertisement(parsedValue);
            } else {
              await SecureStore.deleteItemAsync(storageKey);
            }
          }
        } catch (error) {
          console.error('Erreur lors de la lecture de la publicité enregistrée:', error);
        }

        try {
          const response = await apiRequest<{
            success: boolean;
            publicite: Advertisement | null;
          }>('/publicite', { method: 'GET' }, token);

          if (response.publicite && isAdvertisement(response.publicite)
            && response.publicite.expires_at > Date.now()) {
            try {
              await SecureStore.setItemAsync(storageKey, JSON.stringify(response.publicite));
            } catch (error) {
              console.error('Erreur lors de l’enregistrement de la publicité:', error);
            }
            if (isCurrent) setAdvertisement(response.publicite);
          } else if (!cachedAdvertisement && isCurrent) {
            setAdvertisement(null);
          }
        } catch (error) {
          console.error('Erreur lors du chargement de la publicité:', error);
          if (!cachedAdvertisement && isCurrent) setAdvertisement(null);
        }
      };

      void loadAdvertisement();
      return () => {
        isCurrent = false;
      };
    }, [token, user?.id])
  );

  useEffect(() => {
    if (!advertisement || !user?.id) return undefined;

    const storageKey = `publicite_vue_${user.id}`;
    const hideAdvertisement = () => {
      setAdvertisement(current => current?.id === advertisement.id ? null : current);
      SecureStore.deleteItemAsync(storageKey).catch(error => {
        console.error('Erreur lors de la suppression de la publicité expirée:', error);
      });
    };
    const remainingTime = advertisement.expires_at - Date.now();

    if (remainingTime <= 0) {
      hideAdvertisement();
      return undefined;
    }

    const timeout = setTimeout(hideAdvertisement, remainingTime);
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active' && advertisement.expires_at <= Date.now()) {
        hideAdvertisement();
      }
    });

    return () => {
      clearTimeout(timeout);
      appStateSubscription.remove();
    };
  }, [advertisement, user?.id]);

  const dismissAdvertisement = async () => {
    if (!advertisement || !user?.id || !token) return;

    const dismissedAdvertisement = advertisement;
    setAdvertisement(null);
    try {
      await SecureStore.deleteItemAsync(`publicite_vue_${user.id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de la publicité:', error);
    }

    try {
      await apiRequest(`/publicite/${dismissedAdvertisement.id}/pris-note`, { method: 'POST' }, token);
    } catch (error) {
      console.error('Erreur lors de la confirmation de lecture de la publicité:', error);
      Toast.show({
        type: 'error',
        text1: 'Publicité masquée',
        text2: 'La confirmation de lecture n’a pas pu être envoyée.',
      });
    }
  };

  const openAdvertisement = async () => {
    if (!advertisement) return;
    try {
      await Linking.openURL(advertisement.redirect_url);
    } catch (error) {
      console.error('Erreur lors de l’ouverture du lien publicitaire:', error);
      Toast.show({
        type: 'error',
        text1: 'Lien indisponible',
        text2: 'Impossible d’ouvrir cette publicité.',
      });
    }
  };

  useEffect(() => {
    if (dashboard?.compte_a_rebours?.timestamp_cible) {
      const interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const diff = dashboard.compte_a_rebours.timestamp_cible - now;
        if (diff > 0) {
          setCountdown({
            jours:    Math.floor(diff / 86400),
            heures:   Math.floor((diff % 86400) / 3600),
            minutes:  Math.floor((diff % 3600) / 60),
            secondes: diff % 60,
          });
        } else {
          setCountdown({ jours: 0, heures: 0, minutes: 0, secondes: 0 });
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [dashboard]);

  const fetchDashboard = async () => {
    try {
      const data = await apiRequest<Dashboard>('/dashboard', { method: 'GET' }, token);
      setDashboard(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openWhatsApp = () => {
    const url = `whatsapp://send?phone=${WHATSAPP_NUMBER}`;
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Fallback vers WhatsApp Web
          Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}`);
        }
      })
      .catch(() => Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}`));
  };

  // ─── Calcul état de préparation ──────────────────────────────────────────

  const fraisPaye    = dashboard?.frais
    ? Object.values(dashboard.frais).every(f => f.status === 'paye' || f.status === 'dispense')
    : false;
  const theoriqueOk  = (dashboard?.progression?.theorique?.global?.pourcentage ?? 0) >= 100;
  const pratiqueOk   = (dashboard?.progression?.pratique?.global?.pourcentage ?? 0) >= 100;
  const isReady      = fraisPaye && theoriqueOk && pratiqueOk;

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) return <LoadingSpinner fullScreen message="Chargement..." />;

  const menuItems = [
    { icon: 'wallet',          label: 'Recharger',    color: theme.colors.success,   route: 'Paiement'      },
    { icon: 'swap-horizontal', label: 'Transférer',   color: theme.colors.info,      route: 'Transfert'     },
    { icon: 'receipt',         label: 'Historique',   color: theme.colors.warning,   route: 'Historique'    },
    { icon: 'card',            label: 'Beneficier',  color: theme.colors.secondary, route: 'PayerFrais'    },
    { icon: 'book',            label: 'Théorique',    color: theme.colors.primary,   route: 'CoursTheorique'},
    { icon: 'car',             label: 'Pratique',     color: theme.colors.error,     route: 'CoursPratique' },
    { icon: 'people',          label: 'Parrainage',   color: '#8B5CF6',              route: 'Parrainage'    },
    { icon: 'document-text',   label: "Examen",  color: '#0EA5E9',              route: 'CniInscription'},
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchDashboard(); }}
          />
        }
      >
        {advertisement && (
          <View style={styles.advertisementCard}>
            <View style={styles.advertisementHeader}>
              <Text style={styles.advertisementLabel}>PUBLICITÉ</Text>
            </View>
            <TouchableOpacity
              onPress={openAdvertisement}
              activeOpacity={0.9}
              accessibilityRole="link"
              accessibilityLabel="Ouvrir le lien de la publicité"
            >
              <Image
                source={{ uri: advertisement.image_url }}
                style={styles.advertisementImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.advertisementButton}
              onPress={dismissAdvertisement}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.advertisementButtonText}>J’ai pris note</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Header ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Bienvenue,</Text>
            <Text style={styles.userName}>{user?.prenom}</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={styles.avatarButton}
          >
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={24} color={theme.colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Solde ──────────────────────────────────────────── */}
        <Card style={styles.balanceCard}>
          <View style={styles.balanceContent}>
            <View style={styles.balanceHeader}>
              <View style={styles.balanceIconWrapper}>
                <Ionicons name="wallet-outline" size={20} color="#fff" />
              </View>
              <Text style={styles.balanceLabel}>Mon Solde</Text>
            </View>
            <Text style={styles.balanceAmount}>
              {formatCurrency(dashboard?.utilisateur?.solde ?? 0)}
            </Text>
          </View>
        </Card>

        {/* ── Menu de navigation ─────────────────────────────── */}
        <View style={styles.menuGrid}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '18' }]}>
                <Ionicons name={item.icon as any} size={26} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        

        {/* ── Progression ────────────────────────────────────── */}
        <Card title="Ma Progression" style={styles.section}>
          <View style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Cours Théoriques</Text>
              <Text style={styles.progressPercentage}>
                {dashboard?.progression?.theorique?.global?.pourcentage ?? 0}%
              </Text>
            </View>
            <ProgressBar
              progress={dashboard?.progression?.theorique?.global?.pourcentage ?? 0}
              showLabel={false}
              progressColor={theme.colors.primary}
            />
          </View>
          <View style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Cours Pratiques</Text>
              <Text style={styles.progressPercentage}>
                {dashboard?.progression?.pratique?.global?.pourcentage ?? 0}%
              </Text>
            </View>
            <ProgressBar
              progress={dashboard?.progression?.pratique?.global?.pourcentage ?? 0}
              showLabel={false}
              progressColor={theme.colors.secondary}
            />
          </View>
        </Card>

        {/* ── Compte à rebours ───────────────────────────────── */}
        {dashboard?.compte_a_rebours && !dashboard.compte_a_rebours.passe && (
          <Card title="Compte à rebours — Examen" style={styles.section}>
            <View style={styles.countdownRow}>
              {[
                { v: countdown.jours,    l: 'Jours'  },
                { v: countdown.heures,   l: 'Heures' },
                { v: countdown.minutes,  l: 'Min'    },
                { v: countdown.secondes, l: 'Sec'    },
              ].map((item, i) => (
                <View key={i} style={styles.countdownItem}>
                  <View style={styles.countdownBox}>
                    <Text style={styles.countdownValue}>
                      {item.v.toString().padStart(2, '0')}
                    </Text>
                  </View>
                  <Text style={styles.countdownLabel}>{item.l}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* ── Footer ─────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.footerContainer}
          onPress={() =>
            Linking.openURL('https://techforgesolution237.site').catch(err =>
              console.error('Error opening URL:', err)
            )
          }
          activeOpacity={0.7}
        >
          <Text style={styles.footerText}>
            Powered by{' '}
            <Text style={styles.footerLink}>TechForgeSolution237</Text>
          </Text>
        </TouchableOpacity>

        {/* Espace en bas pour éviter que le FAB cache du contenu */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ── Bouton WhatsApp flottant ───────────────────────── */}
      <TouchableOpacity
        style={styles.whatsappFab}
        onPress={openWhatsApp}
        activeOpacity={0.85}
      >
        {/* Icône SVG WhatsApp via Image URI (ou utilisez react-native-svg si disponible) */}
        <WhatsAppIcon size={32} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// ─── Composant icône WhatsApp ──────────────────────────────────────────────────
// Rendu via react-native-svg (déjà inclus dans Expo SDK)
// Si react-native-svg n'est pas disponible, un fallback View stylisé est utilisé
import Svg, { Path } from 'react-native-svg';

const WhatsAppIcon: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <Svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="#ffffff"
  >
    {/* Icône officielle WhatsApp */}
    <Path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  advertisementCard: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  advertisementHeader: {
    paddingHorizontal: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
  },
  advertisementLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  advertisementImage: {
    width: '100%',
    height: 170,
    borderRadius: 10,
    backgroundColor: theme.colors.border,
  },
  advertisementButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginTop: theme.spacing.xs,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  advertisementButtonText: {
    ...theme.typography.bodySmall,
    color: '#fff',
    fontWeight: '700',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerLeft:      { flex: 1 },
  greeting:        { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginBottom: 4 },
  userName:        { ...theme.typography.h2, color: theme.colors.textPrimary, fontWeight: '700' },
  avatarButton:    { padding: 4 },
  avatarContainer: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: theme.colors.primary + '30',
  },

  // Balance
  balanceCard: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    elevation: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  balanceContent:    { paddingVertical: theme.spacing.sm },
  balanceHeader:     { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs },
  balanceIconWrapper:{
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  balanceLabel:  { ...theme.typography.bodySmall, color: '#fff', opacity: 0.95, fontWeight: '500' },
  balanceAmount: { ...theme.typography.h1, color: '#fff', fontWeight: '700', letterSpacing: 0.5 },

  // Menu
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  menuItem:  { width: '25%', alignItems: 'center', paddingVertical: theme.spacing.sm },
  menuIcon:  {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  menuLabel: { ...theme.typography.caption, color: theme.colors.textPrimary, textAlign: 'center', fontWeight: '500' },

  // Section générique
  section: { marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md },

  // Readiness card
  readinessHeader:      { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginBottom: 4 },
  readinessIconWrapper: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  readyIcon:            { backgroundColor: '#10B981' },
  notReadyIcon:         { backgroundColor: '#F59E0B' },
  readinessTitle:       { ...theme.typography.h4, color: theme.colors.textPrimary, fontWeight: '700' },
  readinessSubtitle:    { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  divider:              { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.md },

  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  criteriaIcon:    { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  doneIcon:        { backgroundColor: '#10B981' },
  pendingIcon:     { backgroundColor: '#F59E0B' },
  criteriaLabel:   { ...theme.typography.bodySmall, color: theme.colors.textPrimary, fontWeight: '600' },
  criteriaStatus:  { ...theme.typography.caption, marginTop: 2 },

  // Progression
  progressItem:    { marginBottom: theme.spacing.lg },
  progressHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm },
  progressLabel:   { ...theme.typography.bodySmall, color: theme.colors.textPrimary, fontWeight: '500' },
  progressPercentage: { ...theme.typography.bodySmall, color: theme.colors.primary, fontWeight: '700' },

  // Countdown
  countdownRow:  { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: theme.spacing.sm },
  countdownItem: { alignItems: 'center', gap: theme.spacing.sm },
  countdownBox:  {
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  countdownValue: { ...theme.typography.h2, color: theme.colors.primary, fontWeight: '700' },
  countdownLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, fontWeight: '500' },

  // Footer
  footerContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  footerText: { ...theme.typography.caption, color: theme.colors.textSecondary, textAlign: 'center' },
  footerLink: { color: theme.colors.primary, fontWeight: '600' },

  // ── WhatsApp FAB ──────────────────────────────────────────────────────────
  whatsappFab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#25D366',           // couleur officielle WhatsApp
    alignItems: 'center',
    justifyContent: 'center',
    // Ombre portée
    elevation: 8,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
});

export default DashboardScreen;