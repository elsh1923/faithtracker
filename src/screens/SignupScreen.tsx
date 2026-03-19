import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { signUp } from '../services/authService';
import { User, Mail, Lock, ChevronLeft, UserPlus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SignupScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // No more checking as admin is hardcoded
  }, []);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword || !name) {
      Alert.alert(t('common.error'), t('auth.emptyFields'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passMismatch'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('common.error'), t('auth.passwordRequirements'));
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient 
      colors={[theme.colors.primary, '#1e1b4b']} 
      style={styles.container}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={28} color="#fff" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <UserPlus size={40} color={theme.colors.secondary} />
            </View>
            <Text style={styles.title}>{t('auth.signup')}</Text>
            <Text style={styles.subtitle}>ወደ መንፈሳዊ ጉዞዎ እንኳን ደህና መጡ!</Text>
          </View>

          <View style={styles.form}>
            {/* Name */}
            <Text style={styles.label}>{t('auth.nameLabel')}</Text>
            <View style={styles.inputGroup}>
              <User size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.name')}
                value={name}
                onChangeText={setName}
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            {/* Email */}
            <Text style={styles.label}>{t('auth.email')}</Text>
            <View style={styles.inputGroup}>
              <Mail size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            {/* Password */}
            <Text style={styles.label}>{t('auth.passwordLabel')}</Text>
            <View style={styles.inputGroup}>
              <Lock size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
            <Text style={styles.helpText}>{t('auth.passwordRequirements')}</Text>

            {/* Confirm Password */}
            <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
            <View style={styles.inputGroup}>
              <Lock size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.confirmPassword')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <TouchableOpacity 
              style={styles.button} 
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t('auth.signup')}</Text>
              )}
            </TouchableOpacity>



            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              style={styles.loginLink}
            >
              <Text style={styles.linkText}>
                {t('auth.haveAccount')} <Text style={styles.linkAction}>{t('auth.loginInstead')}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  backButton: {
    marginTop: Platform.OS === 'ios' ? 40 : 20,
    marginBottom: 10,
    width: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 32,
    fontFamily: 'NotoSansEthiopic_700Bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'NotoSansEthiopic_400Regular',
    marginTop: 5,
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: 'NotoSansEthiopic_700Bold',
    color: theme.colors.text,
    marginBottom: 6,
    marginLeft: 4,
  },
  helpText: {
    fontSize: 12,
    fontFamily: 'NotoSansEthiopic_400Regular',
    color: theme.colors.textSecondary,
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 4,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
    paddingHorizontal: theme.spacing.sm,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    fontFamily: 'NotoSansEthiopic_400Regular',
    fontSize: 16,
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    height: 55,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'NotoSansEthiopic_700Bold',
  },
  adminLink: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  loginLink: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  linkText: {
    color: theme.colors.textSecondary,
    fontFamily: 'NotoSansEthiopic_400Regular',
    fontSize: 15,
  },
  linkAction: {
    color: theme.colors.primary,
    fontFamily: 'NotoSansEthiopic_700Bold',
  },
});

export default SignupScreen;
