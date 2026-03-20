import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Switch,
  Alert,
  SafeAreaView
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { submitActivity } from '../services/firestoreService';
import { BookOpen, Church, Target, FileText, Check } from 'lucide-react-native';
import { format } from 'date-fns';

const ActivityForm = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { user, userData } = useAuth();
  const [prayer, setPrayer] = useState(false);
  const [bible, setBible] = useState(false);
  const [prostrations, setProstrations] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await submitActivity(user!.uid, userData!.groupId!, {
        prayer,
        bibleReading: bible,
        prostrations,
        notes
      });
      Alert.alert(t('common.success'), t('form.done'));
      navigation.goBack();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('dashboard.myStatus')}</Text>
        <Text style={styles.headerDate}>{format(new Date(), 'dd/MM/yyyy')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconLabel}>
              <Church size={24} color={theme.colors.primary} />
              <Text style={styles.label}>{t('form.prayer')}</Text>
            </View>
            <Switch
              value={!!prayer}
              onValueChange={setPrayer}
              trackColor={{ false: '#CBD5E1', true: theme.colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.iconLabel}>
              <BookOpen size={24} color={theme.colors.accent} />
              <Text style={styles.label}>{t('form.bible')}</Text>
            </View>
            <Switch
              value={!!bible}
              onValueChange={setBible}
              trackColor={{ false: '#CBD5E1', true: theme.colors.accent }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.iconLabel}>
              <Target size={24} color={theme.colors.secondary} />
              <Text style={styles.label}>{t('form.prostrations')}</Text>
            </View>
            <Switch
              value={!!prostrations}
              onValueChange={setProstrations}
              trackColor={{ false: '#CBD5E1', true: theme.colors.secondary }}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.iconLabel}>
            <FileText size={24} color={theme.colors.textSecondary} />
            <Text style={styles.label}>{t('form.notes')}</Text>
          </View>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={4}
            placeholder="..."
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleSubmit}
          disabled={!!loading}
        >
          <Check size={24} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.submitText}>{loading ? t('common.loading') : t('form.submit')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'NotoSansEthiopic_700Bold',
    color: theme.colors.primary,
  },
  headerDate: {
    fontSize: 14,
    fontFamily: 'NotoSansEthiopic_400Regular',
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 18,
    fontFamily: 'NotoSansEthiopic_400Regular',
    marginLeft: theme.spacing.md,
    color: theme.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 10,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    fontFamily: 'NotoSansEthiopic_400Regular',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    height: 60,
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  submitText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'NotoSansEthiopic_700Bold',
  },
});

export default ActivityForm;
