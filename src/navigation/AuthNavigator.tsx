import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types';
import { theme } from '../config/theme';

import WelcomeScreen             from '../screens/auth/WelcomeScreen';
import LoginScreen               from '../screens/auth/LoginScreen';
import RegisterScreen            from '../screens/auth/RegisterScreen';
import OtpVerificationScreen     from '../screens/auth/OtpVerificationScreen';
import RegisterCompletionScreen  from '../screens/auth/RegisterCompletionScreen';
import ForgotPasswordScreen      from '../screens/auth/ForgotPasswordScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="Welcome"            component={WelcomeScreen} />
      <Stack.Screen name="Login"              component={LoginScreen} />
      <Stack.Screen name="Register"           component={RegisterScreen} />
      <Stack.Screen name="OtpVerification"    component={OtpVerificationScreen} />
      <Stack.Screen name="RegisterCompletion" component={RegisterCompletionScreen} />
      <Stack.Screen name="ForgotPassword"     component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;