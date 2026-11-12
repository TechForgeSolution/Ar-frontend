// screens/cni/CniInscriptionScreen.tsx

import React from 'react';
import {
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const PRIMARY_BLUE = '#2563EB';
const WHATSAPP_GREEN = '#25D366';

const WHATSAPP_NUMBER = '237659292001';   // sans le +
const FULL_PHONE = '+237659292001';

const CniInscriptionScreen: React.FC = () => {
  const handleOpenWhatsApp = async () => {
    const message = encodeURIComponent(
      'Bonjour 👋, j’ai soumis mes pièces CNI et je souhaite finaliser mon inscription à l’examen au centre CFPAM. Merci !'
    );

    // Méthode simple et fiable (comme dans ton DashboardScreen)
    const deepLink = `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${message}`;

    try {
      const supported = await Linking.canOpenURL(deepLink);

      if (supported) {
        await Linking.openURL(deepLink);
        return;
      }
    } catch (e) {
      // Si le deep link échoue, on passe directement au wa.me
      console.log('Deep link non supporté, utilisation de wa.me');
    }

    // Fallback universel (fonctionne très bien pour WhatsApp + WhatsApp Business)
    const waMeUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

    try {
      await Linking.openURL(waMeUrl);
    } catch (error) {
      Alert.alert(
        'WhatsApp non disponible',
        'Veuillez installer WhatsApp ou WhatsApp Business.\n\nVous pouvez aussi contacter ce numéro manuellement :\n+237 6 59 29 20 01'
      );
    }
  };

  // Icône officielle WhatsApp (identique à ton Dashboard)
  const WhatsAppIcon = ({ size = 42 }: { size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="#ffffff">
      <Path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </Svg>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Text style={styles.headerIcon}>F</Text>
          </View>
          <Text style={styles.title}>Finaliser votre inscription</Text>
          <Text style={styles.subtitle}>
            Votre demande est presque terminée !{' '}
            <Text style={{ color: PRIMARY_BLUE }}>Une dernière étape</Text>
          </Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.iconRow}>
            <Text style={styles.stepIcon}>📍</Text>
            <Text style={styles.stepText}>
              Rendez-vous au <Text style={{ fontWeight: '700' }}>Centre CFPAM</Text>
            </Text>
          </View>

          <Text style={styles.description}>
            Pour finaliser officiellement votre inscription à l’examen, vous devez vous présenter
            physiquement au sein du centre du CFPAM.
          </Text>

          <View style={styles.divider} />

          <View style={styles.iconRow}>
            <Text style={styles.stepIcon}>💬</Text>
            <Text style={styles.stepText}>
              Contactez-nous via <Text style={{ fontWeight: '700', color: WHATSAPP_GREEN }}>WhatsApp</Text>
            </Text>
          </View>

          <Text style={styles.description}>
            Cliquez sur le bouton ci-dessous pour prendre rendez-vous et compléter votre dossier en
            quelques minutes.
          </Text>
        </View>

        {/* Bouton WhatsApp corrigé */}
        <Pressable
          style={styles.whatsappButton}
          onPress={handleOpenWhatsApp}
          android_ripple={{ color: '#ffffff30', radius: 300 }}
        >
          <View style={styles.whatsappContent}>
            <View style={styles.whatsappIconContainer}>
              <View style={styles.whatsappLogo}>
                <WhatsAppIcon size={42} />
              </View>
            </View>

            <View style={styles.whatsappTextContainer}>
              <Text style={styles.whatsappMainText}>Ouvrir WhatsApp</Text>
              <Text style={styles.whatsappNumber}>+237 6 59 29 20 01</Text>
            </View>
          </View>
        </Pressable>

        {/* Note de confiance */}
        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            🔒 Votre inscription sera validée sur place après vérification des pièces.
          </Text>
          <Text style={styles.footerSub}>
            Nous vous attendons au CFPAM ! 
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles (inchangés sauf légère optimisation)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: { flex: 1 },
  content: {
    padding: 24,
    paddingBottom: 40,
  },

  header: { alignItems: 'center', marginBottom: 32 },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: `${PRIMARY_BLUE}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  headerIcon: { fontSize: 40 },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepIcon: { fontSize: 26, marginRight: 12 },
  stepText: { fontSize: 18, color: '#0F172A' },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },

  whatsappButton: {
    backgroundColor: WHATSAPP_GREEN,
    borderRadius: 999,
    paddingVertical: 18,
    paddingHorizontal: 24,
    shadowColor: WHATSAPP_GREEN,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 24,
  },
  whatsappContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappIconContainer: {
    width: 52,
    height: 52,
    backgroundColor: '#fff',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  whatsappLogo: {
    width: 46,
    height: 46,
    backgroundColor: WHATSAPP_GREEN,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappTextContainer: { alignItems: 'flex-start' },
  whatsappMainText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  whatsappNumber: {
    color: '#ffffffdd',
    fontSize: 15.5,
    fontWeight: '600',
  },

  footerNote: { alignItems: 'center' },
  footerText: {
    fontSize: 14,
    color: PRIMARY_BLUE,
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default CniInscriptionScreen;