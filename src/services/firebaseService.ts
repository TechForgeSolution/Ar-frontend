import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';

// Appelez ceci dans App.tsx au démarrage
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: '255260256264-4ifmjc95sfe1lf8mhq1h89nb63gctr65.apps.googleusercontent.com', // ← remplacez ici
  });
};

export const signInWithGoogle = async (): Promise<string> => {
  await GoogleSignin.hasPlayServices();
  const userInfo = await GoogleSignin.signIn();
  const googleCredential = auth.GoogleAuthProvider.credential(
    userInfo.data?.idToken ?? ''
  );
  const userCredential = await auth().signInWithCredential(googleCredential);
  const firebaseToken = await userCredential.user.getIdToken();
  return firebaseToken;
};

export const signInWithApple = async (): Promise<string> => {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  const { identityToken } = credential;
  if (!identityToken) throw new Error('Apple identity token manquant');

  const appleCredential = auth.AppleAuthProvider.credential(identityToken);
  const userCredential = await auth().signInWithCredential(appleCredential);
  const firebaseToken = await userCredential.user.getIdToken();
  return firebaseToken;
};

export const signOutFirebase = async (): Promise<void> => {
  try {
    await auth().signOut();
    await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
  } catch {
    // Ignorer — l'utilisateur n'était peut-être pas connecté via Google
  }
};