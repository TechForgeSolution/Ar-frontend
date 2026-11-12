import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Image,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { theme } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { Audio } from 'expo-av';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = SCREEN_W * 1.05;
const ICON_CIRCLE = 64;
const CARD_BORDER_RADIUS = 28;

const playTapSound = () => {
  try {
    const AudioContext =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch (_) {}
};

const SoundButton: React.FC<React.ComponentProps<typeof TouchableOpacity>> = ({
  onPress, children, ...props
}) => {
  const handlePress = useCallback((e: any) => { playTapSound(); onPress?.(e); }, [onPress]);
  return <TouchableOpacity onPress={handlePress} {...props}>{children}</TouchableOpacity>;
};

const IconCar = () => (
  <Svg width={34} height={34} viewBox="0 0 24 24" fill="#1A56DB">
    <Path d="M5 11l1.5-4.5h11L19 11M3 11h18v7H3v-7zM7 15a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zm7 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0z" />
    <Path d="M5 18v1.5a.5.5 0 0 0 .5.5H7a.5.5 0 0 0 .5-.5V18M16.5 18v1.5a.5.5 0 0 0 .5.5h1.5a.5.5 0 0 0 .5-.5V18" />
  </Svg>
);

const IconShieldCheck = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L4 5v6c0 5.25 3.5 10.15 8 11.35C16.5 21.15 20 16.25 20 11V5L12 2z"
      stroke="#1A56DB" strokeWidth={2} strokeLinejoin="round" fill="none"
    />
    <Path
      d="M9 12l2 2 4-4"
      stroke="#1A56DB" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const IconLogin = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"
      stroke="#fff" strokeWidth={2} strokeLinecap="round"
    />
    <Path
      d="M10 17l5-5-5-5M15 12H3"
      stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const IconUserPlus = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
      stroke="#374151" strokeWidth={2} strokeLinecap="round"
    />
    <Circle cx={9} cy={7} r={4} stroke="#374151" strokeWidth={2} />
    <Path d="M19 8v6M16 11h6" stroke="#374151" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const IconClock = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke="#9CA3AF" strokeWidth={1.8} />
    <Path d="M12 7v5l3 3" stroke="#9CA3AF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconMedal = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={14} r={6} stroke="#9CA3AF" strokeWidth={1.8} />
    <Path d="M9 2h6l-1 6H10L9 2z" stroke="#9CA3AF" strokeWidth={1.8} strokeLinejoin="round" />
    <Path d="M12 11v3l1.5 1.5" stroke="#9CA3AF" strokeWidth={1.6} strokeLinecap="round" />
  </Svg>
);

