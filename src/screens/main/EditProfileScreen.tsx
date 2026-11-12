import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { theme } from '../../config/theme';
import { useNavigation } from '@react-navigation/native';
import { apiRequest } from '../../config/api';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// ─── InputField (hors du composant pour éviter les re-renders) ────────────────
const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  editable = true,
  showPassword,
  onTogglePassword,
}: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={[styles.inputContainer, error && styles.inputError, !editable && styles.inputDisabledContainer]}>
      <View style={styles.inputIconWrap}>
        <Ionicons
          name={icon}
          size={18}
          color={error ? '#EF4444' : theme.colors.primary}
        />
      </View>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabledText]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        secureTextEntry={secureTextEntry && !showPassword}
        keyboardType={keyboardType}
        editable={editable}
      />
      {secureTextEntry && (
        <TouchableOpacity onPress={onTogglePassword} style={styles.eyeIcon}>
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      )}
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

// ─── ReadonlyRow ──────────────────────────────────────────────────────────────
const ReadonlyRow = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
  <View style={styles.readonlyRow}>
    <View style={styles.readonlyIconWrap}>
      <Ionicons name={icon} size={18} color={theme.colors.primary} />
    </View>
    <View style={styles.readonlyTextWrap}>
      <Text style={styles.readonlyLabel}>{label}</Text>
      <Text style={styles.readonlyValue}>{value}</Text>
    </View>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const EditProfileScreen = () => {
  const { user, token, refreshUser } = useAuth();
  const { lieuxPratique } = useConfig();
  const navigation = useNavigation<any>();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [nom, setNom] = useState(user?.nom || '');
  const [prenom, setPrenom] = useState(user?.prenom || '');
  const [telephone, setTelephone] = useState(user?.telephone || '');
  const [quartier, setQuartier] = useState(user?.quartier || '');
  const [typeCours, setTypeCours] = useState(user?.type_cours || 'en_ligne');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [selectedLieux, setSelectedLieux] = useState<number[]>(
    user?.lieuxPratique?.map((l: any) => l.id) || []
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const getPermisLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      permis_a: 'Type A (Moto)',
      permis_b: 'Type B (Véhicules légers)',
      permis_t: 'Type T (Tracteur)',
    };
    return labels[type] || type;
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!prenom.trim()) newErrors.prenom = 'Le prénom est requis';
    if (!telephone.trim()) {
      newErrors.telephone = 'Le téléphone est requis';
    } else if (telephone.trim().length < 9) {
      newErrors.telephone = 'Numéro de téléphone invalide';
    }
    if (password) {
      if (password.length < 6)
        newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      if (password !== passwordConfirmation)
        newErrors.passwordConfirmation = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Erreur de validation',
        text2: 'Veuillez corriger les erreurs indiquées',
      });
      return;
    }

    setIsLoading(true);
    try {
      const updateData: any = {
        nom: nom.trim(),
        prenom: prenom.trim(),
        telephone: telephone.trim(),
        quartier: quartier.trim(),
        type_cours: typeCours,
        lieux_pratique: selectedLieux,
      };
      if (password) updateData.password = password;

      const response = await apiRequest<{ success: boolean; message: string; user: any }>(
        '/profil',
        { method: 'PUT', body: JSON.stringify(updateData) },
        token
      );

      if (response.success) {
        await refreshUser();
        Toast.show({
          type: 'success',
          text1: 'Profil mis à jour',
          text2: 'Vos modifications ont été enregistrées',
        });
        navigation.goBack();
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible de mettre à jour le profil',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLieuPratique = (lieuId: number) => {
    setSelectedLieux(prev =>
      prev.includes(lieuId) ? prev.filter(id => id !== lieuId) : [...prev, lieuId]
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier le profil</Text>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Informations personnelles ── */}
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          <View style={styles.card}>
            <InputField
              label="Nom"
              value={nom}
              onChangeText={setNom}
              placeholder="Votre nom"
              icon="person-outline"
              error={errors.nom}
            />
            <InputField
              label="Prénom"
              value={prenom}
              onChangeText={setPrenom}
              placeholder="Votre prénom"
              icon="person-outline"
              error={errors.prenom}
            />
            <InputField
              label="Téléphone"
              value={telephone}
              onChangeText={setTelephone}
              placeholder="690123456"
              icon="call-outline"
              keyboardType="phone-pad"
              error={errors.telephone}
            />
            <InputField
              label="Quartier"
              value={quartier}
              onChangeText={setQuartier}
              placeholder="Votre quartier"
              icon="location-outline"
              error={errors.quartier}
            />
          </View>

          {/* ── Préférences de formation ── */}
          <Text style={styles.sectionTitle}>Préférences de formation</Text>
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Type de cours théorique</Text>
            <View style={styles.pickerContainer}>
              <Ionicons
                name="school-outline"
                size={18}
                color={theme.colors.primary}
                style={styles.pickerIcon}
              />
              <Picker
                selectedValue={typeCours}
                onValueChange={value => setTypeCours(value)}
                style={styles.picker}
              >
                <Picker.Item label="En ligne" value="en_ligne" />
                <Picker.Item label="En présentiel (Samedi)" value="presentiel" />
                <Picker.Item label="En ligne & Présentiel" value="les_deux" />
              </Picker>
            </View>
          </View>

          {/* ── Lieux de pratique ── */}
          {lieuxPratique && lieuxPratique.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Lieux de pratique</Text>
              <View style={styles.card}>
                <Text style={styles.hintText}>
                  Sélectionnez vos lieux de pratique
                </Text>
                {lieuxPratique.map((lieu: any, index: number) => (
                  <React.Fragment key={lieu.id}>
                    <TouchableOpacity
                      style={styles.checkboxRow}
                      onPress={() => toggleLieuPratique(lieu.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          selectedLieux.includes(lieu.id) && styles.checkboxActive,
                        ]}
                      >
                        {selectedLieux.includes(lieu.id) && (
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        )}
                      </View>
                      <View style={styles.lieuInfo}>
                        <Text style={styles.lieuNom}>{lieu.nom}</Text>
                        {lieu.adresse ? (
                          <Text style={styles.lieuAdresse}>{lieu.adresse}</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                    {index < lieuxPratique.length - 1 && <View style={styles.divider} />}
                  </React.Fragment>
                ))}
              </View>
            </>
          )}

          {/* ── Sécurité ── */}
          <Text style={styles.sectionTitle}>Sécurité</Text>
          <View style={styles.card}>
            <Text style={styles.hintText}>
              Laissez vide si vous ne souhaitez pas modifier votre mot de passe
            </Text>
            <InputField
              label="Nouveau mot de passe"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              icon="lock-closed-outline"
              secureTextEntry
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(v => !v)}
              error={errors.password}
            />
            <InputField
              label="Confirmer le mot de passe"
              value={passwordConfirmation}
              onChangeText={setPasswordConfirmation}
              placeholder="••••••••"
              icon="lock-closed-outline"
              secureTextEntry
              showPassword={showPasswordConfirm}
              onTogglePassword={() => setShowPasswordConfirm(v => !v)}
              error={errors.passwordConfirmation}
            />
          </View>

          {/* ── Informations non modifiables ── */}
          <Text style={styles.sectionTitle}>Informations non modifiables</Text>
          <View style={styles.card}>
            <ReadonlyRow
              icon="car-outline"
              label="TYPE DE PERMIS"
              value={getPermisLabel(user.type_permis)}
            />
            {user.session && (
              <>
                <View style={styles.divider} />
                <ReadonlyRow
                  icon="calendar-outline"
                  label="SESSION D'EXAMEN"
                  value={user.session.nom}
                />
              </>
            )}
            <View style={styles.divider} />
            <ReadonlyRow
              icon="ribbon-outline"
              label="VAGUE"
              value={`Vague ${user.vague}`}
            />
          </View>

          {/* ── Bouton Enregistrer ── */}
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark || theme.colors.primary]}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                  <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#6B7280' },

  // Header — identique au ProfileScreen
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
  },
  headerBtn: { width: 36, padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: 8, paddingBottom: 24 },

  // Section title — identique au ProfileScreen
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    marginHorizontal: 16,
    marginTop: 12,
  },

  // Card — identique au ProfileScreen
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  divider: { height: 1, backgroundColor: '#F3F4F6' },

  // Input
  inputGroup: { paddingVertical: 12 },
  inputLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  inputError: { borderColor: '#EF4444' },
  inputDisabledContainer: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  inputIconWrap: {
    width: 40,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  inputDisabledText: { color: '#9CA3AF' },
  eyeIcon: { paddingHorizontal: 12 },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4, marginLeft: 2 },

  // Picker
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
    overflow: 'hidden',
  },
  pickerIcon: { marginLeft: 12 },
  picker: { flex: 1, height: 50 },

  // Hint text
  hintText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    paddingTop: 8,
    paddingBottom: 4,
  },

  // Checkbox lieux
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  lieuInfo: { flex: 1 },
  lieuNom: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
  lieuAdresse: { fontSize: 13, color: '#6B7280' },

  // Readonly rows — style identique aux InfoRow du ProfileScreen
  readonlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  readonlyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  readonlyTextWrap: { flex: 1 },
  readonlyLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  readonlyValue: { fontSize: 15, fontWeight: '600', color: '#111827' },

  // Save button
  saveButton: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  saveButtonDisabled: { opacity: 0.65 },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default EditProfileScreen;