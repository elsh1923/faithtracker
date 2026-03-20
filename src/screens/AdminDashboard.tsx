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
  Platform,
  TextInput,
  ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getGroupMembers, createGroup, joinGroup, getGroupInfo, getMemberHistory } from '../services/firestoreService';
import { logOut } from '../services/authService';
import { Users, ChevronRight, LogOut, Copy, RefreshCw, Shield, PlusCircle, ArrowRight, UserPlus, Target } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { startOfDay, parseISO, differenceInDays, isValid } from 'date-fns';

const parseSafeDate = (val: any) => {
  if (!val) return new Date();
  if (val && typeof val === 'object' && val.seconds !== undefined) {
    return new Date(val.seconds * 1000);
  }
  if (typeof val === 'string') {
    const parsed = parseISO(val);
    return isValid(parsed) ? parsed : new Date();
  }
  const d = new Date(val);
  return isValid(d) ? d : new Date();
};

const AdminDashboard = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { user, userData, setUserData } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState<'CHOICE' | 'CREATE' | 'JOIN'>('CHOICE');
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (userData?.groupId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [userData?.groupId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const gInfo = await getGroupInfo(userData!.groupId!);
      setGroupInfo(gInfo);
      const membersData = await getGroupMembers(userData!.groupId!);
      
      const enrichedMembers = await Promise.all(membersData.map(async (m) => {
        const history = await getMemberHistory(m.id);
        const phaseCount = gInfo ? calculatePhaseCount(gInfo.createdAt, history) : 0;
        return { ...m, phaseCount };
      }));
      
      setMembers(enrichedMembers);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculatePhaseCount = (groupCreatedAt: any, userHistory: any[]) => {
    const start = startOfDay(parseSafeDate(groupCreatedAt));
    const today = startOfDay(new Date());
    const daysSinceStart = differenceInDays(today, start);
    const currentPhaseIndex = Math.floor(daysSinceStart / 14);
    const phaseStart = new Date(start.getTime() + currentPhaseIndex * 14 * 24 * 60 * 60 * 1000);
    
    return userHistory.filter(item => {
      const itemDate = parseSafeDate(item.timestamp);
      return itemDate >= phaseStart && itemDate <= today;
    }).length;
  };

  const handleCreateGroup = async () => {
    if (!groupName) {
      Alert.alert(t('common.error'), t('group.enterName'));
      return;
    }
    setActionLoading(true);
    try {
      const code = await createGroup(user!.uid, groupName);
      if (userData) {
        setUserData({ ...userData, groupId: code, role: 'admin' });
      }
      Alert.alert(t('common.success'), `${t('group.inviteCode')}: ${code}`);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode) {
      Alert.alert(t('common.error'), t('group.enterCode'));
      return;
    }
    setActionLoading(true);
    try {
      await joinGroup(user!.uid, inviteCode.trim().toUpperCase());
      if (userData) {
        setUserData({ ...userData, groupId: inviteCode.trim().toUpperCase(), role: 'admin' });
      }
      Alert.alert(t('common.success'), t('group.joinSuccess'));
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const copyCode = async () => {
    await Clipboard.setStringAsync(userData!.groupId!);
    Alert.alert(t('common.success'), t('group.codeCopied'));
  };

  const renderMemberItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.memberCard} onPress={() => navigation.navigate('MemberDetails', { member: item })}>
      <View style={styles.memberInfo}>
        <View style={[styles.avatar, { backgroundColor: item.role === 'admin' ? theme.colors.secondary : theme.colors.primary }]}><Text style={styles.avatarText}>{item.displayName?.[0] || '?'}</Text></View>
        <View><Text style={styles.memberName}>{item.displayName}</Text><Text style={styles.memberEmail}>{item.email}</Text></View>
      </View>
      <View style={styles.cardRight}><View style={styles.phaseBadge}><Target size={12} color={theme.colors.secondary} /><Text style={styles.phaseCount}>{item.phaseCount}/14</Text></View><ChevronRight size={18} color="#CBD5E1" /></View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" /><View style={styles.header}><View><Text style={styles.greeting}>አስተዳዳሪ (Phase Review)</Text><Text style={styles.userName}>{userData?.displayName}</Text></View><TouchableOpacity style={styles.logoutBtn} onPress={logOut}><LogOut size={20} color={theme.colors.error} /></TouchableOpacity></View>
      {!userData?.groupId ? (
        <ScrollView contentContainerStyle={styles.setupContainer}>{setupMode === 'CHOICE' ? (<><Text style={styles.setupTitle}>ቡድኑን ያዋቅሩ</Text><ChoiceBtn icon={<PlusCircle size={28} color="#fff" />} title={t('group.createGroup')} desc="አዲስ መንፈሳዊ ቡድን ይፍጠሩ" color={theme.colors.secondary} onPress={() => setSetupMode('CREATE')} /><ChoiceBtn icon={<UserPlus size={28} color="#fff" />} title={t('group.joinGroup')} desc="በኮድ ወደ ሌላ ቡድን ይቀላቀሉ" color={theme.colors.primary} onPress={() => setSetupMode('JOIN')} /></>) : (
            <View style={styles.formCard}><TouchableOpacity onPress={() => setSetupMode('CHOICE')} style={styles.backBtn}><ArrowRight size={18} color={theme.colors.textSecondary} style={{transform: [{rotate: '180deg'}]}} /></TouchableOpacity><Text style={styles.formTitle}>{setupMode === 'CREATE' ? t('group.createGroup') : t('group.joinGroup')}</Text><TextInput style={styles.input} placeholder={setupMode === 'CREATE' ? t('group.groupName') : t('group.enterCode')} value={setupMode === 'CREATE' ? groupName : inviteCode} onChangeText={setupMode === 'CREATE' ? setGroupName : setInviteCode} placeholderTextColor="#94A3B8" autoFocus /><TouchableOpacity style={[styles.submitBtn, { backgroundColor: setupMode === 'CREATE' ? theme.colors.secondary : theme.colors.primary }]} onPress={setupMode === 'CREATE' ? handleCreateGroup : handleJoinGroup}>{actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{t('common.done')}</Text>}</TouchableOpacity></View>
          )}</ScrollView>
      ) : (
        <View style={{ flex: 1 }}><LinearGradient colors={[theme.colors.secondary, '#B47E3A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.inviteContainer}><View><Text style={styles.inviteLabel}>{t('group.inviteCode')}</Text><Text style={styles.inviteCode}>{userData?.groupId}</Text></View><TouchableOpacity style={styles.copyBtn} onPress={copyCode}><Copy size={20} color="#fff" /></TouchableOpacity></LinearGradient>
          <View style={styles.content}><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>የአባላት ክትትል (14-Day Totals)</Text><TouchableOpacity onPress={fetchData}><RefreshCw size={18} color={theme.colors.primary} /></TouchableOpacity></View>
            {loading ? <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} /> : (<FlatList data={members} renderItem={renderMemberItem} keyExtractor={item => item.id} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.emptyText}>{t('common.noData')}</Text>} refreshing={!!loading} onRefresh={fetchData} />)}</View>
        </View>
      )}
    </SafeAreaView>
  );
};

