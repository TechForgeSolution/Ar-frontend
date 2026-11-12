import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

const C = {
  bg: '#FFFFFF', surface: '#F7F8FA', inputBorder: '#E8EAF0',
  inputBorderFocus: '#2563EB', primary: '#1D4ED8', primaryLight: '#EEF2FF',
  text: '#0F172A', textSub: '#64748B', placeholder: '#94A3B8',
  separator: '#E2E8F0', link: '#2563EB', cardBorder: '#E2E8F0',
  cardActive: '#EEF2FF', cardActiveBorder: '#2563EB', success: '#10B981',
};

type AuthMethod = 'telephone' | 'email' | null;

// ─── MethodCard ───────────────────────────────────────────
interface MethodCardProps {
  method: Exclude<AuthMethod, null>;
  selected: boolean;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  iconColor?: string;
  busy?: boolean;
}

const MethodCard: React.FC<MethodCardProps> = ({ method, selected, onPress, icon, label, description, iconColor, busy }) => (
  <TouchableOpacity
    style={[mS.card, selected && mS.cardActive]}
    onPress={onPress} activeOpacity={0.75} disabled={busy}
  >
    <View style={[mS.iconWrap, selected && mS.iconWrapActive]}>
      <Ionicons name={icon} size={22} color={selected ? C.primary : (iconColor || C.textSub)} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[mS.label, selected && mS.labelActive]}>{label}</Text>
      <Text style={mS.desc}>{description}</Text>
    </View>
    <View style={[mS.radio, selected && mS.radioActive]}>
      {selected && <View style={mS.radioDot} />}
    </View>
  </TouchableOpacity>
);

const mS = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, borderWidth: 1.5, borderColor: C.cardBorder, backgroundColor: C.surface, marginBottom: 12 },
  cardActive: { borderColor: C.cardActiveBorder, backgroundColor: C.cardActive },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.inputBorder },
  iconWrapActive: { backgroundColor: C.primaryLight, borderColor: C.cardActiveBorder },
  label: { fontSize: 15, fontWeight: '600', color: C.text },
  labelActive: { color: C.primary },
  desc: { fontSize: 12, color: C.textSub, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.inputBorder, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: C.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
});

// ─── Field ────────────────────────────────────────────────
interface FieldProps {
  label: string; placeholder: string; value: string;
  onChangeText: (v: string) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  keyboardType?: any; autoCapitalize?: any;
  secureTextEntry?: boolean; maxLength?: number; editable?: boolean;
}

const Field: React.FC<FieldProps> = ({ label, placeholder, value, onChangeText, icon, keyboardType = 'default', autoCapitalize = 'sentences', secureTextEntry = false, maxLength, editable = true }) => {
  const [focused, setFocused] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  return (
    <View style={fS.wrapper}>
      <Text style={fS.label}>{label}</Text>
      <View style={[fS.box, focused && fS.boxFocused]}>
        {icon && <Ionicons name={icon} size={18} color={focused ? C.primary : C.placeholder} style={fS.icon} />}
        <TextInput
          style={fS.input} placeholder={placeholder} placeholderTextColor={C.placeholder}
          value={value} onChangeText={onChangeText} keyboardType={keyboardType}
          autoCapitalize={autoCapitalize} secureTextEntry={secureTextEntry && !showPwd}
          maxLength={maxLength} editable={editable}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPwd(p => !p)} style={fS.eyeBtn}>
            <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.placeholder} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const fS = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: C.text, marginBottom: 8 },
  box: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.inputBorder, borderRadius: 14, paddingHorizontal: 14, minHeight: 52 },
  boxFocused: { borderColor: C.inputBorderFocus, backgroundColor: '#FAFBFF' },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: C.text, paddingVertical: 14 },
  eyeBtn: { padding: 4 },
});

// ─── CustomSelect ─────────────────────────────────────────
interface SelectProps {
  label: string; value: string; placeholder: string;
  options: { label: string; value: string | number }[];
  onSelect: (v: any) => void; disabled?: boolean;
}

