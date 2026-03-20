import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { theme } from '../theme';

// Screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ActivityForm from '../screens/ActivityForm';
import GroupScreen from '../screens/GroupScreen';
import AdminDashboard from '../screens/AdminDashboard';
import MemberDetails from '../screens/MemberDetails';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : userData?.role === 'admin' ? (
          <>
            <Stack.Screen name="MainDashboard" component={AdminDashboard} />
            <Stack.Screen name="MemberDetails" component={MemberDetails} />
          </>
        ) : !userData?.groupId ? (
          <Stack.Screen name="GroupSetup" component={GroupScreen} />
        ) : (
          <>
            <Stack.Screen name="MainDashboard" component={DashboardScreen} />
            <Stack.Screen name="DailyForm" component={ActivityForm} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
