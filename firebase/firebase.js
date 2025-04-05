import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAued4-UKDt2Za7Q9dRYcCk65VrmMcQLE8",
  authDomain: "salesinventoryapp-c4059.firebaseapp.com",
  projectId: "salesinventoryapp-c4059",
  storageBucket: "salesinventoryapp-c4059.firebasestorage.app", // O "salesinventoryapp-c4059.appspot.com" según convenga
  messagingSenderId: "833891372815",
  appId: "1:833891372815:android:81ef03925d4f11cd6d387a"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export { auth };
export const db = getFirestore(app);
