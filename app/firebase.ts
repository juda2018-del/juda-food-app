import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB8sjJEn2meAPdYDsLn9RjLoQ3d51dsqa0",
  authDomain: "juda-food-app.firebaseapp.com",
  projectId: "juda-food-app",
  storageBucket: "juda-food-app.firebasestorage.app",
  messagingSenderId: "309377324974",
  appId: "1:309377324974:web:0ee974f1cb046f04281a3f",
  measurementId: "G-H27FJ7XVJS",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);

// Keep the same customer session available to every page that imports this
// Firebase entry point, including the iOS/WebView screens for addresses and
// account data. If local persistence is unavailable Firebase will reject this
// call and continue with its supported fallback behavior.
void setPersistence(auth, browserLocalPersistence).catch(() => undefined);

export const storage = getStorage(app);

export let messaging: any = null;

isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
});
