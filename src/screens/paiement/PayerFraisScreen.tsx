import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, Award, AlertCircle, Wallet, MessageCircle } from 'lucide-react-native';
import { theme } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../config/api';
import { FraisInfo } from '../../types/index';
import { formatCurrency, getFraisStatusLabel } from '../../utils/formatters';
import Toast from 'react-native-toast-message';

interface FraisStatus {
  formation: FraisInfo;
  inscription: FraisInfo;
  examen_blanc: FraisInfo;
  examen: FraisInfo;
}

type FraisType = 'formation' | 'inscription' | 'examen_blanc' | 'examen';
type ActiveTab = 'payer' | 'revendiquer';

export default function PayerFraisScreen() {
  const { token, user, refreshUser } = useAuth();
  const [fraisStatus, setFraisStatus] = useState<FraisStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState<FraisType | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('payer');

  useEffect(() => {
    loadFraisStatus();
  }, []);

  const loadFraisStatus = async () => {
    try {
      const response = await apiRequest<{ success: boolean; frais: FraisStatus; solde: number }>(
        '/frais/status', { method: 'GET' }, token
      );
      if (response.success) setFraisStatus(response.frais);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: error.message || 'Impossible de charger les frais' });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => { setIsRefreshing(true); loadFraisStatus(); };

  const handlePayerFrais = async (typeFrais: FraisType) => {
    if (!user) return;
    const frais = fraisStatus?.[typeFrais];
    if (!frais) return;
    if (frais.status === 'paye' || frais.status === 'dispense') {
      Toast.show({ type: 'info', text1: 'Information', text2: 'Ces frais sont deja payes ou dispenses' });
      return;
    }
    if (user.solde < frais.montant) {
      Toast.show({ type: 'error', text1: 'Solde insuffisant', text2: `Il vous manque ${formatCurrency(frais.montant - user.solde)}` });
      return;
    }
    setIsPaying(typeFrais);
    try {
      const response = await apiRequest<{ success: boolean; message: string; nouveau_solde: number; frais_payes: string }>(
        '/frais/payer',
        { method: 'POST', body: JSON.stringify({ type_frais: typeFrais }) },
        token
      );
      if (response.success) {
        Toast.show({ type: 'success', text1: 'Paiement reussi', text2: `Nouveau solde: ${formatCurrency(response.nouveau_solde)}` });
        await refreshUser();
        await loadFraisStatus();
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: error.message || 'Impossible d\'effectuer le paiement' });
    } finally {
      setIsPaying(null);
    }
  };

  const handleRevendiquer = () => {
    const phoneNumber = '659292001';
    const message = encodeURIComponent('Bonjour , je voudrais retirer l\'argent que j\'ai dans mon solde de l\'application Ange Raphael');
    const whatsappUrl = `whatsapp://send?phone=237${phoneNumber}&text=${message}`;
    const fallbackUrl = `https://wa.me/237${phoneNumber}?text=${message}`;
    Linking.canOpenURL(whatsappUrl)
      .then((supported) => Linking.openURL(supported ? whatsappUrl : fallbackUrl))
      .catch(() => Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible d\'ouvrir WhatsApp' }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paye': return <CheckCircle size={22} color="#22C55E" />;
      case 'dispense': return <Award size={22} color={theme.colors.niveau['3']} />;
      case 'non_paye': return <XCircle size={22} color="#EF4444" />;
      default: return <AlertCircle size={22} color="#94A3B8" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paye': return '#22C55E';
      case 'dispense': return theme.colors.niveau['3'];
      case 'non_paye': return '#EF4444';
      default: return '#94A3B8';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const formationData = fraisStatus?.formation;

  return (
    <SafeAreaView style={styles.wrapper} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#2563EB" />}
      >
        {/* Balance Card */}
        {user && (
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>SOLDE ACTUEL</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>{formatCurrency(user.solde)}</Text>
              <View style={styles.balanceIconContainer}>
                <Wallet size={20} color="#2563EB" />
              </View>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'payer' && styles.tabActive]}
            onPress={() => setActiveTab('payer')}
            activeOpacity={0.8}
          >
            <Wallet size={16} color={activeTab === 'payer' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'payer' && styles.tabTextActive]}>
              Payer mes frais
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'revendiquer' && styles.tabActiveGreen]}
            onPress={() => setActiveTab('revendiquer')}
            activeOpacity={0.8}
          >
            <MessageCircle size={16} color={activeTab === 'revendiquer' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'revendiquer' && styles.tabTextActive]}>
              Revendiquer
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB: Payer mes frais */}
        {activeTab === 'payer' && (
          <>
            {/* Info highlight */}
            <View style={styles.section}>
              <View style={styles.infoBanner}>
                <Text style={styles.infoBannerTitle}>💡 Un seul paiement requis</Text>
                <Text style={styles.infoBannerText}>
                  Un paiement unique de{' '}
                  <Text style={styles.infoBannerAmount}>{formatCurrency(formationData?.montant ?? 10000)}</Text>
                  {' '}suffit pour débloquer l'intégralité de vos cours théoriques et pratiques.
                </Text>
              </View>
            </View>

            {/* Frais card */}
            {formationData && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>FRAIS DE FORMATION</Text>
                <View style={styles.fraisCard}>
                  {/* Header */}
                  <View style={styles.fraisCardHeader}>
                    <View style={styles.fraisIconBox}>
                      {getStatusIcon(formationData.status)}
                    </View>
                    <View style={styles.fraisCardInfo}>
                      <Text style={styles.fraisCardLabel}>{formationData.label}</Text>
                      <Text style={styles.fraisCardMontant}>{formatCurrency(formationData.montant)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(formationData.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(formationData.status) }]}>
                        {getFraisStatusLabel(formationData.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  {formationData.description && (
                    <Text style={styles.fraisDescription}>{formationData.description}</Text>
                  )}

                  {/* Unlocked banner or Pay button */}
                  {(formationData.status === 'paye' || formationData.status === 'dispense') ? (
                    <View style={styles.unlockedBanner}>
                      <CheckCircle size={16} color="#22C55E" />
                      <Text style={styles.unlockedText}>
                        Vos cours théoriques et pratiques sont débloqués 🎉
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.payButton, isPaying === 'formation' && styles.payButtonDisabled]}
                      onPress={() => handlePayerFrais('formation')}
                      disabled={isPaying !== null}
                      activeOpacity={0.85}
                    >
                      {isPaying === 'formation' ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.payButtonText}>
                          Payer {formatCurrency(formationData.montant)} et débloquer mes cours
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </>
        )}

        {/* TAB: Revendiquer */}
        {activeTab === 'revendiquer' && (
          <View style={styles.section}>
            <View style={styles.revendiquerCard}>
              <View style={styles.whatsappIconBox}>
                <MessageCircle size={36} color="#25D366" />
              </View>

              <Text style={styles.revendiquerTitle}>Retirer votre solde</Text>
              <Text style={styles.revendiquerDescription}>
                Vous souhaitez récupérer l'argent présent sur votre solde ? Contactez notre équipe via WhatsApp. Un message pré-rempli sera envoyé automatiquement.
              </Text>

              {user && (
                <View style={styles.soldeRecap}>
                  <Text style={styles.soldeRecapLabel}>SOLDE ACTUEL</Text>
                  <Text style={styles.soldeRecapAmount}>{formatCurrency(user.solde)}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.whatsappButton}
                onPress={handleRevendiquer}
                activeOpacity={0.85}
              >
                <MessageCircle size={18} color="#FFFFFF" />
                <Text style={styles.whatsappButtonText}>Contacter via WhatsApp</Text>
              </TouchableOpacity>

              <Text style={styles.revendiquerNote}>📞 Numéro : +237 659 292 001</Text>
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },

  // Balance Card
  balanceCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    padding: 20,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.5,
  },
  balanceIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 9,
  },
  tabActive: {
    backgroundColor: '#2563EB',
  },
  tabActiveGreen: {
    backgroundColor: '#25D366',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // Sections
  section: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.1,
    marginBottom: 12,
  },

  // Info banner
  infoBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  infoBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 6,
  },
  infoBannerText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  infoBannerAmount: {
    fontWeight: '700',
    color: '#2563EB',
  },

  // Frais card
  fraisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
  },
  fraisCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fraisIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fraisCardInfo: {
    flex: 1,
  },
  fraisCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 3,
  },
  fraisCardMontant: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2563EB',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fraisDescription: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    lineHeight: 17,
  },
  unlockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  unlockedText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
  },
  payButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Revendiquer card
  revendiquerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 24,
    alignItems: 'center',
    gap: 14,
  },
  whatsappIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revendiquerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },
  revendiquerDescription: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
  soldeRecap: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  soldeRecapLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 4,
  },
  soldeRecapAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    borderRadius: 14,
    paddingVertical: 15,
    width: '100%',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  whatsappButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  revendiquerNote: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});