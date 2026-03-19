import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Replace these with your Firebase project configuration
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
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);

export default app;
