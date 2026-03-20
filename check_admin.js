const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, limit, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAzEJrrXj3r8ky_6BRHFq_OAxHKykxosNE",
  authDomain: "faithtrack-c4e84.firebaseapp.com",
  projectId: "faithtrack-c4e84",
  storageBucket: "faithtrack-c4e84.firebasestorage.app",
  messagingSenderId: "500036289065",
  appId: "1:500036289065:web:3343139a856b58eca31238",
  measurementId: "G-18WE31QRKF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAdmin() {
  console.log('--- Checking Admin Status ---');
  
  try {
    // 1. Check Onboarding Flag
    const onboardingDoc = await getDoc(doc(db, 'system', 'onboarding'));
    if (onboardingDoc.exists()) {
      console.log('System Status:', onboardingDoc.data());
    } else {
      console.log('System Status: Document "system/onboarding" not found.');
    }

    // 2. Check Users Collection for Admin Role
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('role', '==', 'admin'), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const admin = snapshot.docs[0].data();
      console.log('Admin Found:', {
        displayName: admin.displayName,
        email: admin.email,
        userId: admin.userId
      });
    } else {
      console.log('No Admin Registered in User collection.');
    }
  } catch (error) {
    console.error('Error querying Firestore:', error.message);
    if (error.message.includes('permission-denied')) {
        console.log('\nNOTE: If you get "permission-denied", it might be because the rules require a login.');
    }
  }
}

checkAdmin().then(() => process.exit());