const ChoiceBtn = ({ icon, title, desc, color, onPress }: any) => (
  <TouchableOpacity style={[styles.choiceBtn, { backgroundColor: color }]} onPress={onPress}>
    <View style={styles.choiceIcon}>{icon}</View><View><Text style={styles.choiceTitle}>{title}</Text><Text style={styles.choiceDesc}>{desc}</Text></View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { padding: theme.spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  greeting: { fontSize: 10, fontFamily: 'NotoSansEthiopic_700Bold', color: theme.colors.secondary, textTransform: 'uppercase' },
  userName: { fontSize: 24, fontFamily: 'NotoSansEthiopic_700Bold', color: theme.colors.text },
  logoutBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  setupContainer: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  setupTitle: { fontSize: 28, fontFamily: 'NotoSansEthiopic_700Bold', color: theme.colors.text, textAlign: 'center', marginBottom: 30 },
  choiceBtn: { flexDirection: 'row', alignItems: 'center', padding: 24, borderRadius: 24, marginBottom: 16, elevation: 4 },
  choiceIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  choiceTitle: { fontSize: 20, fontFamily: 'NotoSansEthiopic_700Bold', color: '#fff' },
  choiceDesc: { fontSize: 13, fontFamily: 'NotoSansEthiopic_400Regular', color: 'rgba(255,255,255,0.8)' },
  formCard: { backgroundColor: '#fff', padding: 30, borderRadius: 30, elevation: 10 },
  formTitle: { fontSize: 22, fontFamily: 'NotoSansEthiopic_700Bold', color: theme.colors.text, marginBottom: 20, textAlign: 'center' },
  backBtn: { marginBottom: 10 },
  input: { height: 56, backgroundColor: '#F8FAFC', borderRadius: 15, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E2E8F0', fontFamily: 'NotoSansEthiopic_400Regular', fontSize: 18, textAlign: 'center', marginBottom: 20 },
  submitBtn: { height: 56, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 18, fontFamily: 'NotoSansEthiopic_700Bold' },
  inviteContainer: { margin: theme.spacing.lg, padding: 24, borderRadius: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 8 },
  inviteLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' },
  inviteCode: { fontSize: 32, fontFamily: 'NotoSansEthiopic_700Bold', color: '#fff', letterSpacing: 2 },
  copyBtn: { padding: 12, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
  content: { flex: 1, paddingHorizontal: theme.spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontFamily: 'NotoSansEthiopic_700Bold', color: theme.colors.text },
  list: { paddingBottom: 20 },
  memberCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 20, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  memberInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 22, fontFamily: 'NotoSansEthiopic_700Bold' },
  memberName: { fontSize: 16, fontFamily: 'NotoSansEthiopic_700Bold', color: theme.colors.text },
  memberEmail: { fontSize: 11, fontFamily: 'NotoSansEthiopic_400Regular', color: theme.colors.textSecondary },
  cardRight: { flexDirection: 'row', alignItems: 'center' },
  phaseBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, marginRight: 8, borderWidth: 1, borderColor: '#FED7AA' },
  phaseCount: { fontSize: 14, fontFamily: 'NotoSansEthiopic_700Bold', color: '#9A3412', marginLeft: 4 },
  emptyText: { textAlign: 'center', color: theme.colors.textSecondary, marginTop: 40 }
});

export default AdminDashboard;
