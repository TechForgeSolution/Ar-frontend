import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

type LoginMethod = 'telephone' | 'email';

// ─── Palette ──────────────────────────────────────────────
const C = {
  primary:  '#2563EB',
  bg:       '#F5F6FA',
  white:    '#FFFFFF',
  textPrimary: '#111827',
  textMuted:   '#6B7280',
  textLight:   '#9CA3AF',
  border:      '#E5E7EB',
  prefixBg:    '#F9FAFB',
  error:       '#EF4444',
};

// ─── Champ mot de passe ───────────────────────────────────
const PasswordInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  error?: string;
  editable?: boolean;
}> = ({ value, onChange, error, editable = true }) => {
  const [focused, setFocused] = useState(false);
  const [show,    setShow]    = useState(false);
  return (
    <View>
      <View style={[s.inputWrap, focused && s.inputFocused, !!error && s.inputError]}>
        <View style={s.inputIcon}>
          <Ionicons name="lock-closed-outline" size={18} color={C.textLight} />
        </View>
        <TextInput
          style={s.input}
          placeholder="••••••••"
          placeholderTextColor={C.textLight}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <TouchableOpacity style={s.eyeBtn} onPress={() => setShow(p => !p)}>
          <Ionicons
            name={show ? 'eye-outline' : 'eye-off-outline'}
            size={18}
            color={C.textLight}
          />
        </TouchableOpacity>
      </View>
      {!!error && <Text style={s.errorText}>{error}</Text>}
    </View>
  );
};

