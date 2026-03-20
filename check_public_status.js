const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

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
  console.log('--- Checking Public Admin Status ---');
  
  try {
    const onboardingDoc = await getDoc(doc(db, 'system', 'onboarding'));
    if (onboardingDoc.exists()) {
      const data = onboardingDoc.data();
      console.log('Result:', data.adminCreated ? 'Admin ALREADY Registered ✅' : 'No Admin Registered yet ❌');
    } else {
      console.log('Result: Document "system/onboarding" does not exist yet. No admin registered. ❌');
    }
  } catch (error) {
    console.error('Permission Error:', error.message);
  }
}

checkAdmin().then(() => process.exit());
