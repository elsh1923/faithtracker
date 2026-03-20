const { initializeApp } = require('firebase/app');
const { getFirestore, doc, deleteDoc, getDocs, collection, query, where } = require('firebase/firestore');

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

async function performReset() {
  console.log('--- Reseting Admin Overboard System ---');
  
  try {
    // 1. Force clear the onboarding document
    console.log('Flipping the reset switch in Firestore...');
    await deleteDoc(doc(db, 'system', 'onboarding'));
    console.log('✅ System Onboarding Flag DELETED (Unlocked)');

    // 2. Clear any admin from the users collection
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('role', '==', 'admin'));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        console.log(`Found ${snapshot.size} existing admin(s). Removing from record...`);
        for (const userDoc of snapshot.docs) {
            await deleteDoc(doc(db, 'users', userDoc.id));
        }
        console.log('✅ All existing admins removed from Firestore record.');
    } else {
        console.log('✅ No existing admins found in people list.');
    }

    console.log('\n--- RESET COMPLETE! ---');
    console.log('THE NEXT PERSON TO REGISTER ON YOUR APP SHOULD NOW AUTOMATICALLY BECOME THE ADMIN! 📱🛡️');
  } catch (error) {
    if (error.message.includes('permission-denied')) {
        console.error('\nPERMISSION ERROR 🔒');
        console.log('It looks like your CURRENT rules block this script from working if you aren\'t "logged in" as a developer.');
        console.log('Please go to the Firebase Console and delete the "system/onboarding" document manually if you can find it!');
    } else {
        console.error('Error during reset:', error.message);
    }
  }
}

performReset().then(() => process.exit());
