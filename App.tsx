import 'react-native-gesture-handler';
import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useFonts, NotoSansEthiopic_400Regular, NotoSansEthiopic_700Bold } from '@expo-google-fonts/noto-sans-ethiopic';
// Theme constants used directly in components
import * as SplashScreen from 'expo-splash-screen';
import './src/localization/i18n';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    NotoSansEthiopic_400Regular,
    NotoSansEthiopic_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  // Once fonts are loaded, hide splash screen
  SplashScreen.hideAsync();

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
