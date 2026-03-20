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
import { getMemberHistory, getGroupInfo } from '../services/firestoreService';
import { logOut } from '../services/authService';
import { Flame, Plus, History, LogOut, Heart, Calendar, ArrowRight } from 'lucide-react-native';
import { format, differenceInDays, parseISO, startOfDay, isValid } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

const parseSafeDate = (val: any) => {
  if (!val) return new Date();
  // Firestore Timestamp
  if (val && typeof val === 'object' && val.seconds !== undefined) {
    return new Date(val.seconds * 1000);
  }
  // ISO String
  if (typeof val === 'string') {
    const parsed = parseISO(val);
    return isValid(parsed) ? parsed : new Date();
  }
  // Date object or other
  const d = new Date(val);
  return isValid(d) ? d : new Date();
};

const DashboardScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { user, userData } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [phaseStats, setPhaseStats] = useState({ currentDay: 0, completed: 0, total: 14 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const rawData = await getMemberHistory(user!.uid);
      const sortedData = (rawData as any[]).sort((a, b) => 
        parseSafeDate(b.timestamp).getTime() - parseSafeDate(a.timestamp).getTime()
      );
      
      setHistory(sortedData);
      calculateStreak(sortedData);
      
      const group = await getGroupInfo(userData!.groupId!);
      if (group) {
        calculatePhase(group.createdAt, sortedData);
      }
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculatePhase = (groupCreatedAt: any, userHistory: any[]) => {
    const start = startOfDay(parseSafeDate(groupCreatedAt));
    const today = startOfDay(new Date());
    const daysSinceStart = differenceInDays(today, start);
    
    const currentPhaseIndex = Math.floor(daysSinceStart / 14);
    const phaseStart = new Date(start.getTime() + currentPhaseIndex * 14 * 24 * 60 * 60 * 1000);
    const currentDayInPhase = (daysSinceStart % 14) + 1;
    
    const countInPhase = userHistory.filter(item => {
      const itemDate = parseSafeDate(item.timestamp);
      return itemDate >= phaseStart && itemDate <= today;
    }).length;

    setPhaseStats({
      currentDay: currentDayInPhase,
      completed: countInPhase,
      total: 14
    });
  };

  const calculateStreak = (data: any[]) => {
    if (data.length === 0) return setStreak(0);
    let currentStreak = 0;
    let lastDate = new Date();
    
    for (let i = 0; i < data.length; i++) {
        const itemDate = parseSafeDate(data[i].timestamp);
        const diff = differenceInDays(startOfDay(lastDate), startOfDay(itemDate));
        
        if (diff <= 1) {
            currentStreak++;
            lastDate = itemDate;
        } else break;
    }
    setStreak(currentStreak);
  };

  const renderHistoryItem = ({ item }: { item: any }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <View style={styles.dateBadge}>
          <Calendar size={14} color={theme.colors.primary} />
          <Text style={styles.cardDate}>{format(parseSafeDate(item.timestamp), 'MMM dd, yyyy')}</Text>
        </View>
        <History size={16} color={theme.colors.textSecondary} />
      </View>
      <View style={styles.indicators}>
        <Indicator label={t('form.prayer')} active={item.prayer} color={theme.colors.primary} />
        <Indicator label={t('form.bible')} active={item.bibleReading} color={theme.colors.accent} />
        <Indicator label={t('form.fasting')} active={item.fasting} color={theme.colors.secondary} />
      </View>
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
        <View><Text style={styles.greeting}>ዕለታዊ ቼከር (14-Day Cycle)</Text><Text style={styles.userName}>{userData?.displayName}</Text></View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logOut}><LogOut size={20} color={theme.colors.error} /></TouchableOpacity>
      </View>
      <View style={styles.statsRow}>
        <LinearGradient colors={[theme.colors.primary, '#1e1b4b']} style={styles.statCard}><Flame size={24} color={theme.colors.secondary} /><Text style={styles.statNum}>{streak}</Text><Text style={styles.statLab}>{t('dashboard.streak')}</Text></LinearGradient>
        <LinearGradient colors={[theme.colors.secondary, '#B47E3A']} style={styles.statCard}><Calendar size={24} color="#fff" /><Text style={styles.statNum}>{phaseStats.completed}/{phaseStats.total}</Text><Text style={styles.statLab}>Phase Day {phaseStats.currentDay}</Text></LinearGradient>
      </View>
      <View style={styles.content}>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{t('dashboard.history')}</Text><TouchableOpacity onPress={fetchData} disabled={loading}><History size={20} color={theme.colors.primary} /></TouchableOpacity></View>
        {loading ? <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} /> : <FlatList data={history} renderItem={renderHistoryItem} keyExtractor={item => item.id} contentContainerStyle={styles.list} ListEmptyComponent={<View style={styles.emptyContainer}><History size={60} color="#CBD5E1" /><Text style={styles.emptyText}>{t('common.noData')}</Text></View>} refreshing={!!loading} onRefresh={fetchData} showsVerticalScrollIndicator={false} />}
      </View>
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('DailyForm')}><Plus size={32} color="#fff" /></TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { padding: theme.spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  greeting: { fontSize: 10, fontFamily: 'NotoSansEthiopic_700Bold', color: theme.colors.primary, textTransform: 'uppercase' },
  userName: { fontSize: 24, fontFamily: 'NotoSansEthiopic_700Bold', color: theme.colors.text },
  logoutBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', padding: theme.spacing.lg, gap: 12 },
  statCard: { flex: 1, borderRadius: 24, padding: 20, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  statNum: { fontSize: 28, fontFamily: 'NotoSansEthiopic_700Bold', color: '#fff', marginTop: 10 },
  statLab: { fontSize: 12, fontFamily: 'NotoSansEthiopic_400Regular', color: 'rgba(255,255,255,0.7)' },
  content: { flex: 1, paddingHorizontal: theme.spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontFamily: 'NotoSansEthiopic_700Bold', color: theme.colors.text },
  list: { paddingBottom: 110 },
  historyCard: { backgroundColor: '#fff', borderRadius: 20, padding: theme.spacing.lg, marginBottom: theme.spacing.md, borderWidth: 1, borderColor: '#F1F5F9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  cardDate: { fontSize: 14, fontFamily: 'NotoSansEthiopic_700Bold', color: theme.colors.text, marginLeft: 6 },
  indicators: { flexDirection: 'row', gap: 8 },
  indicator: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  indicatorText: { fontSize: 13, fontFamily: 'NotoSansEthiopic_700Bold' },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 68, height: 68, borderRadius: 34, backgroundColor: theme.colors.secondary, justifyContent: 'center', alignItems: 'center', elevation: 10 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { marginTop: 15, fontSize: 14, fontFamily: 'NotoSansEthiopic_400Regular', color: theme.colors.textSecondary }
});

export default DashboardScreen;
