import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { createGroup, joinGroup } from '../services/firestoreService';
import { logOut } from '../services/authService';
import { PlusCircle, Users, ArrowRight, LogOut, ChevronLeft } from 'lucide-react-native';

const GroupScreen = () => {
  const { t } = useTranslation();
  const { user, userData, setUserData } = useAuth();
  const [code, setCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);

  // Correctly identify admin role from userData
  const isAdmin = userData?.role === 'admin';

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    }
  };

  const handleCreate = async () => {
    if (!groupName) {
      Alert.alert(t('common.error'), t('group.enterName'));
      return;
    }
    setLoading(true);
    try {
      const inviteCode = await createGroup(user!.uid, groupName);
      
      // Update local state to trigger navigation change in AppNavigator
      if (userData) {
        setUserData({
          ...userData,
          groupId: inviteCode
        });
      }
      
      Alert.alert(t('common.success'), `${t('group.inviteCode')}: ${inviteCode}`);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!code) {
      Alert.alert(t('common.error'), t('group.enterCode'));
      return;
    }
    setLoading(true);
    try {
      await joinGroup(user!.uid, code.toUpperCase());
      
      // Update local state to trigger navigation change
      if (userData) {
        setUserData({
          ...userData,
          groupId: code.toUpperCase()
        });
      }
      
      Alert.alert(t('common.success'), t('group.joinSuccess'));
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header with Logout Button */}
      <View style={styles.headerBar}>
        <Text style={styles.headerLogo}>FaithTrack</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={18} color={theme.colors.error} style={{ marginRight: 6 }} />
          <Text style={styles.logoutText}>{t('common.logout')}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.infoSection}>
            <Text style={styles.headerTitle}>{isAdmin ? t('group.createGroup') : t('group.joinGroup')}</Text>
            <Text style={styles.headerSubtitle}>ወደ መንፈሳዊ ቡድንዎ ለመቀላቀል የመጨረሻው እርምጃ</Text>
          </View>
          
          {/* ONLY show Join Group card if User is NOT an Admin */}
          {!isAdmin && userData && (
            <View style={styles.card}>
              <View style={[styles.cardHeader, { backgroundColor: theme.colors.primary }]}>
                <Users size={28} color="#fff" />
                <Text style={styles.cardHeaderText}>{t('group.joinGroup')}</Text>
              </View>
              
              <View style={styles.cardBody}>
                <Text style={styles.cardSubtitle}>{t('group.enterCode')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="XXXXXX"
                  value={code}
                  onChangeText={setCode}
                  autoCapitalize="characters"
                  maxLength={6}
                  placeholderTextColor={theme.colors.textSecondary}
                />
                
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: theme.colors.primary }]} 
                  onPress={handleJoin}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Text style={styles.buttonText}>{t('group.join')}</Text>
                      <ArrowRight size={20} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Create Group card - Essential for Admins */}
          <View style={[styles.card, (!isAdmin && userData) && { marginTop: theme.spacing.lg }]}>
            <View style={[styles.cardHeader, { backgroundColor: theme.colors.secondary }]}>
              <PlusCircle size={28} color="#fff" />
              <Text style={styles.cardHeaderText}>{t('group.createGroup')}</Text>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.cardSubtitle}>{t('group.groupName')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('group.groupName')}
                value={groupName}
                onChangeText={setGroupName}
                placeholderTextColor={theme.colors.textSecondary}
              />
              
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: theme.colors.secondary }]} 
                onPress={handleCreate}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.buttonText}>{t('group.create')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLogo: {
    fontSize: 20,
    fontFamily: 'NotoSansEthiopic_700Bold',
    color: theme.colors.primary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: theme.colors.error,
    fontFamily: 'NotoSansEthiopic_700Bold',
    fontSize: 14,
  },
  content: {
    padding: theme.spacing.lg,
    flexGrow: 1,
  },
  infoSection: {
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'NotoSansEthiopic_700Bold',
    color: theme.colors.text,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSansEthiopic_400Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.xl,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  cardHeaderText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'NotoSansEthiopic_700Bold',
    marginLeft: 10,
  },
  cardBody: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSansEthiopic_700Bold',
    color: theme.colors.text,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: '#F8FAFC',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontFamily: 'NotoSansEthiopic_400Regular',
    fontSize: 16,
    marginBottom: theme.spacing.lg,
    color: theme.colors.text,
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'NotoSansEthiopic_700Bold',
    marginRight: theme.spacing.xs,
  },
});

export default GroupScreen;
