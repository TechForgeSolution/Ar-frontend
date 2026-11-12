import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
};

const C = {
  primary: '#2563EB',
  whatsapp: '#25D366',
  bg: '#F5F6FA',
  white: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
};

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { envoyerOtpTelephone } = useAuth();
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    const phone = telephone.replace(/\D/g, '');
    const localPhone = phone.startsWith('237') && phone.length === 12 ? phone.slice(3) : phone;
    if (localPhone.length !== 9) return;

    setLoading(true);
    const sent = await envoyerOtpTelephone(localPhone, 'recuperation');
    if (sent) {
      navigation.navigate('OtpVerification', {
        mode: 'telephone_recovery',
        telephone: localPhone,
      });
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <View style={s.inner}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} disabled={loading}>
            <Ionicons name="chevron-back" size={18} color={C.text} />
          </TouchableOpacity>

          <View style={s.content}>
            <View style={s.iconWrap}>
              <Ionicons name="lock-open-outline" size={34} color="#fff" />
              <View style={s.waBadge}>
                <Ionicons name="logo-whatsapp" size={14} color="#fff" />
              </View>
            </View>

            <Text style={s.title}>Mot de passe oublié ?</Text>
            <Text style={s.description}>
              Entrez le numéro WhatsApp associé à votre compte. Nous vous enverrons un code pour vérifier votre identité et choisir un nouveau mot de passe.
            </Text>

            <View style={s.inputGroup}>
              <Text style={s.label}>Numéro WhatsApp</Text>
              <View style={s.inputBox}>
                <Ionicons name="call-outline" size={18} color={C.muted} />
                <TextInput
                  style={s.input}
                  value={telephone}
                  onChangeText={value => setTelephone(value.replace(/[^\d+]/g, ''))}
                  placeholder="6 XX XX XX XX"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={13}
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
              <Text style={s.hint}>Utilisez le numéro enregistré sur votre compte.</Text>
            </View>

            <TouchableOpacity
              style={[s.primaryButton, loading && s.disabled]}
              onPress={handleSendCode}
              disabled={loading || telephone.replace(/\D/g, '').length < 9}
              activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <View style={s.buttonContent}>
                  <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                  <Text style={s.primaryButtonText}>Recevoir un code WhatsApp</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={s.outlineButton} onPress={() => navigation.navigate('Login')}>
              <Text style={s.outlineText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  inner: { flex: 1, padding: 24 },
  backBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: C.white,
    borderWidth: 0.5, borderColor: C.border, alignItems: 'center',
    justifyContent: 'center', marginBottom: 24,
  },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 24 },
  iconWrap: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  waBadge: {
    position: 'absolute', bottom: -4, right: -4, width: 25, height: 25,
    borderRadius: 13, backgroundColor: C.whatsapp, borderWidth: 2,
    borderColor: C.bg, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 10, textAlign: 'center' },
  description: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  inputGroup: { width: '100%', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 8 },
  inputBox: {
    minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, paddingHorizontal: 14,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: C.text },
  hint: { fontSize: 12, color: C.muted, marginTop: 7 },
  primaryButton: {
    width: '100%', backgroundColor: C.whatsapp, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 12,
  },
  disabled: { opacity: 0.6 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  outlineButton: {
    width: '100%', backgroundColor: C.white, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', borderWidth: 1.5, borderColor: C.border,
  },
  outlineText: { fontSize: 15, fontWeight: '500', color: C.muted },
});

export default ForgotPasswordScreen;
