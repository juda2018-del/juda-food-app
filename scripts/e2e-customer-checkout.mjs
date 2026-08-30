#!/usr/bin/env node
/**
 * Customer checkout E2E via Firebase client SDK (same path as cart page).
 * Creates a real order + restaurant notification — no fake success.
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB8sjJEn2meAPdYDsLn9RjLoQ3d51dsqa0",
  authDomain: "juda-food-app.firebaseapp.com",
  projectId: "juda-food-app",
  storageBucket: "juda-food-app.firebasestorage.app",
  messagingSenderId: "309377324974",
  appId: "1:309377324974:web:0ee974f1cb046f04281a3f",
};

const email = process.env.FUSE_E2E_EMAIL || "fuse.e2e.launch.083026@gmail.com";
const password = process.env.FUSE_E2E_PASSWORD || "FuseLaunch2026!";

async function main() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const cred = await signInWithEmailAndPassword(auth, email, password);
  const user = cred.user;
  console.log("LOGIN_OK", user.uid);

  const menuIds = ["fayrouz-makhlema", "fayrouz-tea", "fayrouz-kahi"];
  const items = [];
  let subtotal = 0;
  for (const id of menuIds) {
    const snap = await getDoc(doc(db, "menu", id));
    if (!snap.exists()) throw new Error(`menu missing: ${id}`);
    const data = snap.data();
    if (!data.available) throw new Error(`menu unavailable: ${id}`);
    subtotal += data.price;
    items.push({
      id,
      name: data.name,
      title: data.name,
      qty: 1,
      quantity: 1,
      price: data.price,
      category: data.category || "عام",
      restaurantId: data.restaurantId,
      restaurant: "فيروز",
    });
  }

  const deliveryFee = 2000;
  const total = subtotal + deliveryFee;
  const orderId = `FUSE-${Date.now().toString().slice(-8)}`;
  const orderRef = doc(collection(db, "orders"));
  const notificationRef = doc(collection(db, "notifications"));
  const batch = writeBatch(db);

  batch.set(orderRef, {
    orderId,
    customerUid: user.uid,
    customerEmail: user.email || "",
    customerName: "زبون FUSE E2E",
    customer: "زبون FUSE E2E",
    phone: "07701234567",
    customerPhone: "07701234567",
    address: "بغداد، المنصور، شارع 14",
    note: "E2E regression order",
    restaurant: "فيروز",
    restaurantName: "فيروز",
    restaurantId: "fayrouz",
    items,
    subtotal,
    deliveryFee,
    total,
    amount: total,
    currency: "IQD",
    paymentMethod: "cod",
    paymentStatus: "awaiting_delivery",
    status: "جديد",
    source: "e2e-script",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(notificationRef, {
    type: "order",
    audience: "restaurant",
    title: "طلب جديد",
    message: `وصل طلب جديد من زبون FUSE E2E بقيمة ${total.toLocaleString("en-US")} د.ع.`,
    customerUid: user.uid,
    restaurant: "فيروز",
    restaurantName: "فيروز",
    restaurantId: "fayrouz",
    phone: "07701234567",
    orderId,
    orderDocumentId: orderRef.id,
    read: false,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
  console.log("ORDER_OK", orderId, orderRef.id);

  const verify = await getDoc(orderRef);
  console.log("VERIFY", verify.data()?.orderId, verify.data()?.status, verify.data()?.total);
}

main().catch((error) => {
  console.error("E2E_FAIL", error.code || error.message || error);
  process.exit(1);
});
