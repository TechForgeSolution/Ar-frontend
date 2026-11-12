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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList, Dashboard } from '../../types';
import { theme } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../config/api';
import { formatCurrency } from '../../utils/formatters';
import Card from '../../components/common/Card';
import ProgressBar from '../../components/common/ProgressBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Svg, { Path } from 'react-native-svg';

// ─────────────────────────────────────────────────────────────────────────────

const WHATSAPP_NUMBER = '237659292001'; // Cameroun (+237) + numéro

interface DashboardAdvertisement {
  id: number;
  image_url: string;
  redirect_url: string;
  expires_at: number;
}

const DashboardScreen: React.FC = () => {
  // ✅ useNavigation hook au lieu de la prop navigation
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const { user, token } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState({ jours: 0, heures: 0, minutes: 0, secondes: 0 });
  const [advertisement, setAdvertisement] = useState<DashboardAdvertisement | null>(null);

  useEffect(() => { fetchDashboard(); }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const fetchAdvertisement = async () => {
        if (!token) return;
        try {
          const response = await apiRequest<{
            success: boolean;
            publicite: DashboardAdvertisement | null;
          }>('/publicite', { method: 'GET' }, token);
          if (active) {
            const ad = response.publicite;
            setAdvertisement(ad && ad.expires_at > Date.now() ? ad : null);
          }
        } catch (error) {
          console.error('Erreur de chargement de la publicité:', error);
        }
      };

      void fetchAdvertisement();
      return () => { active = false; };
    }, [token])
  );

  useEffect(() => {
    if (!advertisement) return;
    const timer = setTimeout(
      () => setAdvertisement(null),
      Math.max(0, advertisement.expires_at - Date.now())
    );
    return () => clearTimeout(timer);
  }, [advertisement]);

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
          Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}`);
        }
      })
      .catch(() => Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}`));
  };

  const openAdvertisement = async () => {
    if (!advertisement) return;
    try {
      await Linking.openURL(advertisement.redirect_url);
    } catch (error) {
      console.error('Impossible d’ouvrir le lien publicitaire:', error);
    }
  };

  const dismissAdvertisement = async () => {
    if (!advertisement) return;
    const advertisementId = advertisement.id;
    setAdvertisement(null);
    try {
      await apiRequest(
        `/publicite/${advertisementId}/pris-note`,
        { method: 'POST' },
        token
      );
    } catch (error) {
      console.error('Impossible de confirmer la lecture de la publicité:', error);
    }
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
    { icon: 'receipt',         label: 'Historique',   color: theme.colors.warning,   route: 'Historique'    },
    { icon: 'card',            label: 'Beneficier',   color: theme.colors.secondary, route: 'PayerFrais'    },
    { icon: 'people',          label: 'Parrainage',   color: '#8B5CF6',              route: 'Parrainage'    },
    { icon: 'document-text',   label: 'Examen',       color: '#0EA5E9',              route: 'CniInscription'},
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
          <View style={styles.advertisement}>
            <TouchableOpacity onPress={openAdvertisement} activeOpacity={0.9}>
              <Image
                source={{ uri: advertisement.image_url }}
                style={styles.advertisementImage}
                resizeMode="cover"
                accessibilityLabel="Publicité"
              />
            </TouchableOpacity>
            <View style={styles.advertisementFooter}>
              <Text style={styles.advertisementLabel}>Publicité</Text>
              <TouchableOpacity
                style={styles.advertisementDismiss}
                onPress={dismissAdvertisement}
                activeOpacity={0.75}
              >
                <Text style={styles.advertisementDismissText}>J’ai pris note</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Header ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              style={styles.avatarButton}
            >
              <View style={styles.avatarContainer}>
                <Ionicons name="person" size={22} color="#fff" />
              </View>
            </TouchableOpacity>
            <View style={styles.headerTextWrapper}>
              <Text style={styles.greeting}>Bonjour 👋</Text>
              <Text style={styles.userName}>{user?.prenom}</Text>
            </View>
          </View>
        </View>

        {/* ── Solde ──────────────────────────────────────────── */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceCircle1} />
          <View style={styles.balanceCircle2} />

          <Text style={styles.balanceLabel}>MON SOLDE</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(dashboard?.utilisateur?.solde ?? 0)}
          </Text>

          <View style={styles.balanceActions}>
            <TouchableOpacity
              style={styles.balanceBtnPrimary}
              onPress={() => navigation.navigate('Paiement' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={16} color="#fff" />
              <Text style={styles.balanceBtnPrimaryText}>Recharger</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.balanceBtnOutline}
              onPress={() => navigation.navigate('Transfert' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="paper-plane-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.balanceBtnOutlineText}>Transférer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Actions rapides label ──────────────────────────── */}
        <Text style={styles.sectionTitle}>Actions Rapides</Text>

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
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Progression label ──────────────────────────────── */}
        <Text style={styles.sectionTitle}>Progression des cours</Text>

        {/* ── Progression ────────────────────────────────────── */}
        <View style={styles.progressionWrapper}>
          {/* Cours Théorique */}
          <View style={styles.progressCard}>
            <View style={styles.progressCardHeader}>
              <View style={[styles.progressIconWrapper, { backgroundColor: theme.colors.primary + '15' }]}>
                <Ionicons name="book-outline" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>Cours Théorique</Text>
              </View>
              <View style={[styles.progressBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                <Text style={[styles.progressBadgeText, { color: theme.colors.primary }]}>
                  {dashboard?.progression?.theorique?.global?.pourcentage ?? 0}%
                </Text>
              </View>
            </View>
            <ProgressBar
              progress={dashboard?.progression?.theorique?.global?.pourcentage ?? 0}
              showLabel={false}
              progressColor={theme.colors.primary}
            />
          </View>

          {/* Cours Pratique */}
          <View style={styles.progressCard}>
            <View style={styles.progressCardHeader}>
              <View style={[styles.progressIconWrapper, { backgroundColor: '#F97316' + '15' }]}>
                <Ionicons name="car-outline" size={20} color="#F97316" />
              </View>
              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>Cours Pratique</Text>
              </View>
              <View style={[styles.progressBadge, { backgroundColor: '#F97316' + '15' }]}>
                <Text style={[styles.progressBadgeText, { color: '#F97316' }]}>
                  {dashboard?.progression?.pratique?.global?.pourcentage ?? 0}%
                </Text>
              </View>
            </View>
            <ProgressBar
              progress={dashboard?.progression?.pratique?.global?.pourcentage ?? 0}
              showLabel={false}
              progressColor="#F97316"
            />
          </View>
        </View>

        {/* ── Compte à rebours ───────────────────────────────── */}
        {dashboard?.compte_a_rebours && !dashboard.compte_a_rebours.passe && (
          <View style={styles.examCard}>
            <View style={styles.examLeft}>
              <View style={styles.examDaysBox}>
                <Text style={styles.examDaysNumber}>{countdown.jours.toString().padStart(2, '0')}</Text>
                <Text style={styles.examDaysLabel}>JOURS</Text>
              </View>
            </View>
            <View style={styles.examInfo}>
              <Text style={styles.examTitle}>Examen Final</Text>
              <Text style={styles.examSubtitle}>
                {`${countdown.heures.toString().padStart(2,'0')}h ${countdown.minutes.toString().padStart(2,'0')}m ${countdown.secondes.toString().padStart(2,'0')}s`}
              </Text>
            </View>
          </View>
        )}

        {/* ── Footer ─────────────────────────────────────────── */}
        <TouchableOpacity
  style={styles.footerContainer}
  onPress={() =>
    Linking.openURL('https://tfs237.com').catch(err =>
      console.error('Error opening URL:', err)
    )
  }
  activeOpacity={0.7}
>
  <Text style={styles.footerText}>
    Application officielle du CFPAM Group{"\n\n"}
    Développée par{" "}
    <Text style={styles.footerLink}>
      Tech Forge Solutions 237
    </Text>
  </Text>
</TouchableOpacity>
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ── Bouton WhatsApp flottant ───────────────────────── */}
      <TouchableOpacity
        style={styles.whatsappFab}
        onPress={openWhatsApp}
        activeOpacity={0.85}
      >
        <WhatsAppIcon size={32} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// ─── Composant icône WhatsApp ──────────────────────────────────────────────────

const WhatsAppIcon: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <Svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="#ffffff"
  >
    <Path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  advertisement: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  advertisementImage: { width: '100%', height: 150, backgroundColor: '#E2E8F0' },
  advertisementFooter: {
    minHeight: 44,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  advertisementLabel: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  advertisementDismiss: { paddingVertical: 8, paddingHorizontal: 10 },
  advertisementDismissText: { color: '#2563EB', fontSize: 13, fontWeight: '600' },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#F4F6FA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTextWrapper: { flex: 1 },
  greeting: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '400',
    lineHeight: 18,
  },
  userName: {
    fontSize: 18,
    color: '#0F172A',
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  avatarButton: {},
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // ── Balance Card ────────────────────────────────────────────────────────
  balanceCard: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 24,
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  balanceCircle1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -30,
    right: -20,
  },
  balanceCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -20,
    right: 60,
  },
  balanceLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  balanceAmount: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  balanceBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  balanceBtnPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 11,
  },
  balanceBtnOutlineText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Section Title ────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginHorizontal: 20,
    marginBottom: 14,
  },

  // ── Menu Grid ───────────────────────────────────────────────────────────
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  menuItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  menuIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  menuLabel: {
    fontSize: 11,
    color: '#334155',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 14,
  },

  // ── Progression ─────────────────────────────────────────────────────────
  progressionWrapper: {
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  progressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  progressIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressInfo: { flex: 1 },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  progressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  progressBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Exam Countdown Card ──────────────────────────────────────────────────
  examCard: {
    backgroundColor: '#1E293B',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  examLeft: {},
  examDaysBox: {
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 58,
  },
  examDaysNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 26,
  },
  examDaysLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  examInfo: { flex: 1 },
  examTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  examSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
  },
  examArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Footer ──────────────────────────────────────────────────────────────
  footerContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  footerLink: {
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // ── WhatsApp FAB ─────────────────────────────────────────────────────────
  whatsappFab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
});

export default DashboardScreen;