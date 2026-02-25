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
import {
  CheckCircle,
  XCircle,
  Award,
  AlertCircle,
  Wallet,
  MessageCircle,
} from 'lucide-react-native';
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
      const response = await apiRequest<{
        success: boolean;
        frais: FraisStatus;
        solde: number;
      }>('/frais/status', { method: 'GET' }, token);

      if (response.success) {
        setFraisStatus(response.frais);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible de charger les frais',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadFraisStatus();
  };

  const handlePayerFrais = async (typeFrais: FraisType) => {
    if (!user) return;

    const frais = fraisStatus?.[typeFrais];
    if (!frais) return;

    if (frais.status === 'paye' || frais.status === 'dispense') {
      Toast.show({
        type: 'info',
        text1: 'Information',
        text2: 'Ces frais sont deja payes ou dispenses',
      });
      return;
    }

    if (user.solde < frais.montant) {
      Toast.show({
        type: 'error',
        text1: 'Solde insuffisant',
        text2: `Il vous manque ${formatCurrency(frais.montant - user.solde)}`,
      });
      return;
    }

    setIsPaying(typeFrais);
    try {
      const response = await apiRequest<{
        success: boolean;
        message: string;
        nouveau_solde: number;
        frais_payes: string;
      }>(
        '/frais/payer',
        {
          method: 'POST',
          body: JSON.stringify({ type_frais: typeFrais }),
        },
        token
      );

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Paiement reussi',
          text2: `Nouveau solde: ${formatCurrency(response.nouveau_solde)}`,
        });
        await refreshUser();
        await loadFraisStatus();
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible d\'effectuer le paiement',
      });
    } finally {
      setIsPaying(null);
    }
  };

  const handleRevendiquer = () => {
    const phoneNumber = '659292001';
    const message = encodeURIComponent(
      'Bonjour , je voudrais retirer l\'argent que j\'ai dans mon solde de l\'application Ange Raphael'
    );
    const whatsappUrl = `whatsapp://send?phone=237${phoneNumber}&text=${message}`;
    const fallbackUrl = `https://wa.me/237${phoneNumber}?text=${message}`;

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          return Linking.openURL(fallbackUrl);
        }
      })
      .catch(() => {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: 'Impossible d\'ouvrir WhatsApp',
        });
      });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paye':
        return <CheckCircle size={24} color={theme.colors.success} />;
      case 'dispense':
        return <Award size={24} color={theme.colors.niveau['3']} />;
      case 'non_paye':
        return <XCircle size={24} color={theme.colors.error} />;
      default:
        return <AlertCircle size={24} color={theme.colors.textSecondary} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paye':
        return theme.colors.success;
      case 'dispense':
        return theme.colors.niveau['3'];
      case 'non_paye':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const formationData = fraisStatus?.formation;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Mon portefeuille</Text>
        <Text style={styles.subtitle}>
          Gérez vos frais et votre solde
        </Text>
      </View>

      {user && (
        <View style={styles.balanceCard}>
          <Wallet size={24} color={theme.colors.textInverse} />
          <View style={styles.balanceContent}>
            <Text style={styles.balanceLabel}>Solde disponible</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(user.solde)}</Text>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'payer' && styles.tabActive]}
          onPress={() => setActiveTab('payer')}
        >
          <Wallet
            size={18}
            color={activeTab === 'payer' ? theme.colors.textInverse : theme.colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'payer' && styles.tabTextActive]}>
            Payer mes frais
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'revendiquer' && styles.tabActiveGreen]}
          onPress={() => setActiveTab('revendiquer')}
        >
          <MessageCircle
            size={18}
            color={activeTab === 'revendiquer' ? theme.colors.textInverse : theme.colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'revendiquer' && styles.tabTextActive]}>
            Revendiquer mon argent
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab: Payer mes frais */}
      {activeTab === 'payer' && (
        <>
          <View style={styles.infoHighlight}>
            <Text style={styles.infoHighlightTitle}>💡 Un seul paiement requis</Text>
            <Text style={styles.infoHighlightText}>
              Un paiement unique de{' '}
              <Text style={styles.infoHighlightAmount}>
                {formatCurrency(formationData?.montant ?? 10000)}
              </Text>{' '}
              suffit pour débloquer l'intégralité de vos cours — aussi bien les cours
              théoriques que les cours pratiques.
            </Text>
          </View>

          {formationData && (
            <View style={styles.fraisContainer}>
              <View style={styles.fraisCard}>
                <View style={styles.fraisHeader}>
                  <View style={styles.fraisIcon}>
                    {getStatusIcon(formationData.status)}
                  </View>
                  <View style={styles.fraisInfo}>
                    <Text style={styles.fraisLabel}>{formationData.label}</Text>
                    <Text style={styles.fraisMontant}>
                      {formatCurrency(formationData.montant)}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(formationData.status) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(formationData.status) },
                    ]}
                  >
                    {getFraisStatusLabel(formationData.status)}
                  </Text>
                </View>

                {formationData.description && (
                  <Text style={styles.fraisDescription}>
                    {formationData.description}
                  </Text>
                )}

                {formationData.status === 'paye' || formationData.status === 'dispense' ? (
                  <View style={styles.unlockedBanner}>
                    <CheckCircle size={18} color={theme.colors.success} />
                    <Text style={styles.unlockedText}>
                      Vos cours théoriques et pratiques sont débloqués 🎉
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.payButton,
                      isPaying === 'formation' && styles.payButtonDisabled,
                    ]}
                    onPress={() => handlePayerFrais('formation')}
                    disabled={isPaying !== null}
                  >
                    {isPaying === 'formation' ? (
                      <ActivityIndicator
                        size="small"
                        color={theme.colors.textInverse}
                      />
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

      {/* Tab: Revendiquer mon argent */}
      {activeTab === 'revendiquer' && (
        <View style={styles.revendiquerContainer}>
          <View style={styles.revendiquerCard}>
            <View style={styles.whatsappIconContainer}>
              <MessageCircle size={40} color="#25D366" />
            </View>

            <Text style={styles.revendiquerTitle}>Retirer votre solde</Text>
            <Text style={styles.revendiquerDescription}>
              Vous souhaitez récupérer l'argent présent sur votre solde ? Contactez
              notre équipe directement via WhatsApp. Un message pré-rempli sera
              envoyé automatiquement.
            </Text>

            {user && (
              <View style={styles.soldeRecap}>
                <Text style={styles.soldeRecapLabel}>Votre solde actuel</Text>
                <Text style={styles.soldeRecapAmount}>{formatCurrency(user.solde)}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={handleRevendiquer}
            >
              <MessageCircle size={20} color="#fff" />
              <Text style={styles.whatsappButtonText}>
                Contacter via WhatsApp
              </Text>
            </TouchableOpacity>

            <Text style={styles.revendiquerNote}>
              📞 Numéro : +237 659 292 001
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.md,
  },
  balanceContent: {
    flex: 1,
  },
  balanceLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textInverse,
    marginBottom: theme.spacing.xs,
  },
  balanceAmount: {
    ...theme.typography.h2,
    color: theme.colors.textInverse,
    fontWeight: '700',
  },
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.lg,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabActiveGreen: {
    backgroundColor: '#25D366',
  },
  tabText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  tabTextActive: {
    color: theme.colors.textInverse,
  },
  // Frais de formation
  infoHighlight: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary + '12',
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  infoHighlightTitle: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  infoHighlightText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  infoHighlightAmount: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
  fraisContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  fraisCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    ...theme.shadows.md,
  },
  fraisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  fraisIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fraisInfo: {
    flex: 1,
  },
  fraisLabel: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  fraisMontant: {
    ...theme.typography.h4,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    ...theme.typography.bodySmall,
    fontWeight: '600',
  },
  fraisDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  unlockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.success + '15',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  unlockedText: {
    ...theme.typography.bodySmall,
    color: theme.colors.success,
    fontWeight: '600',
    flex: 1,
  },
  payButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
  // Revendiquer
  revendiquerContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  revendiquerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
    ...theme.shadows.md,
  },
  whatsappIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#25D36615',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  revendiquerTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },
  revendiquerDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  soldeRecap: {
    width: '100%',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginVertical: theme.spacing.xs,
  },
  soldeRecapLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  soldeRecapAmount: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: '#25D366',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    width: '100%',
    marginTop: theme.spacing.xs,
  },
  whatsappButtonText: {
    ...theme.typography.button,
    color: '#fff',
    fontWeight: '700',
  },
  revendiquerNote: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
});