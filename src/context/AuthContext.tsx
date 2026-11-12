import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { User } from '../types';
import { apiRequest } from '../config/api';
import Toast from 'react-native-toast-message';
import {
  signInWithGoogle,
  signInWithApple,
  signOutFirebase,
  configureGoogleSignIn,
} from '../services/firebaseService';

// ─── Types ────────────────────────────────────────────────

export interface LoginResult {
  success: boolean;
  needsEmailVerification?: boolean;
  email?: string;
}

interface RegisterData {
  nom: string;
  prenom: string;
  telephone?: string;
  email?: string;
  otp_token?: string;
  password: string;
  password_confirmation: string;
  date_naissance?: string;
  type_permis: string;
  centre_examen_id?: number;
  code_parrainage: string;
}

interface RegisterResult {
  success: boolean;
  needsEmailVerification?: boolean;
  email?: string;
  // Inscription téléphone : token direct
  token?: string;
  user?: User;
}

interface CompleteProfileData {
  nom: string;
  prenom: string;
  telephone: string;
  type_permis: string;
  centre_examen_id?: number;
  code_parrainage: string;
  date_naissance?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsCompletion: boolean;
  // Classique
  login: (identifier: string, password: string) => Promise<LoginResult>;
  register: (data: RegisterData) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (user: User) => void;
  // OTP Email
  envoyerOtpEmail: (email: string) => Promise<boolean>;
  verifierOtpEmail: (email: string, code: string) => Promise<boolean>;
  envoyerOtpTelephone: (telephone: string, purpose: 'inscription' | 'recuperation') => Promise<boolean>;
  verifierOtpTelephone: (telephone: string, purpose: 'inscription' | 'recuperation', code: string) => Promise<string | null>;
  reinitialiserMotDePasseTelephone: (telephone: string, verificationToken: string, password: string, passwordConfirmation: string) => Promise<boolean>;
  // Social
  loginGoogle: () => Promise<boolean>;
  loginApple: () => Promise<boolean>;
  completerProfil: (data: CompleteProfileData) => Promise<boolean>;
  // Biométrie
  activerBiometrie: () => Promise<boolean>;
  loginBiometrie: () => Promise<boolean>;
  biometrieDisponible: boolean;
  biometrieActivee: boolean;
}

// ─── Clés SecureStore ─────────────────────────────────────
const KEY_TOKEN      = 'auth_token';
const KEY_BIO_ID     = 'bio_identifier';
const KEY_BIO_PWD    = 'bio_password';
const KEY_BIO_ACTIVE = 'biometrie_activee';

