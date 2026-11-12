import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/context/AuthContext';
import { ConfigProvider } from './src/context/ConfigContext';
import RootNavigator from './src/navigation/RootNavigator';
import { toastConfig } from './src/config/toastConfig';
import { theme } from './src/config/theme';
import { useOTAUpdate } from "./src/hooks/useOTAUpdate";


export default function App() {
  useOTAUpdate();
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <ConfigProvider>
          <AuthProvider>
            <StatusBar style="light" backgroundColor={theme.colors.primary} />
            <RootNavigator />
            <Toast config={toastConfig} />
          </AuthProvider>
        </ConfigProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
