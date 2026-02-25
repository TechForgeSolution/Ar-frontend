import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';
import { AuthStackParamList } from '../../types';
import { theme } from '../../config/theme';
import Button from '../../components/common/Button';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
};

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    const loadAndPlaySound = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        const soundObject = require('../../../assets/car_engine.mp3');
        
        const { sound: loadedSound } = await Audio.Sound.createAsync(
          soundObject,
          {
            shouldPlay: true,
            isLooping: true,
            volume: 0.5,
          }
        );

        if (isMounted) {
          setSound(loadedSound);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du son:', error);
      }
    };

    loadAndPlaySound();

    return () => {
      isMounted = false;
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (sound) {
        sound.stopAsync();
      }
    });

    const focusUnsubscribe = navigation.addListener('focus', () => {
      if (sound) {
        sound.playAsync();
      }
    });

    return () => {
      unsubscribe();
      focusUnsubscribe();
    };
  }, [navigation, sound]);

  // Animation de défilement
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scrollX, {
          toValue: -300,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(scrollX, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoSection}>
  <View style={styles.logoContainer}>
    <Ionicons name="car-sport" size={80} color={theme.colors.textInverse} />
  </View>
  <Text style={styles.title}>Auto École</Text>
  <Text style={styles.subtitle}>Ange Raphael</Text>
  <Text style={[styles.subtitle, styles.agrement]}>
    Agrément N° 0266/D/MINT/G/DTR/SDPSR/SFCAM
  </Text>
</View>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: theme.colors.success + '20' }]}>
              <Ionicons name="book-outline" size={24} color={theme.colors.success} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Cours Interactifs</Text>
              <Text style={styles.featureDescription}>Théorie et pratique en ligne</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: theme.colors.info + '20' }]}>
              <Ionicons name="people-outline" size={24} color={theme.colors.info} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Système de Parrainage</Text>
              <Text style={styles.featureDescription}>Obtenez votre permis gratuitement</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: theme.colors.secondary + '20' }]}>
              <Ionicons name="trophy-outline" size={24} color={theme.colors.secondary} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Permis A & B</Text>
              <Text style={styles.featureDescription}>Moto et Voiture</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Connexion"
          onPress={() => navigation.navigate('Login')}
          fullWidth
          size="large"
        />
        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerText}>
            Pas de compte ? <Text style={styles.registerTextBold}>S'inscrire</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer défilant avec effet marquee */}
      <TouchableOpacity 
        style={styles.footerContainer}
        onPress={() => {
          const url = 'https://techforgesolution237.site';
          Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
        }}
        activeOpacity={0.7}
      >
        <View style={styles.marqueeContainer}>
          <Animated.View 
            style={[
              styles.marqueeContent,
              {
                transform: [{ translateX: scrollX }]
              }
            ]}
          >
            <View style={styles.marqueeItem}>
              <Ionicons name="code-slash" size={16} color={theme.colors.primary} />
              <Text style={styles.footerText}>
                Powered by <Text style={styles.footerLink}>TechForgeSolution237</Text>
              </Text>
            </View>
            <View style={styles.marqueeItem}>
              <Ionicons name="code-slash" size={16} color={theme.colors.primary} />
              <Text style={styles.footerText}>
                Powered by <Text style={styles.footerLink}>TechForgeSolution237</Text>
              </Text>
            </View>
            <View style={styles.marqueeItem}>
              <Ionicons name="code-slash" size={16} color={theme.colors.primary} />
              <Text style={styles.footerText}>
                Powered by <Text style={styles.footerLink}>TechForgeSolution237</Text>
              </Text>
            </View>
          </Animated.View>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  agrement: {
  color: '#000000',           // Noir
  fontSize: 11,               // Taille réduite pour tenir sur une ligne
  fontWeight: '600',          // Semi-bold pour la lisibilité
  textAlign: 'center',        // Centré
  paddingHorizontal: 16,      // Marges latérales pour bien cadrer
  letterSpacing: 0.3,         // Légère espacement des lettres
  lineHeight: 18,             // Hauteur de ligne confortable
},
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginTop: theme.spacing.md,
  },
  subtitle: {
    ...theme.typography.h4,
    color: theme.colors.secondary,
  },
  features: {
    marginTop: theme.spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  featureTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  featureDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  footer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.lg,
  },
  footerContainer: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.primary + '20',
    overflow: 'hidden',
  },
  marqueeContainer: {
    height: 50,
    overflow: 'hidden',
  },
  marqueeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
  },
  marqueeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  footerText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  footerLink: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  registerLink: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  registerText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  registerTextBold: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default WelcomeScreen;