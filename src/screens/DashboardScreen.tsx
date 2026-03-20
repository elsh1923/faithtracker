import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { logOut } from '../services/authService';
import { addDailyCheckIn, getMemberHistory, getGroupInfo, getPhaseFeedback } from '../services/firestoreService';
import { 
  Calendar, 
  CheckCircle2, 
  Flame, 
  Trophy, 
  LogOut, 
  Heart, 
  BookOpen, 
  Users, 
  ChevronRight,
  TrendingUp,
  Target,
  MessageSquareQuote,
  Quote,
  Check
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format, startOfDay, parseISO, differenceInDays, isValid, isSameDay } from 'date-fns';

const parseSafeDate = (val: any) => {
  if (!val) return new Date();
  if (val && typeof val === 'object' && val.seconds !== undefined) return new Date(val.seconds * 1000);
  if (typeof val === 'string') {
    const parsed = parseISO(val);
    return isValid(parsed) ? parsed : new Date();
  }
  const d = new Date(val);
  return isValid(d) ? d : new Date();
};

const DashboardScreen = () => {
  const { t } = useTranslation();
  const { user, userData } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ streak: 0, total: 0, phaseCount: 0 });
  const [groupCreatedAt, setGroupCreatedAt] = useState<any>(null);
  const [phaseNote, setPhaseNote] = useState<string | null>(null);

  // Today's activities
  const [prayerChecked, setPrayerChecked] = useState(false);
  const [bibleChecked, setBibleChecked] = useState(false);
  const [prostrationsChecked, setProstrationsChecked] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user) return;
    try {
      const gInfo = await getGroupInfo(userData?.groupId || '');
      setGroupCreatedAt(gInfo?.createdAt);

      const rawData = await getMemberHistory(user.uid);
      const sortedHistory = rawData.sort((a, b) => 
        parseSafeDate(b.timestamp).getTime() - parseSafeDate(a.timestamp).getTime()
      );
      setHistory(sortedHistory);
      
      const streak = calculateStreak(sortedHistory);
      const phaseCount = gInfo ? calculatePhaseCount(gInfo.createdAt, sortedHistory) : 0;
      setStats({ streak, total: rawData.length, phaseCount });

      // Fetch admin note for current phase
      if (gInfo && userData?.groupId) {
        const start = startOfDay(parseSafeDate(gInfo.createdAt));
        const today = startOfDay(new Date());
        const daysSinceStart = differenceInDays(today, start);
        const currentPhaseIdx = Math.floor(daysSinceStart / 14);
        
        const noteData = await getPhaseFeedback(user.uid, userData.groupId, currentPhaseIdx);
        if (noteData) setPhaseNote(noteData.note);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (sortedHistory: any[]) => {
    if (sortedHistory.length === 0) return 0;
    
    let streak = 0;
    let currentDate = startOfDay(new Date());
    
    // Check if user has check-in today or yesterday to continue streak
    const lastCheckIn = startOfDay(parseSafeDate(sortedHistory[0].timestamp));
    if (differenceInDays(currentDate, lastCheckIn) > 1) return 0;

    for (let i = 0; i < sortedHistory.length; i++) {
      const itemDate = startOfDay(parseSafeDate(sortedHistory[i].timestamp));
      
      if (i === 0) {
        streak = 1;
        currentDate = itemDate;
        continue;
      }

      const diff = differenceInDays(currentDate, itemDate);
      if (diff === 1) {
        streak++;
        currentDate = itemDate;
      } else if (diff === 0) {
        continue; // Multiple entries on same day
      } else {
        break; // Streak broken
      }
    }
    return streak;
  };

  const calculatePhaseCount = (createdAt: any, userHistory: any[]) => {
    const start = startOfDay(parseSafeDate(createdAt));
    const today = startOfDay(new Date());
    const daysSinceStart = differenceInDays(today, start);
    const currentPhaseIndex = Math.floor(daysSinceStart / 14);
    
    // Calculate start of current 14-day cycle
    const phaseStart = new Date(start.getTime() + currentPhaseIndex * 14 * 24 * 60 * 60 * 1000);
    
    return userHistory.filter(item => {
      const itemDate = parseSafeDate(item.timestamp);
      return itemDate >= phaseStart && itemDate <= today;
    }).length;
  };

  const handleCheckIn = async () => {
    // Prevent double check-in for the same day
    const today = startOfDay(new Date());
    const alreadyChecked = history.some(item => isSameDay(parseSafeDate(item.timestamp), today));
    
    if (alreadyChecked) {
      Alert.alert(t('common.done'), "ለዛሬ አስመዝግበዋል። ነገ ተመልሰው ይምጡ!");
      return;
    }

    if (!prayerChecked && !bibleChecked && !prostrationsChecked) {
      Alert.alert(t('common.error'), "እባክዎን ቢያንስ አንድ ተግባር ይምረጡ");
      return;
    }

    setCheckingIn(true);
    try {
      await addDailyCheckIn(user!.uid, {
        prayer: prayerChecked,
        bible: bibleChecked,
        prostrations: prostrationsChecked
      });
      Alert.alert(t('common.success'), "የዛሬ ምዝገባዎ ተሳክቷል!");
      
      // Reset checks
      setPrayerChecked(false);
      setBibleChecked(false);
      setProstrationsChecked(false);
      
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setCheckingIn(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('common.welcome')}</Text>
            <Text style={styles.userName}>{userData?.displayName}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logOut}>
            <LogOut size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard 
            icon={<Flame size={24} color={theme.colors.secondary} />} 
            label={t('dashboard.streak')} 
            value={stats.streak} 
            unit="ቀን"
          />
          <StatCard 
            icon={<Trophy size={20} color="#10B981" />} 
            label={t('dashboard.total')} 
            value={stats.total} 
            unit="ጊዜ"
          />
        </View>

        {/* Phase Progress Card */}
        <LinearGradient
          colors={[theme.colors.primary, '#1E293B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.phaseCard}
        >
          <View style={styles.phaseHeader}>
            <Target size={24} color={theme.colors.secondary} />
            <Text style={styles.phaseTitle}>የ14 ቀን ዑደት ውጤት</Text>
          </View>
          <View style={styles.phaseProgressRow}>
            <Text style={styles.phaseProgressText}>{stats.phaseCount}/14</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${(stats.phaseCount / 14) * 100}%` }]} />
            </View>
          </View>
          <Text style={styles.phaseDesc}>የአስተዳዳሪ ግምገማ የሚካሄደው በየ14 ቀኑ ነው።</Text>
        </LinearGradient>

        {/* Admin Note Section */}
        {phaseNote && (
          <View style={styles.noteCard}>
            <LinearGradient
              colors={['#FFF7ED', '#FFEDD5']}
              style={styles.noteGradient}
            >
              <View style={styles.noteHeader}>
                <MessageSquareQuote size={20} color={theme.colors.secondary} />
                <Text style={styles.noteTitle}>ከአስተዳዳሪው የቀረበ ማበረታቻ</Text>
              </View>
              <View style={styles.noteContentRow}>
                <Quote size={24} color="rgba(180, 126, 58, 0.2)" style={styles.quoteIcon} />
                <Text style={styles.noteText}>{phaseNote}</Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Activity Checklist */}
        <View style={styles.checklistCard}>
          <Text style={styles.checklistTitle}>የዛሬ ተግባራት</Text>
          <ActivityCheck 
            icon={<Heart size={20} color={theme.colors.primary} />} 
            label={t('form.prayer')} 
            checked={prayerChecked} 
            onToggle={() => setPrayerChecked(!prayerChecked)} 
          />
          <ActivityCheck 
            icon={<BookOpen size={20} color={theme.colors.accent} />} 
            label={t('form.bible')} 
            checked={bibleChecked} 
            onToggle={() => setBibleChecked(!bibleChecked)} 
          />
          <ActivityCheck 
            icon={<Target size={20} color={theme.colors.secondary} />} 
            label={t('form.prostrations')} 
            checked={prostrationsChecked} 
            onToggle={() => setProstrationsChecked(!prostrationsChecked)} 
          />
        </View>

        <TouchableOpacity 
          style={styles.checkInBtn} 
          onPress={handleCheckIn}
          disabled={checkingIn}
        >
          <LinearGradient
            colors={[theme.colors.secondary, '#B47E3A']}
            style={styles.checkInGradient}
          >
            {checkingIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <CheckCircle2 size={24} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.checkInText}>{t('dashboard.checkIn')}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.history')}</Text>
          {history.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Calendar size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>{t('common.noData')}</Text>
            </View>
          ) : (
            history.map((item, index) => (
              <HistoryItem 
                key={item.id || index} 
                date={parseSafeDate(item.timestamp)} 
                activities={{
                  prayer: item.prayer,
                  bible: item.bibleReading,
                  prostrations: item.prostrations
                }}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const StatCard = ({ icon, label, value, unit }: any) => (
  <View style={styles.statCard}>
    <View style={styles.statIconContainer}>{icon}</View>
    <View>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statUnit}>{unit}</Text>
      </View>
    </View>
  </View>
);

const HistoryItem = ({ date, activities }: { date: Date, activities: any }) => (
  <View style={styles.historyItem}>
    <View style={styles.historyLeading}>
      <View style={styles.historyIcon}><CheckCircle2 size={16} color={theme.colors.secondary} /></View>
      <View>
        <Text style={styles.historyDate}>{format(date, 'MMM dd, yyyy')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.historyTime}>{format(date, 'hh:mm a')}</Text>
          <View style={styles.miniIcons}>
            {activities.prayer && <Heart size={10} color={theme.colors.primary} style={{marginLeft: 4}} />}
            {activities.bible && <BookOpen size={10} color={theme.colors.accent} style={{marginLeft: 4}} />}
            {activities.prostrations && <Target size={10} color={theme.colors.secondary} style={{marginLeft: 4}} />}
          </View>
        </View>
      </View>
    </View>
    <ChevronRight size={18} color="#94A3B8" />
  </View>
);

const ActivityCheck = ({ icon, label, checked, onToggle }: any) => (
  <TouchableOpacity style={styles.checkRow} onPress={onToggle}>
    <View style={styles.checkLabelContainer}>
      <View style={styles.checkIconBox}>{icon}</View>
      <Text style={styles.checkLabel}>{label}</Text>
    </View>
    <View style={[styles.checkBox, checked && styles.checkBoxActive]}>
      {checked && <Check size={16} color="#fff" />}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: theme.spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  greeting: { fontSize: 14, fontFamily: 'NotoSansEthiopic_400Regular', color: theme.colors.textSecondary },
  userName: { fontSize: 26, fontFamily: 'NotoSansEthiopic_700Bold', color: theme.colors.text },
  logoutBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { flex: 0.48, backgroundColor: '#fff', padding: 16, borderRadius: 24, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  statIconContainer: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statLabel: { fontSize: 11, fontFamily: 'NotoSansEthiopic_400Regular', color: theme.colors.textSecondary, textTransform: 'uppercase' },
  statValue: { fontSize: 20, fontFamily: 'NotoSansEthiopic_700Bold', color: theme.colors.text },
  statUnit: { fontSize: 11, marginLeft: 2, color: theme.colors.textSecondary },
  phaseCard: { padding: 24, borderRadius: 28, marginBottom: 20, elevation: 6 },
  phaseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  phaseTitle: { color: '#fff', fontSize: 16, fontFamily: 'NotoSansEthiopic_700Bold', marginLeft: 10 },
  phaseProgressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  phaseProgressText: { color: theme.colors.secondary, fontSize: 32, fontFamily: 'NotoSansEthiopic_700Bold', marginRight: 15 },
  progressBarContainer: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: theme.colors.secondary, borderRadius: 4 },
  phaseDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: 'NotoSansEthiopic_400Regular' },
  checkInBtn: { borderRadius: 20, overflow: 'hidden', elevation: 8, marginBottom: 30 },
  checkInGradient: { paddingVertical: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  checkInText: { color: '#fff', fontSize: 20, fontFamily: 'NotoSansEthiopic_700Bold' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontFamily: 'NotoSansEthiopic_700Bold', color: theme.colors.text, marginBottom: 15 },
  historyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 20, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  historyLeading: { flexDirection: 'row', alignItems: 'center' },
  historyIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  historyDate: { fontSize: 15, fontFamily: 'NotoSansEthiopic_700Bold', color: theme.colors.text },
  historyTime: { fontSize: 12, color: theme.colors.textSecondary },
  emptyContainer: { alignItems: 'center', marginTop: 30 },
  emptyText: { color: theme.colors.textSecondary, marginTop: 10 },
  noteCard: { marginBottom: 20, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#FED7AA' },
  noteGradient: { padding: 20 },
  noteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  noteTitle: { fontSize: 14, fontFamily: 'NotoSansEthiopic_700Bold', color: '#9A3412', marginLeft: 8 },
  noteContentRow: { flexDirection: 'row' },
  quoteIcon: { marginTop: -4, marginRight: 8 },
  noteText: { flex: 1, fontSize: 16, fontFamily: 'NotoSansEthiopic_400Regular', color: '#431407', lineHeight: 24, fontStyle: 'italic' },
  checklistCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, elevation: 4 },
  checklistTitle: { fontSize: 16, fontFamily: 'NotoSansEthiopic_700Bold', color: theme.colors.text, marginBottom: 15 },
  checkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  checkLabelContainer: { flexDirection: 'row', alignItems: 'center' },
  checkIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkLabel: { fontSize: 16, fontFamily: 'NotoSansEthiopic_400Regular', color: theme.colors.text },
  checkBox: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  checkBoxActive: { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary },
  miniIcons: { flexDirection: 'row', marginLeft: 10 },
});

export default DashboardScreen;