// ─── Contexte ─────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user,                setUser]                = useState<User | null>(null);
  const [token,               setToken]               = useState<string | null>(null);
  const [isLoading,           setIsLoading]           = useState(true);
  const [needsCompletion,     setNeedsCompletion]     = useState(false);
  const [biometrieDisponible, setBiometrieDisponible] = useState(false);
  const [biometrieActivee,    setBiometrieActivee]    = useState(false);

  useEffect(() => {
    configureGoogleSignIn();
    verifierBiometrie();
    loadStoredAuth();
  }, []);

  // ── Biométrie ─────────────────────────────────────────
  const verifierBiometrie = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled   = await LocalAuthentication.isEnrolledAsync();
    setBiometrieDisponible(compatible && enrolled);
    const activee = await SecureStore.getItemAsync(KEY_BIO_ACTIVE);
    setBiometrieActivee(activee === 'true');
  };

  // ── Session stockée ───────────────────────────────────
  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync(KEY_TOKEN);
      if (storedToken) {
        setToken(storedToken);
        await fetchUserProfile(storedToken);
      }
    } catch (error) {
      console.error('Erreur chargement auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await apiRequest<{ success: boolean; user: User }>(
        '/profil', { method: 'GET' }, authToken
      );
      if (response.success) {
        setUser(response.user);
        setNeedsCompletion(!response.user.profil_complet);
      }
    } catch (error: any) {
      if (error.status === 401) await logout();
    }
  };

  const sauvegarderSession = async (newToken: string, newUser: User) => {
    await SecureStore.setItemAsync(KEY_TOKEN, newToken);
    setToken(newToken);
    setUser(newUser);
    setNeedsCompletion(!newUser.profil_complet);
  };

  const sauvegarderCredentialsBio = async (identifier: string, password: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(KEY_BIO_ID,  identifier);
      await SecureStore.setItemAsync(KEY_BIO_PWD, password);
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled   = await LocalAuthentication.isEnrolledAsync();
      if (compatible && enrolled) {
        await SecureStore.setItemAsync(KEY_BIO_ACTIVE, 'true');
        setBiometrieDisponible(true);
        setBiometrieActivee(true);
      }
    } catch { /* non bloquant */ }
  };

  const supprimerCredentialsBio = async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(KEY_BIO_ID);
      await SecureStore.deleteItemAsync(KEY_BIO_PWD);
    } catch { /* silencieux */ }
  };

  // =========================================================
  // LOGIN CLASSIQUE
  // =========================================================

  const login = async (identifier: string, password: string): Promise<LoginResult> => {
    try {
      const isEmail = identifier.includes('@');
      const body    = isEmail
        ? { email: identifier, password }
        : { telephone: identifier, password };

      const response = await apiRequest<{
        success: boolean;
        message: string;
        user?: User;
        token?: string;
        needs_email_verification?: boolean;
        email?: string;
      }>('/connexion', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      // ── Succès ────────────────────────────────────────
      if (response.success && response.token && response.user) {
        await sauvegarderSession(response.token, response.user);
        await sauvegarderCredentialsBio(identifier, password);
        Toast.show({
          type: 'success',
          text1: 'Connexion réussie',
          text2: `Bienvenue ${response.user.prenom} !`,
        });
        return { success: true };
      }

      // ── Email non vérifié → OTP mail ──────────────────
      if (response.needs_email_verification) {
        Toast.show({
          type: 'warning',
          text1: 'Email non vérifié',
          text2: 'Vérifiez votre boîte mail pour le code',
        });
        return {
          success: false,
          needsEmailVerification: true,
          email: response.email ?? identifier,
        };
      }

      // ── Échec générique ───────────────────────────────
      Toast.show({
        type: 'error',
        text1: 'Échec de la connexion',
        text2: response.message || 'Identifiants incorrects',
      });
      return { success: false };

    } catch (error: any) {
      const msg = error?.errors
        ? Object.values(error.errors as Record<string, string[]>).flat().join('\n')
        : error?.message || 'Identifiants incorrects';
      Toast.show({ type: 'error', text1: 'Erreur de connexion', text2: msg });
      return { success: false };
    }
  };

  // =========================================================
  // REGISTER
  // =========================================================

  const register = async (data: RegisterData): Promise<RegisterResult> => {
    try {
      const response = await apiRequest<{
        success: boolean;
        message: string;
        errors?: Record<string, string[]>;
        user?: User;
        token?: string;
        needs_email_verification?: boolean;
        email?: string;
      }>('/inscription', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.success) {
        const msg = response.errors
          ? Object.values(response.errors).flat().join('\n')
          : response.message || "Échec de l'inscription";
        Toast.show({ type: 'error', text1: 'Échec', text2: msg });
        return { success: false };
      }

      // ── Inscription téléphone : token direct ──────────
      if (response.token && response.user) {
        await sauvegarderSession(response.token, response.user);
        await sauvegarderCredentialsBio(data.telephone!, data.password);
        Toast.show({
          type: 'success',
          text1: 'Inscription réussie',
          text2: `Bienvenue ${response.user.prenom} !`,
        });
        return { success: true, token: response.token, user: response.user };
      }

      // ── Inscription email : OTP envoyé ────────────────
      if (response.needs_email_verification) {
        Toast.show({
          type: 'info',
          text1: 'Vérifiez votre boîte mail',
          text2: 'Un code à 6 chiffres vous a été envoyé',
        });
        return {
          success: true,
          needsEmailVerification: true,
          email: response.email ?? data.email,
        };
      }

      return { success: true };

    } catch (error: any) {
      const msg = error?.errors
        ? Object.values(error.errors as Record<string, string[]>).flat().join('\n')
        : error?.message || 'Erreur';
      Toast.show({ type: 'error', text1: "Erreur d'inscription", text2: msg });
      return { success: false };
    }
  };

  // =========================================================
  // OTP EMAIL
  // =========================================================

  const envoyerOtpEmail = async (email: string): Promise<boolean> => {
    try {
      const response = await apiRequest<{ success: boolean; message: string }>(
        '/otp/email/envoyer',
        { method: 'POST', body: JSON.stringify({ email }) }
      );
      if (response.success) {
        Toast.show({ type: 'info', text1: 'Code envoyé', text2: 'Vérifiez votre boîte mail' });
      } else {
        Toast.show({ type: 'error', text1: response.message || 'Erreur envoi OTP' });
      }
      return response.success;
    } catch {
      Toast.show({ type: 'error', text1: "Impossible d'envoyer le code" });
      return false;
    }
  };

  const verifierOtpEmail = async (email: string, code: string): Promise<boolean> => {
    try {
      const response = await apiRequest<{
        success: boolean;
        message: string;
        token?: string;
        user?: User;
      }>('/otp/email/verifier', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });

      if (response.success && response.token && response.user) {
        await sauvegarderSession(response.token, response.user);
        Toast.show({ type: 'success', text1: 'Email vérifié !', text2: `Bienvenue ${response.user.prenom} !` });
        return true;
      }

      Toast.show({ type: 'error', text1: response.message || 'Code invalide ou expiré' });
      return false;

    } catch {
      Toast.show({ type: 'error', text1: 'Erreur de vérification' });
      return false;
    }
  };

  const envoyerOtpTelephone = async (
    telephone: string,
    purpose: 'inscription' | 'recuperation'
  ): Promise<boolean> => {
    try {
      const response = await apiRequest<{ success: boolean; message: string }>(
        '/otp/telephone/envoyer',
        { method: 'POST', body: JSON.stringify({ telephone, purpose }) }
      );
      if (!response.success) {
        Toast.show({ type: 'error', text1: 'Envoi impossible', text2: response.message });
        return false;
      }
      Toast.show({ type: 'success', text1: 'Code envoyé', text2: 'Consultez vos messages WhatsApp' });
      return true;
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Envoi impossible',
        text2: error?.message || 'Impossible d’envoyer le code sur WhatsApp.',
      });
      return false;
    }
  };

  const verifierOtpTelephone = async (
    telephone: string,
    purpose: 'inscription' | 'recuperation',
    code: string
  ): Promise<string | null> => {
    try {
      const response = await apiRequest<{
        success: boolean;
        message?: string;
        verification_token?: string;
      }>('/otp/telephone/verifier', {
        method: 'POST',
        body: JSON.stringify({ telephone, purpose, code }),
      });
      if (response.success && response.verification_token) {
        return response.verification_token;
      }
      Toast.show({ type: 'error', text1: 'Code invalide', text2: response.message || 'Code invalide ou expiré.' });
      return null;
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Vérification impossible',
        text2: error?.message || 'Le code est invalide ou expiré.',
      });
      return null;
    }
  };

  const reinitialiserMotDePasseTelephone = async (
    telephone: string,
    verificationToken: string,
    password: string,
    passwordConfirmation: string
  ): Promise<boolean> => {
    try {
      const response = await apiRequest<{ success: boolean; message: string }>(
        '/mot-de-passe/reinitialiser',
        {
          method: 'POST',
          body: JSON.stringify({
            telephone,
            verification_token: verificationToken,
            password,
            password_confirmation: passwordConfirmation,
          }),
        }
      );
      if (response.success) {
        Toast.show({ type: 'success', text1: 'Mot de passe modifié', text2: 'Vous pouvez vous connecter.' });
        return true;
      }
      Toast.show({ type: 'error', text1: 'Réinitialisation impossible', text2: response.message });
      return false;
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Réinitialisation impossible',
        text2: error?.message || 'Réessayez plus tard.',
      });
      return false;
    }
  };

  // =========================================================
  // SOCIAL LOGIN
  // =========================================================

  const socialLoginHandler = async (
    provider: 'google' | 'apple',
    getFirebaseToken: () => Promise<string>
  ): Promise<boolean> => {
    try {
      const firebaseToken = await getFirebaseToken();

      const response = await apiRequest<{
        success: boolean;
        message: string;
        token?: string;
        user?: User;
        needs_completion?: boolean;
      }>('/social-login', {
        method: 'POST',
        body: JSON.stringify({ firebase_token: firebaseToken, provider }),
      });

      if (response.success && response.token && response.user) {
        await sauvegarderSession(response.token, response.user);
        if (response.needs_completion) {
          setNeedsCompletion(true);
          Toast.show({ type: 'info', text1: 'Compte créé', text2: 'Complétez votre profil pour continuer' });
        } else {
          Toast.show({ type: 'success', text1: 'Connexion réussie' });
        }
        return true;
      }

      Toast.show({ type: 'error', text1: 'Connexion impossible', text2: response.message || 'Erreur inconnue' });
      return false;

    } catch (error: any) {
      if (error?.code === 'SIGN_IN_CANCELLED' || error?.message?.includes('cancel')) return false;
      Toast.show({ type: 'error', text1: 'Erreur', text2: error?.message || 'Connexion impossible' });
      return false;
    }
  };

  const loginGoogle = () => socialLoginHandler('google', signInWithGoogle);
  const loginApple  = () => socialLoginHandler('apple', signInWithApple);

  // =========================================================
  // COMPLÉTION PROFIL SOCIAL
  // =========================================================

  const completerProfil = async (data: CompleteProfileData): Promise<boolean> => {
    if (!token) return false;
    try {
      const response = await apiRequest<{
        success: boolean;
        message: string;
        user?: User;
      }>('/profil/completer', { method: 'POST', body: JSON.stringify(data) }, token);

      if (response.success && response.user) {
        setUser(response.user);
        setNeedsCompletion(false);
        Toast.show({ type: 'success', text1: 'Profil complété !' });
        return true;
      }

      Toast.show({ type: 'error', text1: response.message || 'Erreur' });
      return false;

    } catch (error: any) {
      const msg = error?.errors
        ? Object.values(error.errors as Record<string, string[]>).flat().join('\n')
        : error?.message || 'Erreur';
      Toast.show({ type: 'error', text1: 'Erreur', text2: msg });
      return false;
    }
  };

  // =========================================================
  // BIOMÉTRIE
  // =========================================================

  const activerBiometrie = async (): Promise<boolean> => {
    if (!biometrieDisponible) {
      Toast.show({ type: 'error', text1: 'Biométrie non disponible sur cet appareil' });
      return false;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirmez votre identité pour activer la biométrie',
      cancelLabel: 'Annuler',
    });
    if (result.success) {
      await SecureStore.setItemAsync(KEY_BIO_ACTIVE, 'true');
      setBiometrieActivee(true);
      Toast.show({ type: 'success', text1: 'Biométrie activée' });
      return true;
    }
    return false;
  };

  const loginBiometrie = async (): Promise<boolean> => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Utilisez votre empreinte digitale ou Face ID',
      cancelLabel: 'Annuler',
      fallbackLabel: 'Mot de passe',
    });

    if (!result.success) return false;

    const identifier = await SecureStore.getItemAsync(KEY_BIO_ID);
    const password   = await SecureStore.getItemAsync(KEY_BIO_PWD);

    if (!identifier || !password) {
      Toast.show({
        type: 'info',
        text1: 'Connexion manuelle requise',
        text2: 'Connectez-vous une fois avec votre mot de passe pour activer la biométrie',
      });
      return false;
    }

    const isEmail = identifier.includes('@');
    const body    = isEmail
      ? { email: identifier, password }
      : { telephone: identifier, password };

    try {
      const response = await apiRequest<{
        success: boolean;
        message: string;
        user?: User;
        token?: string;
      }>('/connexion', { method: 'POST', body: JSON.stringify(body) });

      if (response.success && response.token && response.user) {
        await sauvegarderSession(response.token, response.user);
        Toast.show({ type: 'success', text1: 'Connexion réussie', text2: `Bienvenue ${response.user.prenom} !` });
        return true;
      }

      await supprimerCredentialsBio();
      Toast.show({ type: 'error', text1: 'Identifiants invalides', text2: 'Veuillez vous reconnecter avec votre mot de passe' });
      return false;

    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Erreur de connexion', text2: error?.message || 'Vérifiez votre connexion internet' });
      return false;
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = async () => {
    try {
      if (token) await apiRequest('/deconnexion', { method: 'POST' }, token);
      await signOutFirebase();
    } catch { /* silencieux */ } finally {
      await SecureStore.deleteItemAsync(KEY_TOKEN);
      setToken(null);
      setUser(null);
      setNeedsCompletion(false);
      Toast.show({ type: 'info', text1: 'À bientôt !' });
    }
  };

  const refreshUser = async () => { if (token) await fetchUserProfile(token); };
  const updateUser  = (u: User) => setUser(u);

  // =========================================================
  // PROVIDER
  // =========================================================

  return (
    <AuthContext.Provider
      value={{
        user, token, isLoading, needsCompletion,
        isAuthenticated: !!user && !!token,
        login, register, logout, refreshUser, updateUser,
        envoyerOtpEmail, verifierOtpEmail,
        envoyerOtpTelephone, verifierOtpTelephone, reinitialiserMotDePasseTelephone,
        loginGoogle, loginApple, completerProfil,
        activerBiometrie, loginBiometrie,
        biometrieDisponible, biometrieActivee,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};