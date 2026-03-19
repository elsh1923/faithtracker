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
import { getGroupMembers } from '../services/firestoreService';
import { logOut } from '../services/authService';
import { Users, ChevronRight, LogOut, Copy, RefreshCw, Shield } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';

const AdminDashboard = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { userData } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await getGroupMembers(userData!.groupId!);
      setMembers(data);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    await Clipboard.setStringAsync(userData!.groupId!);
    Alert.alert(t('common.success'), t('group.codeCopied'));
  };

  const renderMemberItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.memberCard} 
      onPress={() => navigation.navigate('MemberDetails', { member: item })}
    >
      <View style={styles.memberInfo}>
        <View style={[styles.avatar, { backgroundColor: item.role === 'admin' ? theme.colors.secondary : theme.colors.primary }]}>
          <Text style={styles.avatarText}>{item.displayName?.[0] || '?'}</Text>
        </View>
        <View>
          <Text style={styles.memberName}>{item.displayName}</Text>
          <Text style={styles.memberEmail}>{item.email}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        {item.role === 'admin' && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>
        )}
        <ChevronRight size={20} color="#CBD5E1" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>የአስተዳዳሪ ፓናል (Admin Panel)</Text>
          <Text style={styles.userName}>{userData?.displayName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logOut}>
          <LogOut size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={[theme.colors.secondary, '#B47E3A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.codeCard}
      >
        <View style={styles.codeInfo}>
          <View style={styles.codeIconContainer}>
            <Users size={24} color="#fff" />
          </View>
          <View style={styles.codeTextContainer}>
            <Text style={styles.codeLabel}>{t('group.inviteCode')}</Text>
            <Text style={styles.codeValue}>{userData?.groupId}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.copyBtn} onPress={copyCode}>
          <Copy size={20} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{members.length}</Text>
          <Text style={styles.statLabel}>ጠቅላላ አባላት</Text>
        </View>
        <View style={styles.statCard}>
          <Shield size={24} color={theme.colors.secondary} />
          <Text style={styles.statLabel}>ቡድን አስተዳዳሪ</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('dashboard.groupMembers')}</Text>
          <TouchableOpacity onPress={fetchMembers} disabled={loading}>
            <RefreshCw size={18} color={theme.colors.primary} style={loading ? { opacity: 0.5 } : {}} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={members}
            renderItem={renderMemberItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Users size={60} color="#CBD5E1" />
                <Text style={styles.emptyText}>{t('common.noData')}</Text>
              </View>
            }
            refreshing={!!loading}
            onRefresh={fetchMembers}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
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
    color: theme.colors.primary,
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
  codeCard: {
    margin: theme.spacing.lg,
    padding: 24,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: theme.colors.secondary,
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  codeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeTextContainer: {
    marginLeft: 15,
  },
  codeLabel: {
    fontSize: 12,
    fontFamily: 'NotoSansEthiopic_400Regular',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
  },
  codeValue: {
    fontSize: 28,
    fontFamily: 'NotoSansEthiopic_700Bold',
    color: '#fff',
    letterSpacing: 2,
  },
  copyBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    padding: 12,
    borderRadius: 15,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statNumber: {
    fontSize: 28,
    fontFamily: 'NotoSansEthiopic_700Bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'NotoSansEthiopic_400Regular',
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'NotoSansEthiopic_700Bold',
    color: theme.colors.text,
  },
  list: {
    paddingBottom: 20,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: theme.spacing.md,
    borderRadius: 18,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'NotoSansEthiopic_700Bold',
  },
  memberName: {
    fontSize: 16,
    fontFamily: 'NotoSansEthiopic_700Bold',
    color: theme.colors.text,
  },
  memberEmail: {
    fontSize: 12,
    fontFamily: 'NotoSansEthiopic_400Regular',
    color: theme.colors.textSecondary,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  adminBadgeText: {
    color: '#B45309',
    fontSize: 10,
    fontFamily: 'NotoSansEthiopic_700Bold',
    textTransform: 'uppercase',
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

export default AdminDashboard;