const IconMapPin = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C8.686 2 6 4.686 6 8c0 5 6 13 6 13s6-8 6-13c0-3.314-2.686-6-6-6z"
      stroke="#9CA3AF" strokeWidth={1.8}
    />
    <Circle cx={12} cy={8} r={2} stroke="#9CA3AF" strokeWidth={1.8} />
  </Svg>
);

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
};

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const { loginGoogle, loginApple, loginBiometrie, biometrieDisponible, biometrieActivee } = useAuth();

  const [loadingGoogle,     setLoadingGoogle]    = useState(false);
  const [loadingApple,      setLoadingApple]     = useState(false);
  const [loadingBiometrie,  setLoadingBiometrie] = useState(false);

  // ─── Ref sur le Sound pour pouvoir le stopper au démontage ───
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let isMounted = true;

    const startEngineSound = async () => {
      try {
        // Configure le mode audio : lecture en arrière-plan, mixé avec d'autres sons
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,       // joue même en mode silencieux iOS
          staysActiveInBackground: false,   // s'arrête si l'app passe en background
          shouldDuckAndroid: true,          // baisse les autres sons sur Android
        });

        const { sound } = await Audio.Sound.createAsync(
          require('../../../assets/car_engine.mp3'),
          {
            isLooping: true,       // ← boucle infinie
            volume: 0.35,          // discret, ne couvre pas l'UI
            shouldPlay: true,      // démarre immédiatement
          }
        );

        if (isMounted) {
          soundRef.current = sound;
        } else {
          // Le composant a déjà été démonté avant la fin du chargement
          await sound.unloadAsync();
        }
      } catch (e) {
        // Fichier manquant ou erreur audio → on ignore silencieusement
        console.warn('Engine sound error:', e);
      }
    };

    startEngineSound();

    // ─── Cleanup : stoppe et libère le son quand on quitte l'écran ───
    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.stopAsync().finally(() => {
          soundRef.current?.unloadAsync();
          soundRef.current = null;
        });
      }
    };
  }, []);

  const handleGoogle    = async () => { setLoadingGoogle(true);    await loginGoogle();    setLoadingGoogle(false);    };
  const handleApple     = async () => { setLoadingApple(true);     await loginApple();     setLoadingApple(false);     };
  const handleBiometrie = async () => { setLoadingBiometrie(true); await loginBiometrie(); setLoadingBiometrie(false); };

  return (
    <View style={styles.root}>

      {/* ── HERO ── */}
      <View style={styles.heroWrapper}>
        <Image
          source={require('../../../assets/welcome_car.png')}
          style={styles.heroBg}
          resizeMode="cover"
          blurRadius={1.5}
        />
        <View style={styles.heroOverlay} />

        {/* Icône voiture centrée verticalement dans le hero */}
        <View style={styles.carIconWrapper}>
          <View style={styles.carIconCircle}>
            <IconCar />
          </View>
        </View>
      </View>

      {/* ── CARD blanche ── */}
      <SafeAreaView edges={['bottom']} style={styles.card}>

        <View style={styles.badgeRow}>
          <IconShieldCheck />
          <Text style={styles.badgeText}>AUTO ÉCOLE AGRÉÉE</Text>
        </View>

        <Text style={styles.title}>Ange Raphael</Text>
        <Text style={styles.subtitle}>
          Votre réussite au permis commence ici.{'\n'}
          Apprenez à conduire avec des experts{'\n'}
          et une pédagogie moderne.
        </Text>

       

        <SoundButton
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.88}
        >
          <View style={styles.btnRow}>
            <IconLogin />
            <Text style={styles.primaryBtnText}>Connexion</Text>
          </View>
        </SoundButton>

        <SoundButton
          style={styles.outlineBtn}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.88}
        >
          <View style={styles.btnRow}>
            <IconUserPlus />
            <Text style={styles.outlineBtnText}>S'inscrire</Text>
          </View>
        </SoundButton>

        <Text style={styles.cguText}>
          En continuant, vous acceptez nos{' '}
          <Text
            style={styles.cguLink}
            onPress={() => { playTapSound(); Linking.openURL('https://ange-raphael.supahuman.site/politique.html'); }}
          >
            conditions{'\n'}d'utilisation
          </Text>
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <IconClock />
            <Text style={styles.statLabel}>FLEXIBLE</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <IconMedal />
            <Text style={styles.statLabel}>98% SUCCÈS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <IconMapPin />
            <Text style={styles.statLabel}>PROXIMITÉ</Text>
          </View>
        </View>

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },

  heroWrapper: {
    height: HERO_H,
    overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },

  carIconWrapper: {
    position: 'absolute',
    top: HERO_H / 2 - ICON_CIRCLE / 2,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  carIconCircle: {
    width: ICON_CIRCLE,
    height: ICON_CIRCLE,
    borderRadius: ICON_CIRCLE / 2,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },

  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: CARD_BORDER_RADIUS,
    borderTopRightRadius: CARD_BORDER_RADIUS,
    marginTop: -CARD_BORDER_RADIUS,
    paddingHorizontal: 24,
    paddingTop: 28,
    alignItems: 'center',
    zIndex: 5,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#1A56DB',
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0D1B2A',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },

  biometricBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#1A56DB',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#F0F4FF',
  },
  biometricText: {
    color: '#1A56DB',
    fontWeight: '600',
    fontSize: 15,
  },

  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#1A56DB',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#1A56DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  outlineBtn: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  outlineBtnText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },

  cguText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  cguLink: {
    color: '#1A56DB',
    fontWeight: '600',
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#9CA3AF',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
});

export default WelcomeScreen;