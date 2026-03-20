import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useFonts, NotoSansEthiopic_400Regular, NotoSansEthiopic_700Bold } from '@expo-google-fonts/noto-sans-ethiopic';
import * as SplashScreen from 'expo-splash-screen';
import './src/localization/i18n';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    NotoSansEthiopic_400Regular,
    NotoSansEthiopic_700Bold,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current; 
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      // Small delay to simulate resource loading and look premium
      setTimeout(async () => {
        await SplashScreen.hideAsync();
        setAppReady(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200, // Smooth 1.2s fade in
          useNativeDriver: true,
        }).start();
      }, 500);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <View style={styles.container}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <AppNavigator />
        </Animated.View>
        {!appReady && <View style={styles.blankOverlay} />}
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Navy theme matches splash
  },
  blankOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
  }
});
