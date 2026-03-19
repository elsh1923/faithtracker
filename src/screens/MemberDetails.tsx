import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { getMemberStatusForAdmin } from '../services/firestoreService';
import { format, parseISO } from 'date-fns';
import { History, Flame } from 'lucide-react-native';

const MemberDetails = ({ route }: any) => {
  const { member } = route.params;
  const { t } = useTranslation();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getMemberStatusForAdmin(member.userId);
      setHistory(data);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderHistoryItem = ({ item }: { item: any }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>{format(parseISO(item.timestamp), 'MMM dd, yyyy')}</Text>
      </View>
      <View style={styles.indicators}>
        <Indicator icon={<Flame size={12} color="#fff" />} label={t('form.prayer')} active={item.prayer} color={theme.colors.primary} />
        <Indicator icon={<Flame size={12} color="#fff" />} label={t('form.bible')} active={item.bibleReading} color={theme.colors.accent} />
        <Indicator icon={<Flame size={12} color="#fff" />} label={t('form.fasting')} active={item.fasting} color={theme.colors.secondary} />
      </View>
      {item.notes ? (
        <Text style={styles.cardNotes} numberOfLines={3}>{item.notes}</Text>
      ) : null}
    </View>
  );

  const Indicator = ({ label, active, color }: any) => (
    <View style={[styles.indicator, { backgroundColor: active ? color : '#E2E8F0' }]}>
      <Text style={[styles.indicatorText, { color: active ? '#fff' : '#64748B' }]}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.memberName}>{member.displayName}</Text>
        <Text style={styles.memberInfo}>{member.email}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{t('dashboard.history')}</Text>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={history}
            renderItem={renderHistoryItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.emptyText}>{t('common.noData')}</Text>}
          />
        )}
      </View>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  memberName: {
    fontSize: 24,
    fontFamily: 'NotoSansEthiopic_700Bold',
    color: theme.colors.text,
  },
  memberInfo: {
    fontSize: 14,
    fontFamily: 'NotoSansEthiopic_400Regular',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'NotoSansEthiopic_700Bold',
    color: theme.colors.text,
    marginVertical: theme.spacing.md,
  },
  list: {
    paddingBottom: 20,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: theme.spacing.xs,
  },
  cardDate: {
    fontSize: 14,
    fontFamily: 'NotoSansEthiopic_700Bold',
    color: theme.colors.text,
  },
  indicators: {
    flexDirection: 'row',
    gap: 8,
  },
  indicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  indicatorText: {
    fontSize: 12,
    fontFamily: 'NotoSansEthiopic_400Regular',
  },
  cardNotes: {
    fontSize: 13,
    fontFamily: 'NotoSansEthiopic_400Regular',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontFamily: 'NotoSansEthiopic_400Regular',
    color: theme.colors.textSecondary,
  }
});

export default MemberDetails;
