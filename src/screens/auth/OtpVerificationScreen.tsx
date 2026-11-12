import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'OtpVerification'>;
  route: RouteProp<AuthStackParamList, 'OtpVerification'>;
};

const C = {
  primary: '#2563EB', bg: '#F5F6FA', white: '#FFFFFF',
  textPrimary: '#111827', textMuted: '#6B7280', textLight: '#9CA3AF',
  border: '#E5E7EB', error: '#EF4444', success: '#16A34A',
};

const OtpVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const params = route.params;
  const email = params.mode === 'email_verification' ? params.email : undefined;
  const telephone = params.mode === 'telephone_registration' || params.mode === 'telephone_recovery'
    ? params.telephone
    : undefined;
  const mode = params.mode;
  const {
    verifierOtpEmail,
    envoyerOtpEmail,
    verifierOtpTelephone,
    envoyerOtpTelephone,
    reinitialiserMotDePasseTelephone,
    register,
  } = useAuth();

  const [code,           setCode]           = useState(['', '', '', '', '', '']);
  const [loading,        setLoading]        = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending,      setResending]      = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const inputs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    setTimeout(() => inputs.current[0]?.focus(), 300);
  }, []);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    if (text && index < 5) inputs.current[index + 1]?.focus();
    if (!text && index > 0) inputs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;
    setLoading(true);
    try {
      if (mode === 'email_verification' && email) {
        await verifierOtpEmail(email, fullCode);
      } else if (telephone && (mode === 'telephone_registration' || mode === 'telephone_recovery')) {
        const token = await verifierOtpTelephone(
          telephone,
          mode === 'telephone_registration' ? 'inscription' : 'recuperation',
          fullCode
        );
        if (token) {
          if ('registrationData' in params) {
            await register({ ...params.registrationData, otp_token: token });
          } else if (params.mode === 'telephone_recovery') {
            setVerificationToken(token);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    let sent = false;
    if (mode === 'email_verification' && email) {
      sent = await envoyerOtpEmail(email);
    } else if (telephone && (mode === 'telephone_registration' || mode === 'telephone_recovery')) {
      sent = await envoyerOtpTelephone(
        telephone,
        mode === 'telephone_registration' ? 'inscription' : 'recuperation'
      );
    }
    if (sent) {
      setResendCooldown(60);
      setCode(['', '', '', '', '', '']);
      setTimeout(() => inputs.current[0]?.focus(), 100);
    }
    setResending(false);
  };

  const handleResetPassword = async () => {
    if (!telephone || !verificationToken) return;
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Mot de passe trop court', text2: 'Utilisez au moins 6 caractères.' });
      return;
    }
    if (password !== passwordConfirmation) {
      Toast.show({ type: 'error', text1: 'Confirmation incorrecte', text2: 'Les mots de passe ne correspondent pas.' });
      return;
    }

    setLoading(true);
    const reset = await reinitialiserMotDePasseTelephone(
      telephone,
      verificationToken,
      password,
      passwordConfirmation
    );
    setLoading(false);
    if (reset) navigation.navigate('Login');
  };

  const codeComplete = code.join('').length === 6;

  // Affichage masqué de l'email : j***@gmail.com
  const maskedEmail = email
    ? email.replace(/(.{1}).+(@.+)/, '$1***$2')
    : '';
  const maskedTelephone = telephone
    ? `${telephone.slice(0, 2)} ••• ••• ${telephone.slice(-3)}`
    : '';
  const isRecovery = mode === 'telephone_recovery';
  const codeVerified = isRecovery && !!verificationToken;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <View style={s.scroll}>

          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} disabled={loading}>
            <Ionicons name="chevron-back" size={18} color={C.textPrimary} />
          </TouchableOpacity>

          <View style={s.hero}>
            <View style={s.appIcon}>
              <Ionicons name={telephone ? 'logo-whatsapp' : 'mail-outline'} size={34} color="#fff" />
            </View>
            <Text style={s.heroTitle}>{codeVerified ? 'Choisissez un nouveau mot de passe' : 'Vérification'}</Text>
            <Text style={s.heroSub}>
              {telephone
                ? (mode === 'telephone_registration'
                  ? 'Un code a été envoyé sur WhatsApp à'
                  : 'Un code de récupération a été envoyé sur WhatsApp à')
                : 'Code envoyé par e-mail à'}
              {'\n'}
              <Text style={s.highlight}>{telephone ? maskedTelephone : maskedEmail}</Text>
            </Text>
            <View style={s.infoPill}>
              <Ionicons name="time-outline" size={14} color={C.textMuted} />
              <Text style={s.infoPillText}>Le code expire dans {telephone ? '5' : '10'} minutes</Text>
            </View>
          </View>

          {!codeVerified ? (
            <>
              <View style={s.codeRow}>
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={ref => { if (ref) inputs.current[index] = ref; }}
                    style={[s.codeBox, digit ? s.codeBoxFilled : null, index === code.findIndex(d => d === '') && s.codeBoxActive]}
                    value={digit}
                    onChangeText={t => handleCodeChange(t.slice(-1), index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    selectTextOnFocus
                    editable={!loading}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[s.btnPrimary, (!codeComplete || loading) && s.btnDisabled]}
                onPress={handleVerify}
                disabled={!codeComplete || loading}
                activeOpacity={0.85}
              >
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <View style={s.btnInner}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text style={s.btnPrimaryText}>
                      {mode === 'telephone_registration' ? 'Vérifier et créer mon compte' : 'Vérifier le code'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={s.resendRow}>
                <Text style={s.resendLabel}>Vous n'avez pas reçu le code ? </Text>
                <TouchableOpacity onPress={handleResend} disabled={resendCooldown > 0 || resending}>
                  {resendCooldown > 0 ? (
                    <View style={s.cooldownPill}>
                      <Ionicons name="time-outline" size={13} color={C.textLight} />
                      <Text style={s.cooldownText}>{resendCooldown}s</Text>
                    </View>
                  ) : (
                    <Text style={[s.resendLink, resending && { opacity: 0.5 }]}>Renvoyer</Text>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={s.changeRow} onPress={() => navigation.goBack()} disabled={loading}>
                <Text style={s.changeText}>{telephone ? 'Changer de numéro WhatsApp' : "Changer d'adresse e-mail"}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={s.passwordForm}>
              <TextInput
                style={s.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Nouveau mot de passe (6 caractères min.)"
                placeholderTextColor={C.textLight}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />
              <TextInput
                style={s.passwordInput}
                value={passwordConfirmation}
                onChangeText={setPasswordConfirmation}
                placeholder="Confirmer le nouveau mot de passe"
                placeholderTextColor={C.textLight}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={[s.btnPrimary, loading && s.btnDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <Text style={s.btnPrimaryText}>Enregistrer le nouveau mot de passe</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  scroll: { flex: 1, padding: 24 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.white, borderWidth: 0.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  hero: { alignItems: 'center', marginBottom: 40 },
  appIcon: { width: 72, height: 72, borderRadius: 20, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: C.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 16, elevation: 8 },
  heroTitle: { fontSize: 26, fontWeight: '700', color: C.textPrimary, letterSpacing: -0.5, marginBottom: 8 },
  heroSub: { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 12 },
  highlight: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
  infoPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  infoPillText: { fontSize: 12, color: C.textMuted },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, gap: 8 },
  codeBox: { flex: 1, height: 58, backgroundColor: C.white, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, fontSize: 22, fontWeight: '700', color: C.textPrimary, textAlign: 'center' },
  codeBoxFilled: { borderColor: C.primary, backgroundColor: '#EFF6FF' },
  codeBoxActive: { borderColor: C.primary, shadowColor: C.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 2 },
  btnPrimary: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 24, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 10, elevation: 5 },
  btnDisabled: { opacity: 0.45 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnPrimaryText: { fontSize: 16, fontWeight: '600', color: '#fff', letterSpacing: 0.2 },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 16 },
  resendLabel: { fontSize: 13, color: C.textMuted },
  resendLink: { fontSize: 13, color: C.primary, fontWeight: '600' },
  cooldownPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.border, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  cooldownText: { fontSize: 12, color: C.textLight, fontWeight: '500' },
  changeRow: { alignItems: 'center', marginTop: 4 },
  changeText: { fontSize: 13, color: C.textLight, textDecorationLine: 'underline' },
  passwordForm: { gap: 12 },
  passwordInput: { height: 54, backgroundColor: C.white, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, fontSize: 15, color: C.textPrimary },
});

export default OtpVerificationScreen;