// ─── Écran principal ──────────────────────────────────────
const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const {
    login,
    loginGoogle,
    loginApple,
    loginBiometrie,
    biometrieDisponible,
    biometrieActivee,
  } = useAuth();

  const [method,    setMethod]    = useState<LoginMethod>('telephone');
  const [telephone, setTelephone] = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [errors,    setErrors]    = useState<Record<string, string>>({});
  const [idFocused, setIdFocused] = useState(false);

  // ── AJOUT : prompt biométrique automatique au montage ────
  /**
   * Dès que l'écran s'affiche, si la biométrie est disponible ET activée
   * par l'utilisateur, on propose le challenge sans qu'il ait à appuyer.
   * Un ref évite de relancer le prompt si le composant re-render.
   */
  const bioPromptedRef = useRef(false);

  useEffect(() => {
    if (biometrieDisponible && !bioPromptedRef.current) {
      bioPromptedRef.current = true;
      const timer = setTimeout(() => handleBiometrie(), 400);
      return () => clearTimeout(timer);
    }
  }, [biometrieDisponible]);
  // ─────────────────────────────────────────────────────────

  const switchMethod = (m: LoginMethod) => {
    if (m === method || loading) return;
    setMethod(m);
    setErrors({});
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (method === 'telephone') {
      if (!telephone.trim() || telephone.trim().length < 9)
        e.telephone = 'Numéro invalide (9 chiffres min.)';
    } else {
      if (!email.trim() || !email.includes('@'))
        e.email = 'Adresse email invalide';
    }
    if (!password.trim()) e.password = 'Le mot de passe est requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    const identifier = method === 'telephone' ? telephone.trim() : email.trim();
    const result = await login(identifier, password.trim()) as any;
    if (!result.success && result.needsOtp && result.telephone) {
      navigation.navigate('OtpVerification', {
        telephone: result.telephone,
      });
    }
    setLoading(false);
  };

  const handleGoogle    = async () => { setLoading(true); await loginGoogle();    setLoading(false); };
  const handleApple     = async () => { setLoading(true); await loginApple();     setLoading(false); };

  // ── AJOUT : handler biométrie (réutilisé par le useEffect + le bouton) ──
  const handleBiometrie = async () => {
    setLoading(true);
    await loginBiometrie();
    setLoading(false);
  };

  // ── Champ identifiant (téléphone ou email) ────────────────
  const renderIdentifierField = () => {
    const hasError = method === 'telephone' ? errors.telephone : errors.email;

    if (method === 'telephone') {
      return (
        <View>
          <View style={[s.inputWrap, idFocused && s.inputFocused, !!hasError && s.inputError]}>
            <View style={s.phonePrefix}>
              <Text style={s.phonePrefixFlag}>🇨🇲</Text>
              <Text style={s.phonePrefixCode}>+237</Text>
              <View style={s.phonePrefixDivider} />
            </View>
            <TextInput
              style={s.input}
              placeholder="696087354"
              placeholderTextColor={C.textLight}
              value={telephone}
              onChangeText={v => { setTelephone(v); setErrors(p => ({ ...p, telephone: '' })); }}
              keyboardType="phone-pad"
              maxLength={9}
              editable={!loading}
              onFocus={() => setIdFocused(true)}
              onBlur={() => setIdFocused(false)}
            />
          </View>
          {!!errors.telephone && <Text style={s.errorText}>{errors.telephone}</Text>}
        </View>
      );
    }

    return (
      <View>
        <View style={[s.inputWrap, idFocused && s.inputFocused, !!hasError && s.inputError]}>
          <View style={s.inputIcon}>
            <Ionicons name="mail-outline" size={18} color={C.textLight} />
          </View>
          <TextInput
            style={s.input}
            placeholder="votre@email.com"
            placeholderTextColor={C.textLight}
            value={email}
            onChangeText={v => { setEmail(v); setErrors(p => ({ ...p, email: '' })); }}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
            onFocus={() => setIdFocused(true)}
            onBlur={() => setIdFocused(false)}
          />
        </View>
        {!!errors.email && <Text style={s.errorText}>{errors.email}</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.flex}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Retour ── */}
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} disabled={loading}>
            <Ionicons name="chevron-back" size={18} color={C.textPrimary} />
          </TouchableOpacity>

          {/* ── Hero ── */}
          <View style={s.hero}>
            <View style={s.appIcon}>
              <Ionicons name="car-outline" size={34} color="#fff" />
            </View>
            <Text style={s.heroTitle}>Bon retour !</Text>
            <Text style={s.heroSub}>
              Connectez-vous pour continuer{'\n'}votre formation de conduite
            </Text>
          </View>

          {/* ── AJOUT : bannière biométrie rapide (visible dès que le matériel est dispo) ── */}
          {biometrieDisponible && (
            <TouchableOpacity
              style={s.bioBanner}
              onPress={handleBiometrie}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={s.bioBannerIcon}>
                <Ionicons name="finger-print-outline" size={22} color={C.primary} />
              </View>
              <View style={s.bioBannerText}>
                <Text style={s.bioBannerTitle}>Connexion biométrique</Text>
                <Text style={s.bioBannerSub}>Touchez pour utiliser empreinte / Face ID</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.textLight} />
            </TouchableOpacity>
          )}

          {/* ── Label identifiant dynamique ── */}
          <Text style={s.fieldLabel}>
            {method === 'telephone' ? 'Numéro de téléphone' : 'Adresse email'}
          </Text>
          {renderIdentifierField()}

          {/* ── Mot de passe ── */}
          <Text style={[s.fieldLabel, { marginTop: 14 }]}>Mot de passe</Text>
          <PasswordInput
            value={password}
            onChange={v => { setPassword(v); setErrors(p => ({ ...p, password: '' })); }}
            error={errors.password}
            editable={!loading}
          />

          {/* ── Mot de passe oublié ── */}
          <TouchableOpacity
            style={s.forgotRow}
            onPress={() => navigation.navigate('ForgotPassword')}
            disabled={loading}
          >
            <Text style={s.forgotLink}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* ── Bouton principal ── */}
          <TouchableOpacity
            style={[s.btnPrimary, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnPrimaryText}>Se connecter</Text>
            }
          </TouchableOpacity>

          {/* ── Biométrie (bouton compact — conservé de l'original) ── */}
          {biometrieDisponible && (
            <TouchableOpacity
              style={s.biometricBtn}
              onPress={handleBiometrie}
              disabled={loading}
              activeOpacity={0.75}
            >
              <Ionicons name="finger-print-outline" size={20} color={C.primary} />
              <Text style={s.biometricText}>Déverrouillage biométrique</Text>
            </TouchableOpacity>
          )}
          
          {/* ── Bas de page ── */}
          <View style={s.bottomLinks}>
            <View style={s.registerRow}>
              <Text style={s.registerText}>Pas encore de compte ? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={loading}>
                <Text style={s.registerLink}>Inscrivez-vous</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => switchMethod(method === 'telephone' ? 'email' : 'telephone')} disabled={loading}>
              <Text style={s.toggleMethodLink}>
                {method === 'telephone'
                  ? 'Se connecter via email'
                  : '← Se connecter via téléphone'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  flex:   { flex: 1 },
  scroll: { flexGrow: 1, padding: 24 },

  backBtn: {
    width: 38, height: 38,
    borderRadius: 12,
    backgroundColor: C.white,
    borderWidth: 0.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },

  hero: { alignItems: 'center', marginBottom: 32 },
  appIcon: {
    width: 72, height: 72,
    borderRadius: 20,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── AJOUT : bannière biométrie rapide ─────────────────
  bioBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  bioBannerIcon: {
    width: 40, height: 40,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioBannerText: { flex: 1 },
  bioBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textPrimary,
    marginBottom: 2,
  },
  bioBannerSub: {
    fontSize: 12,
    color: C.textMuted,
  },
  // ─────────────────────────────────────────────────────

  fieldLabel: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    overflow: 'hidden',
  },
  inputFocused: {
    borderColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  inputError: { borderColor: C.error },

  phonePrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 12,
    gap: 6,
    backgroundColor: C.prefixBg,
  },
  phonePrefixFlag:    { fontSize: 16 },
  phonePrefixCode:    { fontSize: 15, fontWeight: '500', color: C.textPrimary },
  phonePrefixDivider: { width: 1, height: 20, backgroundColor: C.border, marginLeft: 6 },

  inputIcon: { paddingLeft: 14, paddingRight: 10 },
  eyeBtn:    { paddingHorizontal: 14 },

  input: {
    flex: 1,
    fontSize: 15,
    color: C.textPrimary,
    paddingVertical: 14,
    paddingRight: 14,
  },

  errorText: { fontSize: 12, color: C.error, marginTop: 4, marginLeft: 2 },

  forgotRow:  { alignSelf: 'flex-end', marginTop: 8, marginBottom: 20 },
  forgotLink: { fontSize: 13, color: C.primary, fontWeight: '500' },

  btnPrimary: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  btnDisabled:    { opacity: 0.7 },
  btnPrimaryText: { fontSize: 16, fontWeight: '600', color: '#fff', letterSpacing: 0.2 },

  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingVertical: 13,
    marginBottom: 24,
  },
  biometricText: { fontSize: 14, fontWeight: '500', color: '#374151' },

  divider:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: C.border },
  dividerLabel: { fontSize: 11, fontWeight: '500', color: C.textLight, letterSpacing: 0.8 },

  socialRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingVertical: 13,
  },
  googleG:       { fontSize: 15, fontWeight: '700', color: '#4285F4' },
  socialBtnText: { fontSize: 14, fontWeight: '500', color: C.textPrimary },

  bottomLinks:  { alignItems: 'center', gap: 12 },
  registerRow:  { flexDirection: 'row', alignItems: 'center' },
  registerText: { fontSize: 14, color: C.textMuted },
  registerLink: { fontSize: 14, color: C.primary, fontWeight: '600' },

  toggleMethodLink: {
    fontSize: 13,
    color: C.textLight,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;