import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB8sjJEn2meAPdYDsLn9RjLoQ3d51dsqa0",
  authDomain: "juda-food-app.firebaseapp.com",
  projectId: "juda-food-app",
  storageBucket: "juda-food-app.firebasestorage.app",
  messagingSenderId: "309377324974",
  appId: "1:309377324974:web:0ee974f1cb046f04281a3f",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const fuseAuth = getAuth(app);
