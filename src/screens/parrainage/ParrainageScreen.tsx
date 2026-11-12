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
import { SafeAreaView } from 'react-native-safe-area-context';

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

const HOW_IT_WORKS_ICONS = ['🔗', '👤', '💸'];

const buildReferralMessage = (code: string) =>
  `😊 Inscris-toi à l’Auto-École Ange Raphaël avec mon code de parrainage : ${code} 🚗\n\n` +
  `🚘 Apprends à conduire et obtiens ton permis A ou B ! 🥳\n\n` +
  `📲 Inscris-toi ici : https://ange-raphael.tfs237.com/ref/${code}`;

const ParrainageScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { token } = useAuth();

  const [info, setInfo] = useState<ParrainageInfo | null>(null);
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
        setInfo(infoRes);
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
    if (!info?.code_parrainage) return;
    const message = buildReferralMessage(info.code_parrainage);
    try {
      await Share.share({ message });
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
      <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a4fd6" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── HERO BANNER ── */}
        <View style={styles.heroBanner}>
          {/* decorative circles */}
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />

          <View style={styles.heroGiftIcon}>
            <Text style={styles.heroGiftEmoji}>🎁</Text>
          </View>

          <Text style={styles.heroTitle}>Invitez vos amis,{'\n'}Gagnez des récompenses</Text>
          <Text style={styles.heroSubtitle}>
            Gagnez {info.prime_disponible.toLocaleString('fr-FR')} FCFA pour chaque filleul qui
            effectue un dépôt.
          </Text>

          {/* Solde pill */}
          <View style={styles.soldePill}>
            <Text style={styles.soldePillLabel}>Votre solde  </Text>
            <Text style={styles.soldePillAmount}>
              {info.solde.toLocaleString('fr-FR')} FCFA
            </Text>
          </View>
        </View>

        <View style={styles.body}>

          {/* ── PROGRESSION ── */}
          <View style={styles.section}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>PROGRESSION RÉCOMPENSE</Text>
              <Text style={styles.progressCount}>
                <Text style={styles.progressHighlight}>{info.filleuls_avec_depot}/3 </Text>
                filleuls
              </Text>
            </View>

            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>

            {primeDebloquee ? (
              <Text style={styles.progressHint}>
                🎉 Prime de{' '}
                <Text style={styles.progressBold}>
                  {info.prime_disponible.toLocaleString('fr-FR')} FCFA
                </Text>{' '}
                débloquée ! Rendez-vous au CFPAM.
              </Text>
            ) : (
              <Text style={styles.progressHint}>
                Invitez encore{' '}
                <Text style={styles.progressBold}>
                  {info.filleuls_restants} filleul{info.filleuls_restants > 1 ? 's' : ''}
                </Text>{' '}
                pour débloquer la prime de{' '}
                <Text style={styles.progressBold}>
                  {info.prime_disponible.toLocaleString('fr-FR')} FCFA
                </Text>
              </Text>
            )}
          </View>

          {/* ── CODE DE PARRAINAGE ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Votre code de parrainage</Text>
            <View style={styles.codeDashedBox}>
              <View style={styles.codeRow}>
                <Text style={styles.codeText}>{info.code_parrainage}</Text>
                <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode}>
                  <Text style={styles.copyBtnText}>📋  COPIER</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── MESSAGE DE PARTAGE ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Message de partage</Text>
            <View style={styles.codeDashedBox}>
              <Text style={styles.shareMessageText}>
                {buildReferralMessage(info.code_parrainage)}
              </Text>
            </View>
          </View>

          {/* ── COMMENT ÇA MARCHE ── */}
          <View style={styles.section}>
            <Text style={styles.howTitle}>Comment ça marche</Text>
            <Text style={styles.howIntro}>{info.explication_systeme.intro}</Text>

            {info.explication_systeme.regles.map((regle, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepIconWrap}>
                  <Text style={styles.stepEmoji}>{HOW_IT_WORKS_ICONS[i] ?? '✅'}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepCondition}>{regle.condition}</Text>
                  <Text style={styles.stepAvantage}>{regle.avantage}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ── CTA BUTTONS ── */}
          <TouchableOpacity style={styles.inviteBtn} onPress={handleShare}>
            <Text style={styles.inviteBtnText}>📤  Inviter mes amis maintenant</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filleulsBtn}
            onPress={() => navigation.navigate('Filleuls')}
          >
            <Text style={styles.filleulsBtnText}>👥  Voir mes filleuls</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
      </SafeAreaView>
      </>
  );
};
/* ─────────────────────── STYLES ─────────────────────── */
const BLUE = '#2563eb';
const BLUE_DARK = '#1a4fd6';
const BLUE_LIGHT = '#dbeafe';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  loadingText: { fontSize: 16, color: '#64748b' },
  errorText: { fontSize: 16, color: '#ef4444', textAlign: 'center', paddingHorizontal: 24 },

  /* ── HERO ── */
  heroBanner: {
    backgroundColor: BLUE,
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  heroCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60,
    right: -50,
  },
  heroCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -40,
    left: -30,
  },
  heroGiftIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'flex-end',
  },
  heroGiftEmoji: { fontSize: 26 },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 36,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#bfdbfe',
    lineHeight: 20,
    marginBottom: 20,
  },
  soldePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  soldePillLabel: { fontSize: 13, color: '#bfdbfe', fontWeight: '500' },
  soldePillAmount: { fontSize: 15, color: '#ffffff', fontWeight: '800' },

  /* ── BODY ── */
  body: {
    marginTop: -16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingTop: 24,
  },

  /* ── SECTIONS ── */
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },

  /* ── PROGRESSION ── */
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  progressCount: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  progressHighlight: {
    color: BLUE,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: BLUE,
    borderRadius: 5,
  },
  progressHint: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
  },
  progressBold: {
    fontWeight: '700',
    color: '#1e293b',
  },

  /* ── CODE ── */
  codeDashedBox: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#bfdbfe',
    borderStyle: 'dashed',
    backgroundColor: '#f8faff',
    padding: 14,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeText: {
    fontSize: 22,
    fontWeight: '900',
    color: BLUE_DARK,
    letterSpacing: 3,
    flex: 1,
  },
  copyBtn: {
    backgroundColor: BLUE,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  copyBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  /* ── HOW IT WORKS ── */
  howTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 6,
  },
  howIntro: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 18,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  stepIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: BLUE_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  stepEmoji: { fontSize: 20 },
  stepContent: { flex: 1 },
  stepCondition: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 3,
  },
  stepAvantage: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 19,
  },

  /* ── CTA BUTTONS ── */
  inviteBtn: {
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  inviteBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  filleulsBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BLUE,
    marginBottom: 8,
  },
  filleulsBtnText: {
    color: BLUE,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ParrainageScreen;