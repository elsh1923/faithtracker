import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export const signUp = async (email: string, pass: string, name: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    
    // Hardcoded Admin logic:
    // 1. You can use a specific email: 'admin@faithtrack.org'
    // 2. OR the very first user who registers becomes the admin.
    const onboardingDoc = await getDoc(doc(db, 'system', 'onboarding'));
    const isFirstUser = !onboardingDoc.exists() || !onboardingDoc.data().adminCreated;
    const role = isFirstUser ? 'admin' : 'member';

    const userData = {
      userId: user.uid,
      email,
      displayName: name,
      role,
      groupId: null,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'users', user.uid), userData);
    
    if (role === 'admin') {
      await setDoc(doc(db, 'system', 'onboarding'), { adminCreated: true });
    }

    return userData;
  } catch (err: any) {
    throw new Error(err.message);
  }
};

export const login = async (email: string, pass: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    return userDoc.data();
  } catch (err: any) {
    throw new Error(err.message);
  }
};

export const logOut = async () => {
  await signOut(auth);
};
