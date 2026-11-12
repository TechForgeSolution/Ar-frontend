import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

// ─── Palette (shared with RegisterScreen) ────────────────
const C = {
  bg:               '#FFFFFF',
  surface:          '#F7F8FA',
  inputBorder:      '#E8EAF0',
  inputBorderFocus: '#2563EB',
  primary:          '#1D4ED8',
  primaryLight:     '#EEF2FF',
  text:             '#0F172A',
  textSub:          '#64748B',
  placeholder:      '#94A3B8',
  separator:        '#E2E8F0',
  link:             '#2563EB',
  successBg:        '#F0FDF4',
  successText:      '#16A34A',
  successBorder:    '#BBF7D0',
};

// ─── Reusable Field (identical to RegisterScreen) ─────────
interface FieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  keyboardType?: any;
  autoCapitalize?: any;
  secureTextEntry?: boolean;
  maxLength?: number;
  editable?: boolean;
}

const Field: React.FC<FieldProps> = ({
  label, placeholder, value, onChangeText,
  icon, keyboardType = 'default', autoCapitalize = 'sentences',
  secureTextEntry = false, maxLength, editable = true,
}) => {
  const [focused, setFocused] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  return (
    <View style={fieldS.wrapper}>
      <Text style={fieldS.label}>{label}</Text>
      <View style={[fieldS.box, focused && fieldS.boxFocused]}>
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? C.primary : C.placeholder}
            style={fieldS.icon}
          />
        )}
        <TextInput
          style={fieldS.input}
          placeholder={placeholder}
          placeholderTextColor={C.placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry && !showPwd}
          maxLength={maxLength}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPwd(p => !p)} style={fieldS.eyeBtn}>
            <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.placeholder} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const fieldS = StyleSheet.create({
  wrapper:    { marginBottom: 16 },
  label:      { fontSize: 14, fontWeight: '500', color: C.text, marginBottom: 8 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  boxFocused: { borderColor: C.inputBorderFocus, backgroundColor: '#FAFBFF' },
  icon:       { marginRight: 10 },
  input:      { flex: 1, fontSize: 15, color: C.text, paddingVertical: 14 },
  eyeBtn:     { padding: 4 },
});

// ─── CustomSelect ─────────────────────────────────────────
interface SelectProps {
  label: string;
  value: string;
  placeholder: string;
  options: { label: string; value: string | number }[];
  onSelect: (v: any) => void;
  disabled?: boolean;
}

const CustomSelect: React.FC<SelectProps> = ({
  label, value, placeholder, options, onSelect, disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find(o => String(o.value) === String(value))?.label || placeholder;
  const hasValue = value !== '' && String(value) !== '0';

  return (
    <View style={selS.wrapper}>
      <Text style={fieldS.label}>{label}</Text>
      <TouchableOpacity
        style={[selS.box, disabled && { opacity: 0.5 }]}
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.75}
      >
        <Text style={[selS.text, !hasValue && { color: C.placeholder }]}>{selectedLabel}</Text>
        <Ionicons name="chevron-down" size={16} color={C.placeholder} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={selS.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={selS.sheet}>
            <View style={selS.handle} />
            <View style={selS.sheetHeader}>
              <Text style={selS.sheetTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={22} color={C.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {options.map(opt => {
                const active = String(opt.value) === String(value);
                return (
                  <TouchableOpacity
                    key={String(opt.value)}
                    style={[selS.option, active && selS.optionActive]}
                    onPress={() => { onSelect(opt.value); setOpen(false); }}
                  >
                    <Text style={[selS.optionTxt, active && { color: C.primary, fontWeight: '600' }]}>
                      {opt.label}
                    </Text>
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

const selS = StyleSheet.create({
  wrapper:     { marginBottom: 16 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  text:        { fontSize: 15, color: C.text, flex: 1 },
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.separator,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: C.separator,
  },
  sheetTitle:  { fontSize: 17, fontWeight: '600', color: C.text },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.separator,
  },
  optionActive:{ backgroundColor: C.primaryLight },
  optionTxt:   { fontSize: 15, color: C.text, flex: 1 },
});

// ─── Step indicator ───────────────────────────────────────
const StepBadge: React.FC<{ step: number; total: number }> = ({ step, total }) => (
  <View style={stepS.row}>
    {Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        style={[
          stepS.dot,
          i < step ? stepS.dotDone : i === step - 1 ? stepS.dotActive : stepS.dotIdle,
        ]}
      />
    ))}
  </View>
);
const stepS = StyleSheet.create({
  row:        { flexDirection: 'row', gap: 6, marginBottom: 28 },
  dot:        { height: 4, borderRadius: 2, flex: 1 },
  dotIdle:    { backgroundColor: C.separator },
  dotActive:  { backgroundColor: C.primary },
  dotDone:    { backgroundColor: C.primary, opacity: 0.35 },
});

// ─── Main Screen ──────────────────────────────────────────
const RegisterCompletionScreen: React.FC = () => {
  const { completerProfil, user } = useAuth();
  const { centresExamen, getDefaultParrainageCode } = useConfig();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nom:              user?.nom !== 'À définir'    ? user?.nom    || '' : '',
    prenom:           user?.prenom !== 'À définir' ? user?.prenom || '' : '',
    telephone:        '',
    type_permis:      'permis_b' as 'permis_a' | 'permis_b',
    centre_examen_id: 0,
    code_parrainage:  '',
    date_naissance:   '',
  });

  const activeCentres = useMemo(
    () => centresExamen?.filter(c => c?.active) || [],
    [centresExamen]
  );

  const centreOptions = useMemo(() => [
    { label: "Choisir un centre d'examen", value: 0 },
    ...activeCentres.map(c => ({
      label: `${c.nom}${c.ville ? ` · ${c.ville}` : ''}`,
      value: c.id,
    })),
  ], [activeCentres]);

  const permisOptions = [
    { label: 'A — Moto',    value: 'permis_a' },
    { label: 'B — Voiture', value: 'permis_b' },
  ];

  const update = <K extends keyof typeof formData>(k: K, v: (typeof formData)[K]) =>
    setFormData(p => ({ ...p, [k]: v }));

  const handleNoCode = async () => {
    const code = await getDefaultParrainageCode();
    if (code) { update('code_parrainage', code); Toast.show({ type: 'info', text1: 'Code appliqué' }); }
    else Toast.show({ type: 'error', text1: 'Code introuvable' });
  };

  const handleSubmit = async () => {
    if (!formData.nom.trim() || !formData.prenom.trim()) {
      Toast.show({ type: 'error', text1: 'Nom et prénom requis' }); return;
    }
    if (!formData.telephone.trim() || formData.telephone.length < 9) {
      Toast.show({ type: 'error', text1: 'Numéro invalide (9 chiffres min.)' }); return;
    }
    if (!formData.code_parrainage.trim()) {
      Toast.show({ type: 'error', text1: 'Code de parrainage requis' }); return;
    }
    setLoading(true);
    await completerProfil({
      nom:              formData.nom,
      prenom:           formData.prenom,
      telephone:        formData.telephone,
      type_permis:      formData.type_permis,
      centre_examen_id: formData.centre_examen_id || undefined,
      code_parrainage:  formData.code_parrainage,
      date_naissance:   formData.date_naissance || undefined,
    });
    setLoading(false);
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Progress ── */}
          <StepBadge step={2} total={3} />

          {/* ── Social account pill ── */}
          {user?.email && (
            <View style={s.socialPill}>
              <Ionicons name="checkmark-circle" size={16} color={C.successText} />
              <Text style={s.socialPillTxt}>Connecté avec {user.email}</Text>
            </View>
          )}

          {/* ── Hero ── */}
          <View style={s.hero}>
            <Text style={s.heroTitle}>Finalisez votre{'\n'}inscription</Text>
            <Text style={s.heroSub}>
              Quelques informations supplémentaires{'\n'}pour activer votre compte.
            </Text>
          </View>

          {/* ── Personal info ── */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>Informations personnelles</Text>
            <Field
              label="Prénom"
              placeholder="Ex: Jean"
              value={formData.prenom}
              onChangeText={v => update('prenom', v)}
              autoCapitalize="words"
              editable={!loading}
            />
            <Field
              label="Nom"
              placeholder="Ex: Dupont"
              value={formData.nom}
              onChangeText={v => update('nom', v)}
              autoCapitalize="words"
              editable={!loading}
            />
            <Field
              label="Téléphone"
              placeholder="+237 6 XX XX XX XX"
              value={formData.telephone}
              onChangeText={v => update('telephone', v)}
              icon="call-outline"
              keyboardType="phone-pad"
              autoCapitalize="none"
              maxLength={9}
              editable={!loading}
            />
          </View>

          {/* ── Config ── */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>Configuration du permis</Text>
            <CustomSelect
              label="Catégorie de permis"
              value={formData.type_permis}
              placeholder="Choisir"
              options={permisOptions}
              onSelect={v => update('type_permis', v)}
              disabled={loading}
            />
            <CustomSelect
              label="Centre d'examen"
              value={String(formData.centre_examen_id)}
              placeholder="Choisir un centre"
              options={centreOptions}
              onSelect={v => update('centre_examen_id', Number(v))}
              disabled={loading}
            />
          </View>

          {/* ── Parrainage ── */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>Code de parrainage</Text>
            <Field
              label="Code promo"
              placeholder="Ex: PROMO2024"
              value={formData.code_parrainage}
              onChangeText={v => update('code_parrainage', v.toUpperCase())}
              icon="gift-outline"
              autoCapitalize="characters"
              editable={!loading}
            />
            <TouchableOpacity onPress={handleNoCode} disabled={loading} style={s.noCodeBtn}>
              <Text style={s.noCodeTxt}>Je n'ai pas de code</Text>
            </TouchableOpacity>
          </View>

          {/* ── Info banner ── */}
          <View style={s.infoBanner}>
            <Ionicons name="information-circle-outline" size={18} color={C.primary} style={{ marginRight: 10 }} />
            <Text style={s.infoTxt}>
              Un SMS de vérification vous sera envoyé pour confirmer votre numéro.
            </Text>
          </View>

          {/* ── CTA ── */}
          <TouchableOpacity
            style={[s.cta, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={s.ctaLabel}>Finaliser mon inscription</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll:    { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },

  socialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.successBg,
    borderWidth: 1,
    borderColor: C.successBorder,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  socialPillTxt: { fontSize: 13, color: C.successText, fontWeight: '500' },

  hero:       { marginBottom: 28 },
  heroTitle:  { fontSize: 30, fontWeight: '800', color: C.text, letterSpacing: -0.5, marginBottom: 8 },
  heroSub:    { fontSize: 15, color: C.textSub, lineHeight: 22 },

  section:      { marginBottom: 8 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: C.textSub, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, marginTop: 8 },

  noCodeBtn:  { alignSelf: 'flex-end', marginTop: -8, marginBottom: 16 },
  noCodeTxt:  { fontSize: 13, color: C.link, fontWeight: '500' },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.primaryLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoTxt: { fontSize: 13, color: '#1E40AF', lineHeight: 19, flex: 1 },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    borderRadius: 16,
    height: 56,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default RegisterCompletionScreen;