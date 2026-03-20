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
import { joinGroup } from '../services/firestoreService';
import { logOut } from '../services/authService';
import { LogOut, UserPlus, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const GroupScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { user, userData, setUserData } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!inviteCode) {
      Alert.alert(t('common.error'), t('group.enterCode'));
      return;
    }

    setLoading(true);
    try {
      await joinGroup(user!.uid, inviteCode.trim().toUpperCase());
      
      Alert.alert(
        t('common.success'), 
        t('group.joinSuccess'),
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Update local state ONLY after user clicks OK
              if (userData) {
                setUserData({
                  ...userData,
                  groupId: inviteCode.trim().toUpperCase()
                });
              }
            }
          }
        ]
      );
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <View style={styles.headerLogo}>
          <ShieldCheck size={28} color={theme.colors.primary} />
          <Text style={styles.headerText}>FaithTrack</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logOut}>
          <LogOut size={20} color={theme.colors.error} />
          <Text style={styles.logoutText}>{t('common.logout')}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>{t('group.joinGroup')}</Text>
            <Text style={styles.mainSubtitle}>መንፈሳዊ ቡድንዎን ለመቀላቀል እና እድገትዎን ለመከታተል የግብዣ ኮዱን ያስገቡ።</Text>
          </View>

          <View style={styles.cardContainer}>
             <LinearGradient
               colors={['#fff', '#F8FAFC']}
               style={styles.card}
             >
                <View style={styles.iconCircle}>
                  <UserPlus size={32} color={theme.colors.primary} />
                </View>
                
                <Text style={styles.cardTitle}>{t('group.enterCode')}</Text>
                <Text style={styles.cardDesc}>ከቡድን መሪዎ የተቀበሉትን ባለ 6 አሃዝ ኮድ እዚህ ያስገቡ።</Text>
                
                <TextInput
                  style={styles.input}
                  placeholder="EX: ABC123"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="characters"
                  maxLength={10}
                  placeholderTextColor="#CBD5E1"
                />
                
                <TouchableOpacity 
                  style={styles.button} 
                  onPress={handleJoin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>{t('group.join')}</Text>
                      <ArrowRight size={20} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
             </LinearGradient>
          </View>

          <View style={styles.footer}>
             <Text style={styles.footerText}>የቡድን ኮድ ከሌለዎት እባክዎን የአድሚን ፍቃድ ይጠይቁ።</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    height: 70,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 10,
    fontSize: 20,
    fontFamily: 'NotoSansEthiopic_700Bold',
    color: theme.colors.text,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  logoutText: {
    marginLeft: 6,
    color: theme.colors.error,
    fontFamily: 'NotoSansEthiopic_700Bold',
    fontSize: 14,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  titleSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 32,
    fontFamily: 'NotoSansEthiopic_700Bold',
    color: theme.colors.text,
    textAlign: 'center',
  },
  mainSubtitle: {
    fontSize: 15,
    fontFamily: 'NotoSansEthiopic_400Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  cardContainer: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: 'NotoSansEthiopic_700Bold',
    color: theme.colors.text,
  },
  cardDesc: {
    fontSize: 14,
    fontFamily: 'NotoSansEthiopic_400Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  input: {
    width: '100%',
    height: 60,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 15,
    paddingHorizontal: 20,
    fontSize: 24,
    fontFamily: 'NotoSansEthiopic_700Bold',
    color: theme.colors.primary,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 24,
  },
  button: {
    width: '100%',
    height: 60,
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'NotoSansEthiopic_700Bold',
    marginRight: 10,
  },
  footer: {
    marginTop: 40,
  },
  footerText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontFamily: 'NotoSansEthiopic_400Regular',
    paddingHorizontal: 20,
  }
});

export default GroupScreen;
