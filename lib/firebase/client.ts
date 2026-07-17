import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const fallbackConfig = {
  "apiKey": "AIzaSyB8sjJEn2meAPdYDsLn9RjLoQ3d51dsqa0",
  "authDomain": "juda-food-app.firebaseapp.com",
  "projectId": "juda-food-app",
  "storageBucket": "juda-food-app.firebasestorage.app",
  "messagingSenderId": "309377324974",
  "appId": "1:309377324974:web:0ee974f1cb046f04281a3f"
} as const;

function readEnv(name: string, fallback: string) {
  const value = process.env[name];
  if (!value || value === "undefined" || value === "null") return fallback;
  return value;
}

const firebaseConfig = {
  apiKey: readEnv("NEXT_PUBLIC_FIREBASE_API_KEY", fallbackConfig.apiKey),
  authDomain: readEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", fallbackConfig.authDomain),
  projectId: readEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", fallbackConfig.projectId),
  storageBucket: readEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", fallbackConfig.storageBucket),
  messagingSenderId: readEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", fallbackConfig.messagingSenderId),
  appId: readEnv("NEXT_PUBLIC_FIREBASE_APP_ID", fallbackConfig.appId),
};

const missing = Object.entries({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId,
}).filter(([, value]) => !value);

if (missing.length > 0) {
  throw new Error(
    "FUSE Firebase config missing: " + missing.map(([key]) => key).join(", ")
  );
}

export const firebaseApp: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const firebaseAuth: Auth = getAuth(firebaseApp);
