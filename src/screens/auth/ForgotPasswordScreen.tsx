import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { theme } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Toast from 'react-native-toast-message';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'> };

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { requestPhoneOtp, verifyPhoneOtp, resetPassword } = useAuth();
  const [telephone, setTelephone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [step, setStep] = useState<'telephone' | 'code' | 'password'>('telephone');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (telephone.trim().length < 9) {
      Toast.show({ type: 'error', text1: 'Numéro WhatsApp invalide' });
      return;
    }

    setLoading(true);
    try {
      if (await requestPhoneOtp(telephone.trim(), 'recuperation')) {
        setStep('code');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      Toast.show({ type: 'error', text1: 'Saisissez le code à 6 chiffres reçu sur WhatsApp' });
      return;
    }

    setLoading(true);
    try {
      const token = await verifyPhoneOtp(telephone.trim(), code.trim(), 'recuperation');
      if (token) {
        setVerificationToken(token);
        setStep('password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!verificationToken) {
      Toast.show({ type: 'error', text1: 'Vérifiez d’abord votre numéro WhatsApp' });
      return;
    }
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Mot de passe trop court (min. 6 caractères)' });
      return;
    }
    if (password !== passwordConfirmation) {
      Toast.show({ type: 'error', text1: 'Les mots de passe ne correspondent pas' });
      return;
    }

    setLoading(true);
    try {
      if (await resetPassword(telephone.trim(), verificationToken, password, passwordConfirmation)) {
        navigation.navigate('Login');
      }
    } finally {
      setLoading(false);
    }
  };

  const requestAnotherCode = () => {
    setVerificationToken(null);
    setCode('');
    setStep('code');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Ionicons name="lock-open-outline" size={72} color={theme.colors.primary} />
          <Text style={styles.title}>Mot de passe oublié ?</Text>
          <Text style={styles.description}>
            Recevez un code de vérification sur le numéro WhatsApp associé à votre compte.
          </Text>

          <View style={styles.form}>
            <Input
              label="Numéro WhatsApp"
              placeholder="6XXXXXXXX"
              value={telephone}
              onChangeText={value => {
                setTelephone(value);
                setCode('');
                setVerificationToken(null);
                setStep('telephone');
              }}
              keyboardType="phone-pad"
              maxLength={15}
              editable={!loading && step === 'telephone'}
              leftIcon="logo-whatsapp"
            />

            {step !== 'telephone' && (
              <Input
                label="Code reçu sur WhatsApp"
                placeholder="Code à 6 chiffres"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading && step === 'code'}
                leftIcon="key-outline"
              />
            )}

            {step === 'password' && (
              <>
                <Input
                  label="Nouveau mot de passe"
                  placeholder="Min. 6 caractères"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                  leftIcon="lock-closed-outline"
                  editable={!loading}
                />
                <Input
                  label="Confirmer le mot de passe"
                  placeholder="Répétez le nouveau mot de passe"
                  value={passwordConfirmation}
                  onChangeText={setPasswordConfirmation}
                  isPassword
                  leftIcon="lock-closed-outline"
                  editable={!loading}
                />
              </>
            )}

            <Button
              title={loading
                ? 'Veuillez patienter...'
                : step === 'telephone'
                  ? 'Recevoir un code WhatsApp'
                  : step === 'code'
                    ? 'Vérifier le code'
                    : 'Réinitialiser le mot de passe'}
              onPress={step === 'telephone'
                ? handleSendCode
                : step === 'code'
                  ? handleVerifyCode
                  : handleResetPassword}
              loading={loading}
              disabled={loading}
              fullWidth
              size="large"
            />

            {step === 'code' && (
              <Button
                title="Renvoyer le code"
                onPress={handleSendCode}
                variant="outline"
                disabled={loading}
                fullWidth
                style={styles.secondaryButton}
              />
            )}

            {step === 'password' && (
              <Button
                title="Le code a expiré ? En recevoir un autre"
                onPress={requestAnotherCode}
                variant="outline"
                disabled={loading}
                fullWidth
                style={styles.secondaryButton}
              />
            )}

            <Button
              title="Retour à la connexion"
              onPress={() => navigation.navigate('Login')}
              variant="outline"
              fullWidth
              style={styles.secondaryButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginVertical: theme.spacing.lg,
  },
  form: { width: '100%' },
  secondaryButton: { marginTop: theme.spacing.md },
});

export default ForgotPasswordScreen;