const CustomSelect: React.FC<SelectProps> = ({ label, value, placeholder, options, onSelect, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find(o => String(o.value) === String(value))?.label || placeholder;
  const hasValue = value !== '' && String(value) !== '0';
  return (
    <View style={sS.wrapper}>
      <Text style={fS.label}>{label}</Text>
      <TouchableOpacity style={[sS.box, disabled && { opacity: 0.5 }]} onPress={() => !disabled && setOpen(true)} activeOpacity={0.75}>
        <Text style={[sS.text, !hasValue && { color: C.placeholder }]}>{selectedLabel}</Text>
        <Ionicons name="chevron-down" size={16} color={C.placeholder} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={sS.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={sS.sheet}>
            <View style={sS.handle} />
            <View style={sS.sheetHeader}>
              <Text style={sS.sheetTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}><Ionicons name="close" size={22} color={C.text} /></TouchableOpacity>
            </View>
            <ScrollView>
              {options.map(opt => {
                const active = String(opt.value) === String(value);
                return (
                  <TouchableOpacity key={String(opt.value)} style={[sS.option, active && sS.optionActive]} onPress={() => { onSelect(opt.value); setOpen(false); }}>
                    <Text style={[sS.optionText, active && { color: C.primary, fontWeight: '600' }]}>{opt.label}</Text>
                    {active && <Ionicons name="checkmark" size={18} color={C.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const sS = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  box: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.inputBorder, borderRadius: 14, paddingHorizontal: 14, minHeight: 52 },
  text: { fontSize: 15, color: C.text, flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingBottom: 32 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.separator, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.separator },
  sheetTitle: { fontSize: 17, fontWeight: '600', color: C.text },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.separator },
  optionActive: { backgroundColor: C.primaryLight },
  optionText: { fontSize: 15, color: C.text, flex: 1 },
});

// ─── ConfigFields ─────────────────────────────────────────
interface ConfigFormData {
  type_permis: 'permis_a' | 'permis_b';
  centre_examen_id: number;
  code_parrainage: string;
}

const ConfigFields: React.FC<{
  data: ConfigFormData;
  update: <K extends keyof ConfigFormData>(k: K, v: ConfigFormData[K]) => void;
  centreOptions: { label: string; value: string | number }[];
  permisOptions: { label: string; value: string }[];
  handleNoCode: () => void;
  busy: boolean;
}> = ({ data, update, centreOptions, permisOptions, handleNoCode, busy }) => (
  <>
    <View style={s.sectionDivider}><Text style={s.sectionTitle}>Préférences de formation</Text></View>
    <CustomSelect label="Catégorie de permis" value={data.type_permis} placeholder="Choisir" options={permisOptions} onSelect={v => update('type_permis', v)} disabled={busy} />
    <CustomSelect label="Centre d'examen" value={String(data.centre_examen_id)} placeholder="Choisir un centre" options={centreOptions} onSelect={v => update('centre_examen_id', Number(v))} disabled={busy} />
    <Field label="Code de parrainage" placeholder="Ex: PROMO2024" value={data.code_parrainage} onChangeText={v => update('code_parrainage', v.toUpperCase())} icon="gift-outline" autoCapitalize="characters" editable={!busy} />
    <TouchableOpacity onPress={handleNoCode} disabled={busy} style={s.noCodeBtn}>
      <Text style={s.noCodeTxt}>Je n'ai pas de code</Text>
    </TouchableOpacity>
  </>
);

// ─── StepMethod ───────────────────────────────────────────
const StepMethod: React.FC<{ selected: AuthMethod; onSelect: (m: Exclude<AuthMethod, null>) => void; busy: boolean }> = ({ selected, onSelect, busy }) => (
  <View>
    <View style={s.hero}>
      <Text style={s.heroTitle}>Créer un compte</Text>
      <Text style={s.heroSub}>Choisissez comment vous souhaitez{'\n'}vous inscrire.</Text>
    </View>
    <MethodCard method="telephone" selected={selected === 'telephone'} onPress={() => onSelect('telephone')} icon="logo-whatsapp" label="Numéro WhatsApp" description="Vérification du numéro par code WhatsApp" busy={busy} />
    <MethodCard method="email" selected={selected === 'email'} onPress={() => onSelect('email')} icon="mail-outline" label="Adresse e-mail" description="Inscription avec vérification par code mail" busy={busy} />
  </View>
);

// ─── StepTel ──────────────────────────────────────────────
interface TelFormData extends ConfigFormData {
  nom: string; prenom: string; telephone: string;
  password: string; password_confirmation: string;
}

const StepTel: React.FC<{
  data: TelFormData;
  update: <K extends keyof TelFormData>(k: K, v: TelFormData[K]) => void;
  centreOptions: { label: string; value: string | number }[];
  permisOptions: { label: string; value: string }[];
  handleNoCode: () => void; busy: boolean;
}> = ({ data, update, centreOptions, permisOptions, handleNoCode, busy }) => (
  <View>
    <View style={s.stepHero}>
      <View style={s.methodBadge}><Ionicons name="logo-whatsapp" size={14} color={C.primary} /><Text style={s.methodBadgeText}>Inscription par WhatsApp</Text></View>
      <Text style={s.stepTitle}>Vos informations</Text>
    </View>
    <Field label="Prénom" placeholder="Ex: Fongang" value={data.prenom} onChangeText={v => update('prenom', v)} autoCapitalize="words" editable={!busy} />
    <Field label="Nom" placeholder="Ex: Wilfried" value={data.nom} onChangeText={v => update('nom', v)} autoCapitalize="words" editable={!busy} />
    <Field label="Numéro WhatsApp" placeholder="6 XX XX XX XX" value={data.telephone} onChangeText={v => update('telephone', v.replace(/\D/g, ''))} icon="call-outline" keyboardType="phone-pad" autoCapitalize="none" maxLength={9} editable={!busy} />
    <Text style={{ color: C.textSub, fontSize: 12, marginTop: -10, marginBottom: 16 }}>
      Saisissez le numéro associé à votre compte WhatsApp. Un code de vérification y sera envoyé.
    </Text>
    <Field label="Mot de passe" placeholder="Min. 6 caractères" value={data.password} onChangeText={v => update('password', v)} icon="lock-closed-outline" secureTextEntry editable={!busy} />
    <Field label="Confirmer le mot de passe" placeholder="Confirmez votre mot de passe" value={data.password_confirmation} onChangeText={v => update('password_confirmation', v)} icon="lock-closed-outline" secureTextEntry editable={!busy} />
    <ConfigFields data={data} update={update as any} centreOptions={centreOptions} permisOptions={permisOptions} handleNoCode={handleNoCode} busy={busy} />
  </View>
);

// ─── StepEmail ────────────────────────────────────────────
interface EmailFormData extends ConfigFormData {
  nom: string; prenom: string; email: string;
  password: string; password_confirmation: string;
}

const StepEmail: React.FC<{
  data: EmailFormData;
  update: <K extends keyof EmailFormData>(k: K, v: EmailFormData[K]) => void;
  centreOptions: { label: string; value: string | number }[];
  permisOptions: { label: string; value: string }[];
  handleNoCode: () => void; busy: boolean;
}> = ({ data, update, centreOptions, permisOptions, handleNoCode, busy }) => (
  <View>
    <View style={s.stepHero}>
      <View style={s.methodBadge}><Ionicons name="mail-outline" size={14} color={C.primary} /><Text style={s.methodBadgeText}>Inscription par e-mail</Text></View>
      <Text style={s.stepTitle}>Vos informations</Text>
    </View>
    <Field label="Prénom" placeholder="Ex: Wilfried" value={data.prenom} onChangeText={v => update('prenom', v)} autoCapitalize="words" editable={!busy} />
    <Field label="Nom" placeholder="Ex: SIGNE" value={data.nom} onChangeText={v => update('nom', v)} autoCapitalize="words" editable={!busy} />
    <Field label="Adresse e-mail" placeholder="wilfriedsigne@example.com" value={data.email} onChangeText={v => update('email', v)} icon="mail-outline" keyboardType="email-address" autoCapitalize="none" editable={!busy} />
    <Field label="Mot de passe" placeholder="Min. 6 caractères" value={data.password} onChangeText={v => update('password', v)} icon="lock-closed-outline" secureTextEntry editable={!busy} />
    <Field label="Confirmer le mot de passe" placeholder="Confirmez votre mot de passe" value={data.password_confirmation} onChangeText={v => update('password_confirmation', v)} icon="lock-closed-outline" secureTextEntry editable={!busy} />
    <ConfigFields data={data} update={update as any} centreOptions={centreOptions} permisOptions={permisOptions} handleNoCode={handleNoCode} busy={busy} />
  </View>
);

// ─── Social loading ───────────────────────────────────────
const SocialLoading: React.FC<{ provider: 'google' | 'apple' }> = ({ provider }) => (
  <View style={slS.wrap}>
    <ActivityIndicator size="large" color={C.primary} />
    <Text style={slS.text}>{provider === 'google' ? 'Connexion avec Google…' : 'Connexion avec Apple…'}</Text>
    <Text style={slS.sub}>Veuillez patienter</Text>
  </View>
);
const slS = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  text: { fontSize: 17, fontWeight: '600', color: C.text, marginTop: 20 },
  sub: { fontSize: 14, color: C.textSub, marginTop: 6 },
});

// ─── StepDots ─────────────────────────────────────────────
const StepDots: React.FC<{ step: 1 | 2; method: AuthMethod }> = ({ step, method }) => {
  if (method !== 'telephone' && method !== 'email') return null;
  return (
    <View style={dS.row}>
      {[1, 2].map(n => <View key={n} style={[dS.dot, step >= n && dS.dotActive]} />)}
    </View>
  );
};
const dS = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignSelf: 'center', marginBottom: 28 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.separator },
  dotActive: { backgroundColor: C.primary, width: 24 },
});

// ─── Main Screen ──────────────────────────────────────────
// ─── Types ────────────────────────────────────────────────

// ─── Main Screen ──────────────────────────────────────────
const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register, envoyerOtpTelephone } = useAuth();
  const { centresExamen, getDefaultParrainageCode: configNoCode } = useConfig();

  const [step,    setStep]    = useState<1 | 2>(1);
  const [method,  setMethod]  = useState<AuthMethod>(null);
  const [loading, setLoading] = useState(false);

  const [telForm, setTelForm] = useState({
    nom: '', prenom: '', telephone: '', password: '', password_confirmation: '',
    type_permis: 'permis_b' as 'permis_a' | 'permis_b', centre_examen_id: 0, code_parrainage: '',
  });

  const [emailForm, setEmailForm] = useState({
    nom: '', prenom: '', email: '', password: '', password_confirmation: '',
    type_permis: 'permis_b' as 'permis_a' | 'permis_b', centre_examen_id: 0, code_parrainage: '',
  });

  const activeCentres = useMemo(() => centresExamen?.filter((c: any) => c?.active) || [], [centresExamen]);
  const centreOptions = useMemo(() => [
    { label: "Choisir un centre d'examen", value: 0 },
    ...activeCentres.map((c: any) => ({ label: `${c.nom}${c.ville ? ` · ${c.ville}` : ''}`, value: c.id })),
  ], [activeCentres]);
  const permisOptions = [{ label: 'A — Moto', value: 'permis_a' }, { label: 'B — Voiture', value: 'permis_b' }];

  const updateTel   = <K extends keyof typeof telForm>(k: K, v: (typeof telForm)[K]) => setTelForm(p => ({ ...p, [k]: v }));
  const updateEmail = <K extends keyof typeof emailForm>(k: K, v: (typeof emailForm)[K]) => setEmailForm(p => ({ ...p, [k]: v }));

  const noCodeHelper = async (setter: (v: string) => void) => {
    try {
      const fn = configNoCode;
      const code = await fn?.();
      if (code) { setter(code); Toast.show({ type: 'info', text1: 'Code appliqué' }); }
      else Toast.show({ type: 'error', text1: 'Code introuvable' });
    } catch { Toast.show({ type: 'error', text1: 'Code introuvable' }); }
  };

  const handleSelectMethod = (m: Exclude<AuthMethod, null>) => {
    setMethod(m);
    setStep(2);
  };

  const validateTel = (): boolean => {
    if (!telForm.prenom.trim())  { Toast.show({ type: 'error', text1: 'Le prénom est requis' }); return false; }
    if (!telForm.nom.trim())     { Toast.show({ type: 'error', text1: 'Le nom est requis' }); return false; }
    if (!telForm.telephone.trim() || telForm.telephone.length < 9) { Toast.show({ type: 'error', text1: 'Numéro invalide (9 chiffres min.)' }); return false; }
    if (telForm.centre_examen_id === 0) { Toast.show({ type: 'error', text1: "Sélectionnez un centre d'examen" }); return false; }
    if (!telForm.code_parrainage.trim()) { Toast.show({ type: 'error', text1: 'Code de parrainage requis' }); return false; }
    if (telForm.password.length < 6) { Toast.show({ type: 'error', text1: 'Mot de passe trop court (min. 6 caractères)' }); return false; }
    if (telForm.password !== telForm.password_confirmation) { Toast.show({ type: 'error', text1: 'Les mots de passe ne correspondent pas' }); return false; }
    return true;
  };

  const validateEmail = (): boolean => {
    if (!emailForm.prenom.trim()) { Toast.show({ type: 'error', text1: 'Le prénom est requis' }); return false; }
    if (!emailForm.nom.trim())    { Toast.show({ type: 'error', text1: 'Le nom est requis' }); return false; }
    if (!emailForm.email.trim() || !emailForm.email.includes('@')) { Toast.show({ type: 'error', text1: 'Adresse e-mail invalide' }); return false; }
    if (emailForm.centre_examen_id === 0) { Toast.show({ type: 'error', text1: "Sélectionnez un centre d'examen" }); return false; }
    if (!emailForm.code_parrainage.trim()) { Toast.show({ type: 'error', text1: 'Code de parrainage requis' }); return false; }
    if (emailForm.password.length < 6) { Toast.show({ type: 'error', text1: 'Mot de passe trop court (min. 6 caractères)' }); return false; }
    if (emailForm.password !== emailForm.password_confirmation) { Toast.show({ type: 'error', text1: 'Les mots de passe ne correspondent pas' }); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (method === 'telephone') {
      if (!validateTel()) return;
      Keyboard.dismiss();
      setLoading(true);
      const otpSent = await envoyerOtpTelephone(telForm.telephone, 'inscription');
      if (otpSent) {
        navigation.navigate('OtpVerification', {
          mode: 'telephone_registration',
          telephone: telForm.telephone,
          registrationData: {
            nom: telForm.nom,
            prenom: telForm.prenom,
            telephone: telForm.telephone,
            password: telForm.password,
            password_confirmation: telForm.password_confirmation,
            type_permis: telForm.type_permis,
            centre_examen_id: telForm.centre_examen_id,
            code_parrainage: telForm.code_parrainage,
          },
        });
      }
      setLoading(false);

    } else if (method === 'email') {
      if (!validateEmail()) return;
      Keyboard.dismiss();
      setLoading(true);
      const result = await register({
        nom: emailForm.nom, prenom: emailForm.prenom, email: emailForm.email,
        password: emailForm.password, password_confirmation: emailForm.password_confirmation,
        type_permis: emailForm.type_permis, centre_examen_id: emailForm.centre_examen_id,
        code_parrainage: emailForm.code_parrainage,
      });
      if (result?.needsEmailVerification && result?.email) {
        navigation.navigate('OtpVerification', {
          email: result.email,
          mode: 'email_verification',
        });
      }
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 2) { setStep(1); setMethod(null); }
    else navigation.goBack();
  };

  if (!centresExamen) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loadingTxt}>Chargement…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <TouchableOpacity onPress={handleBack} disabled={loading} style={s.back}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
            <Text style={s.backLabel}>{step === 1 ? 'Inscription' : 'Choisir une méthode'}</Text>
          </TouchableOpacity>

          <StepDots step={step} method={method} />

          {step === 1 ? (
            <StepMethod selected={method} onSelect={handleSelectMethod} busy={loading} />
          ) : method === 'telephone' ? (
            <StepTel
              data={telForm}
              update={updateTel}
              centreOptions={centreOptions}
              permisOptions={permisOptions}
              handleNoCode={() => noCodeHelper(v => updateTel('code_parrainage', v))}
              busy={loading}
            />
          ) : method === 'email' ? (
            <StepEmail
              data={emailForm}
              update={updateEmail}
              centreOptions={centreOptions}
              permisOptions={permisOptions}
              handleNoCode={() => noCodeHelper(v => updateEmail('code_parrainage', v))}
              busy={loading}
            />
          ) : null}

          {step === 2 && (method === 'telephone' || method === 'email') && (
            <TouchableOpacity style={[s.cta, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Text style={s.ctaLabel}>{method === 'telephone' ? 'Recevoir mon code WhatsApp' : 'Continuer'}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>
          )}

          {step === 1 && method && (
            <TouchableOpacity style={[s.cta, { marginTop: 8 }]} onPress={() => setStep(2)} activeOpacity={0.85}>
              <Text style={s.ctaLabel}>Continuer</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          )}

          <View style={s.loginRow}>
            <Text style={s.loginTxt}>Déjà un compte ?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
              <Text style={s.loginLink}> Se connecter</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingTxt: { fontSize: 14, color: C.textSub, marginTop: 12 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backLabel: { fontSize: 16, fontWeight: '600', color: C.text },
  hero: { marginBottom: 28 },
  heroTitle: { fontSize: 30, fontWeight: '800', color: C.text, letterSpacing: -0.5, marginBottom: 8 },
  heroSub: { fontSize: 15, color: C.textSub, lineHeight: 22 },
  stepHero: { marginBottom: 24 },
  stepTitle: { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.3, marginTop: 8 },
  methodBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: C.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  methodBadgeText: { fontSize: 12, fontWeight: '600', color: C.primary },
  sectionDivider: { marginTop: 4, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.textSub, letterSpacing: 0.8 },
  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  orLine: { flex: 1, height: 1, backgroundColor: C.separator },
  orText: { fontSize: 11, fontWeight: '600', color: C.textSub, letterSpacing: 1.2, marginHorizontal: 12 },
  noCodeBtn: { alignSelf: 'flex-end', marginTop: -8, marginBottom: 16 },
  noCodeTxt: { fontSize: 13, color: C.link, fontWeight: '500' },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary, borderRadius: 16, height: 56, marginTop: 8, shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  ctaLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginTxt: { fontSize: 14, color: C.textSub },
  loginLink: { fontSize: 14, color: C.link, fontWeight: '600' },
});

export default RegisterScreen;