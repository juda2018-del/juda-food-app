 importScripts(
  "https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyB8sjJEn2meAPdYDsLn9RjLoQ3d51dsqa0",
  authDomain: "juda-food-app.firebaseapp.com",
  projectId: "juda-food-app",
  storageBucket: "juda-food-app.firebasestorage.app",
  messagingSenderId: "309377324974",
  appId: "1:309377324974:web:0ee974f1cb046f04281a3f",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "FUSE";
  const options = {
    body: payload.notification?.body || "لديك إشعار جديد",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
  };

  self.registration.showNotification(title, options);
});