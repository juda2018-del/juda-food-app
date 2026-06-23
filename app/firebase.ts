 import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB8sjJEn2meAPdYDsLn9RjLoQ3d51dsqa0",
  authDomain: "juda-food-app.firebaseapp.com",
  projectId: "juda-food-app",
  storageBucket: "juda-food-app.firebasestorage.app",
  messagingSenderId: "309377324974",
  appId: "1:309377324974:web:0ee974f1cb046f04281a3f",
  measurementId: "G-H27FJ7XVJS",
};

export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);

export let messaging: any = null;

isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
});