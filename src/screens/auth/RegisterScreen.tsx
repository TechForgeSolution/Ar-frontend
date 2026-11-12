import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { theme } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

interface SelectProps {
  label: string;
  value: string;
  placeholder: string;
  options: { label: string; value: string | number }[];
  onSelect: (value: any) => void;
  disabled?: boolean;
}

const CustomSelect: React.FC<SelectProps> = ({
  label,
  value,
  placeholder,
  options,
  onSelect,
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedLabel = options.find(opt => String(opt.value) === String(value))?.label || placeholder;
  const hasValue = value !== '' && String(value) !== '0';

  return (
    <View style={styles.selectWrapper}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.selectButton, disabled && styles.selectButtonDisabled]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectButtonText, !hasValue && styles.selectPlaceholder]}>
          {selectedLabel}
        </Text>
        <Text style={styles.selectArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {options.map((option) => (
                <TouchableOpacity
                  key={String(option.value)}
                  style={[
                    styles.modalOption,
                    String(option.value) === String(value) && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    onSelect(option.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    String(option.value) === String(value) && styles.modalOptionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                  {String(option.value) === String(value) && (
                    <Text style={styles.modalCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register, requestPhoneOtp, verifyPhoneOtp } = useAuth();
  const { centresExamen, getDefaultParrainageCode } = useConfig();

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    password: '',
    password_confirmation: '',
    date_naissance: '',
    type_permis: 'permis_b' as 'permis_a' | 'permis_b' | 'permis_t',
    centre_examen_id: 0,
    code_parrainage: '',
  });

  const activeCentres = useMemo(() =>
    centresExamen?.filter(c => c?.active) || [], [centresExamen]
  );

  const permisOptions = [
    { label: 'A (Moto)', value: 'permis_a' },
    { label: 'B (Voiture)', value: 'permis_b' },
  ];

  const centreOptions = useMemo(() => [
    { label: 'Choisir un centre', value: 0 },
    ...activeCentres.map(c => ({
      label: `${c.nom}${c.ville ? ` (${c.ville})` : ''}`,
      value: c.id,
    })),
  ], [activeCentres]);

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'telephone') {
      setOtpSent(false);
      setOtpCode('');
      setVerificationToken(null);
    }
  };

  const handleNoCode = async () => {
    try {
      const defaultCode = await getDefaultParrainageCode();
      if (defaultCode) {
        updateField('code_parrainage', defaultCode);
        Toast.show({
          type: 'info',
          text1: 'Code par défaut appliqué',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Impossible de récupérer le code',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Impossible de récupérer le code',
      });
    }
  };

  const validateForm = (): boolean => {
    if (!formData.nom.trim()) {
      Toast.show({ type: 'error', text1: 'Le nom est requis' });
      return false;
    }
    if (!formData.prenom.trim()) {
      Toast.show({ type: 'error', text1: 'Le prénom est requis' });
      return false;
    }
    if (!/^\d{9}$/.test(formData.telephone.trim())) {
      Toast.show({ type: 'error', text1: 'Numéro invalide (9 chiffres)' });
      return false;
    }
    if (formData.centre_examen_id === 0) {
      Toast.show({ type: 'error', text1: "Sélectionnez un centre d'examen" });
      return false;
    }
    if (!formData.code_parrainage.trim()) {
      Toast.show({ type: 'error', text1: 'Le code de parrainage est requis' });
      return false;
    }
    if (formData.password.length < 6) {
      Toast.show({ type: 'error', text1: 'Mot de passe trop court (min 6)' });
      return false;
    }
    if (formData.password !== formData.password_confirmation) {
      Toast.show({ type: 'error', text1: 'Mots de passe différents' });
      return false;
    }
    return true;
  };

  const handleRequestOtp = async () => {
    if (!validateForm()) return;

    Keyboard.dismiss();
    setLoading(true);

    try {
      const sent = await requestPhoneOtp(formData.telephone, 'inscription');
      if (sent) setOtpSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!validateForm()) return;
    if (!otpCode.trim() && !verificationToken) {
      Toast.show({ type: 'error', text1: 'Saisissez le code reçu sur WhatsApp' });
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      let verifiedToken = verificationToken;
      if (!verifiedToken) {
        verifiedToken = await verifyPhoneOtp(formData.telephone, otpCode.trim(), 'inscription');
        if (!verifiedToken) return;
        setVerificationToken(verifiedToken);
      }

      const success = await register({
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        date_naissance: formData.date_naissance,
        type_permis: formData.type_permis,
        type_cours: 'en_ligne',
        vague: '1',
        centre_examen_id: formData.centre_examen_id,
        code_parrainage: formData.code_parrainage,
        otp_token: verifiedToken,
      });

      if (success) {
        Toast.show({ type: 'success', text1: 'Inscription réussie' });
        navigation.goBack();
      } else {
        Toast.show({ type: 'error', text1: "Échec de l'inscription" });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error?.message || 'Une erreur est survenue',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!centresExamen) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              disabled={loading}
              style={styles.backButton}
            >
              <Text style={styles.backText}>← Retour</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Inscription</Text>
          </View>

          {/* Informations personnelles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations personnelles</Text>

            <Input
              label="Nom *"
              placeholder="Votre nom"
              value={formData.nom}
              onChangeText={v => updateField('nom', v)}
              leftIcon="person-outline"
              editable={!loading}
              autoCapitalize="words"
            />

            <Input
              label="Prénom *"
              placeholder="Votre prénom"
              value={formData.prenom}
              onChangeText={v => updateField('prenom', v)}
              leftIcon="person-outline"
              editable={!loading}
              autoCapitalize="words"
            />

            <Input
              label="Numéro WhatsApp *"
              placeholder="6XXXXXXXX"
              value={formData.telephone}
              onChangeText={v => updateField('telephone', v)}
              keyboardType="phone-pad"
              leftIcon="call-outline"
              editable={!loading}
              maxLength={9}
            />
            <Text style={styles.helperText}>
              Utilisez le numéro associé à votre compte WhatsApp. Un code de vérification vous sera envoyé sur ce numéro.
            </Text>
          </View>

          {/* Configuration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuration</Text>

            <CustomSelect
              label="Catégorie de permis *"
              value={formData.type_permis}
              placeholder="Choisir un type"
              options={permisOptions}
              onSelect={v => updateField('type_permis', v)}
              disabled={loading}
            />

            <CustomSelect
              label="Centre d'examen *"
              value={String(formData.centre_examen_id)}
              placeholder="Choisir un centre"
              options={centreOptions}
              onSelect={v => updateField('centre_examen_id', Number(v))}
              disabled={loading}
            />
          </View>

          {/* Parrainage & Sécurité */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parrainage & Sécurité</Text>

            <Input
              label="Code de parrainage *"
              placeholder="Code de votre parrain"
              value={formData.code_parrainage}
              onChangeText={v => updateField('code_parrainage', v.toUpperCase())}
              leftIcon="gift-outline"
              editable={!loading}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              onPress={handleNoCode}
              style={styles.noCodeBtn}
              disabled={loading}
            >
              <Text style={styles.noCodeText}>Je n'ai pas de code</Text>
            </TouchableOpacity>

            <Input
              label="Mot de passe *"
              placeholder="Min. 6 caractères"
              value={formData.password}
              onChangeText={v => updateField('password', v)}
              isPassword
              leftIcon="lock-closed-outline"
              editable={!loading}
            />

            <Input
              label="Confirmer le mot de passe *"
              placeholder="Confirmez votre mot de passe"
              value={formData.password_confirmation}
              onChangeText={v => updateField('password_confirmation', v)}
              isPassword
              leftIcon="lock-closed-outline"
              editable={!loading}
            />
          </View>

          {otpSent && (
            <Input
              label="Code reçu sur WhatsApp"
              placeholder="Code à 6 chiffres"
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading && !verificationToken}
              leftIcon="key-outline"
            />
          )}

          <Button
            title={loading
              ? 'Veuillez patienter...'
              : !otpSent
                ? 'Recevoir un code WhatsApp'
                : verificationToken
                  ? 'Créer mon compte'
                  : 'Vérifier le code et créer mon compte'}
            onPress={otpSent ? handleVerifyAndRegister : handleRequestOtp}
            loading={loading}
            disabled={loading}
            fullWidth
            size="large"
          />

          {otpSent && !verificationToken && (
            <TouchableOpacity
              onPress={handleRequestOtp}
              disabled={loading}
              style={styles.resendButton}
            >
              <Text style={styles.resendText}>Renvoyer le code sur WhatsApp</Text>
            </TouchableOpacity>
          )}

          <View style={styles.footer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  helperText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  resendText: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    marginBottom: theme.spacing.sm,
  },
  backText: {
    ...theme.typography.body,
    color: theme.colors.primary,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.bodySmall,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  selectWrapper: {
    marginBottom: theme.spacing.md,
  },
  selectButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52,
  },
  selectButtonDisabled: {
    opacity: 0.5,
  },
  selectButtonText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  selectPlaceholder: {
    color: theme.colors.textSecondary,
  },
  selectArrow: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginLeft: theme.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '70%',
    paddingBottom: theme.spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  modalCloseBtn: {
    padding: theme.spacing.xs,
  },
  modalCloseText: {
    ...theme.typography.h2,
    color: theme.colors.textSecondary,
  },
  modalScroll: {
    maxHeight: '100%',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalOptionSelected: {
    backgroundColor: theme.colors.primaryLight || `${theme.colors.primary}15`,
  },
  modalOptionText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  modalOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  modalCheckmark: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
  noCodeBtn: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.xs,
  },
  noCodeText: {
    ...theme.typography.bodySmall,
    color: theme.colors.secondary,
  },
  footer: {
    height: theme.spacing.xl,
  },
});

export default RegisterScreen;