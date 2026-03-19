import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getMemberHistory } from '../services/firestoreService';
import { logOut } from '../services/authService';
import { Flame, Plus, History, LogOut, Heart, Calendar } from 'lucide-react-native';
import { format, differenceInDays, parseISO } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

const DashboardScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { user, userData } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getMemberHistory(user!.uid);
      setHistory(data);
      calculateStreak(data);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (data: any[]) => {
    if (data.length === 0) return setStreak(0);
    
    let currentStreak = 0;
    const sorted = [...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    let lastDate = new Date();
    for (let i = 0; i < sorted.length; i++) {
        const itemDate = parseISO(sorted[i].timestamp);
        const diff = differenceInDays(lastDate, itemDate);
        
        if (diff <= 1) {
            currentStreak++;
            lastDate = itemDate;
        } else {
            break;
        }
    }
    setStreak(currentStreak);
  };

  const renderHistoryItem = ({ item }: { item: any }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <View style={styles.dateBadge}>
          <Calendar size={14} color={theme.colors.primary} />
          <Text style={styles.cardDate}>{format(parseISO(item.timestamp), 'MMM dd, yyyy')}</Text>
        </View>
        <History size={16} color={theme.colors.textSecondary} />
      </View>
      <View style={styles.indicators}>
        <Indicator label={t('form.prayer')} active={item.prayer} color={theme.colors.primary} />
        <Indicator label={t('form.bible')} active={item.bibleReading} color={theme.colors.accent} />
        <Indicator label={t('form.fasting')} active={item.fasting} color={theme.colors.secondary} />
      </View>
      {item.notes ? (
        <Text style={styles.cardNotes} numberOfLines={2}>{item.notes}</Text>
      ) : null}
    </View>
  );

  const Indicator = ({ label, active, color }: any) => (
    <View style={[styles.indicator, { backgroundColor: active ? color : '#F1F5F9', borderColor: active ? color : '#E2E8F0', borderWidth: 1 }]}>
      <Text style={[styles.indicatorText, { color: active ? '#fff' : '#64748B' }]}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>ዕለታዊ ቼከር (Daily Checker)</Text>
          <Text style={styles.userName}>{userData?.displayName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logOut}>
          <LogOut size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={[theme.colors.primary, '#1e1b4b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.streakContainer}
      >
        <View style={styles.streakInfo}>
          <View style={styles.streakIconCircle}>
            <Flame size={32} color={theme.colors.secondary} fill={theme.colors.secondary} />
          </View>
          <View style={styles.streakText}>
            <Text style={styles.streakNumber}>{streak}</Text>
            <Text style={styles.streakLabel}>{t('dashboard.streak')} ({t('dashboard.days')})</Text>
          </View>
        </View>
        <Heart size={40} color="rgba(255,255,255,0.2)" style={styles.bgIcon} />
      </LinearGradient>

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
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <History size={60} color="#CBD5E1" />
                <Text style={styles.emptyText}>{t('common.noData')}</Text>
              </View>
            }
            refreshing={!!loading}
            onRefresh={fetchHistory}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('DailyForm')}
      >
        <Plus size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  greeting: {
    fontSize: 12,
    fontFamily: 'NotoSansEthiopic_700Bold',
    color: theme.colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'NotoSansEthiopic_700Bold',
    color: theme.colors.text,
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakContainer: {
    margin: theme.spacing.lg,
    padding: theme.spacing.xl,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 10,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakText: {
    marginLeft: theme.spacing.lg,
  },
  streakNumber: {
    fontSize: 40,
    fontFamily: 'NotoSansEthiopic_700Bold',
    color: '#fff',
    lineHeight: 48,
  },
  streakLabel: {
    fontSize: 14,
    fontFamily: 'NotoSansEthiopic_400Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  bgIcon: {
    position: 'absolute',
    right: 20,
    top: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'NotoSansEthiopic_700Bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  list: {
    paddingBottom: 110,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cardDate: {
    fontSize: 14,
    fontFamily: 'NotoSansEthiopic_700Bold',
    color: theme.colors.text,
    marginLeft: 6,
  },
  indicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  indicator: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  indicatorText: {
    fontSize: 13,
    fontFamily: 'NotoSansEthiopic_700Bold',
  },
  cardNotes: {
    fontSize: 14,
    fontFamily: 'NotoSansEthiopic_400Regular',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.secondary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    fontFamily: 'NotoSansEthiopic_400Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  }
});

export default DashboardScreen;
