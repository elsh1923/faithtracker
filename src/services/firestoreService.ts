import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  orderBy, 
  limit, 
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from './firebase';
import { nanoid } from 'nanoid/non-secure'; // Compact and faster for small codes

export const createGroup = async (adminId: string, groupName: string) => {
  const inviteCode = nanoid(6).toUpperCase(); // Short, uppercase for readability
  const groupRef = doc(db, 'groups', inviteCode);
  
  const groupData = {
    name: groupName,
    adminId,
    inviteCode,
    members: [adminId],
    createdAt: serverTimestamp()
  };
  
  await setDoc(groupRef, groupData);
  
  // Link the group to the admin's user doc
  await updateDoc(doc(db, 'users', adminId), {
    groupId: inviteCode
  });
  
  return inviteCode;
};

export const joinGroup = async (userId: string, inviteCode: string) => {
  const groupRef = doc(db, 'groups', inviteCode);
  const groupDoc = await getDoc(groupRef);
  
  if (!groupDoc.exists()) {
    throw new Error('Invalid Group Code');
  }
  
  // Add user to members list
  await updateDoc(groupRef, {
    members: arrayUnion(userId)
  });
  
  // Link the group to the user's user doc
  await updateDoc(doc(db, 'users', userId), {
    groupId: inviteCode
  });
  
  return groupDoc.data();
};

export const submitActivity = async (userId: string, groupId: string, data: any) => {
  const activityCollection = collection(db, 'activities');
  const activityData = {
    userId,
    groupId,
    prayer: data.prayer,
    bibleReading: data.bibleReading,
    fasting: data.fasting,
    notes: data.notes || '',
    date: serverTimestamp(),
    timestamp: new Date().toISOString()
  };
  
  await addDoc(activityCollection, activityData);
};

export const getMemberHistory = async (userId: string) => {
  const activityCollection = collection(db, 'activities');
  const q = query(
    activityCollection, 
    where('userId', '==', userId), 
    orderBy('date', 'desc'),
    limit(30)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getGroupMembers = async (groupId: string) => {
  const usersCollection = collection(db, 'users');
  const q = query(usersCollection, where('groupId', '==', groupId));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getMemberStatusForAdmin = async (userId: string) => {
  const activityCollection = collection(db, 'activities');
  const q = query(
    activityCollection, 
    where('userId', '==', userId), 
    orderBy('date', 'desc'),
    limit(10)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
export const hasAnyAdmin = async () => {
  try {
    // 1. Try public onboarding doc (anyone can read this)
    const onboardingDoc = await getDoc(doc(db, 'system', 'onboarding'));
    
    if (onboardingDoc.exists()) {
      return onboardingDoc.data().adminCreated === true;
    }
    
    // 2. If doc doesn't exist yet, it means NO admin has EVER registered.
    return false;
  } catch (e) {
    // 3. On ANY permission error or network failure, we hide the sensitive link 
    // by returning true (assuming an admin exists) to be safe.
    console.warn('Admin check secured:', e);
    return true;
  }
};
