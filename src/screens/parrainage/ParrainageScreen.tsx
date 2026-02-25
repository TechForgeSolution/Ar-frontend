import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  StyleSheet,
  StatusBar,
  Clipboard,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../config/api';
import { MainStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'Parrainage'>;

interface ParrainageInfo {
  code_parrainage: string;
  solde: number;
  nombre_filleuls: number;
  filleuls_avec_depot: number;
  filleuls_restants: number;
  prime_disponible: number;
  explication_systeme: {
    intro: string;
    regles: { condition: string; avantage: string }[];
    retrait: string;
    important: string[];
  };
}

const ParrainageScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { token } = useAuth();

  const [info, setInfo] = useState<ParrainageInfo | null>(null);
  const [shareMessage, setShareMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const infoRes = await apiRequest<ParrainageInfo>(
          '/parrainage',
          { method: 'GET' },
          token
        );
        const msgRes = await apiRequest<{ message: string }>(
          '/parrainage/message',
          { method: 'GET' },
          token
        );
        setInfo(infoRes);
        setShareMessage(msgRes.message);
      } catch (e: any) {
        setError(e.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [token]);

  const handleCopyCode = () => {
    if (info?.code_parrainage) {
      Clipboard.setString(info.code_parrainage);
      Alert.alert('✅ Copié !', 'Code de parrainage copié dans le presse-papiers');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: shareMessage });
    } catch (e) {
      console.log('Erreur partage:', e);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
      </View>
    );
  }

  if (!info) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Aucune information disponible</Text>
      </View>
    );
  }

  const progressPercent = Math.min((info.filleuls_avec_depot / 3) * 100, 100);
  const primeDebloquee = info.filleuls_avec_depot >= 3;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* Solde */}
          <View style={styles.soldeCard}>
            <Text style={styles.soldeLabel}>Votre solde</Text>
            <Text style={styles.soldeAmount}>{info.solde.toLocaleString('fr-FR')} FCFA</Text>
            <Text style={styles.soldeHint}>💳 Retrait en présentiel au CFPAM</Text>
          </View>

          {/* Progression */}
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>🎯 Progression vers la prime</Text>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressCount}>
                {info.filleuls_avec_depot} / 3 filleuls avec dépôt
              </Text>
              {!primeDebloquee && (
                <Text style={styles.progressRemaining}>
                  encore {info.filleuls_restants} filleul{info.filleuls_restants > 1 ? 's' : ''}
                </Text>
              )}
            </View>

            {primeDebloquee ? (
              <View style={styles.primeUnlocked}>
                <Text style={styles.primeUnlockedText}>
                  🎉 Prime de {info.prime_disponible.toLocaleString('fr-FR')} FCFA débloquée !
                </Text>
                <Text style={styles.primeUnlockedSub}>
                  Rendez-vous au CFPAM pour effectuer votre retrait.
                </Text>
              </View>
            ) : (
              <View style={styles.primePending}>
                <Text style={styles.primePendingText}>
                  💰 Gagnez {info.prime_disponible.toLocaleString('fr-FR')} FCFA dès que vos 3 filleuls ont fait un dépôt
                </Text>
              </View>
            )}
          </View>

          {/* Code de parrainage */}
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Votre code de parrainage</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{info.code_parrainage}</Text>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
                <Text style={styles.copyButtonText}>📋 Copier</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Text style={styles.shareButtonText}>📤 Partager</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Comment ça marche */}
          <View style={styles.howItWorksCard}>
            <Text style={styles.sectionTitle}>📚 Comment ça marche ?</Text>
            <Text style={styles.introText}>{info.explication_systeme.intro}</Text>

            {info.explication_systeme.regles.map((regle, i) => (
              <View key={i} style={styles.regleCard}>
                <View style={styles.regleRow}>
                  <Text style={styles.regleIcon}>✅</Text>
                  <View style={styles.regleContent}>
                    <Text style={styles.regleCondition}>{regle.condition}</Text>
                    <Text style={styles.regleAvantage}>→ {regle.avantage}</Text>
                  </View>
                </View>
              </View>
            ))}

            

          </View>

          {/* Boutons d'action */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Filleuls')}
            >
              <Text style={styles.secondaryButtonText}>👥 Voir mes filleuls</Text>
            </TouchableOpacity>

            
          </View>

        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  content: {
    padding: 16,
  },

  /* Solde */
  soldeCard: {
    backgroundColor: '#1e3a8a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  soldeLabel: {
    fontSize: 14,
    color: '#bfdbfe',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  soldeAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 10,
  },
  soldeHint: {
    fontSize: 13,
    color: '#93c5fd',
  },

  /* Progression */
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  progressTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 14,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  progressCount: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  progressRemaining: {
    fontSize: 13,
    color: '#94a3b8',
  },
  primeUnlocked: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#86efac',
  },
  primeUnlockedText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#15803d',
    marginBottom: 4,
  },
  primeUnlockedSub: {
    fontSize: 13,
    color: '#166534',
  },
  primePending: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
  },
  primePendingText: {
    fontSize: 14,
    color: '#1d4ed8',
    fontWeight: '600',
    lineHeight: 20,
  },

  /* Code */
  codeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  codeLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  codeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e3a8a',
    letterSpacing: 3,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  copyButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },

  /* Comment ça marche */
  howItWorksCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
  },
  introText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 16,
  },
  regleCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  regleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  regleIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  regleContent: {
    flex: 1,
  },
  regleCondition: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803d',
    marginBottom: 4,
  },
  regleAvantage: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
    fontWeight: '600',
  },
  retraitBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    marginTop: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  retraitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d4ed8',
    marginBottom: 4,
  },
  retraitText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  importantBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  importantTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 10,
  },
  importantItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  importantBullet: {
    fontSize: 16,
    color: '#dc2626',
    marginRight: 8,
    fontWeight: '700',
  },
  importantText: {
    flex: 1,
    fontSize: 13,
    color: '#7f1d1d',
    lineHeight: 20,
  },

  /* Actions */
  actionsContainer: {
    marginBottom: 24,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ParrainageScreen;