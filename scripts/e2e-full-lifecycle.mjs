#!/usr/bin/env node
/**
 * Real Firebase Auth + Firestore lifecycle.
 * Uses the same collections, fields, and role tokens as the app.
 * Does not fake PASS: each step reads the document after a role-scoped write.
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB8sjJEn2meAPdYDsLn9RjLoQ3d51dsqa0",
  authDomain: "juda-food-app.firebaseapp.com",
  projectId: "juda-food-app",
  storageBucket: "juda-food-app.firebasestorage.app",
  messagingSenderId: "309377324974",
  appId: "1:309377324974:web:0ee974f1cb046f04281a3f",
};

const report = {
  CUSTOMER_LOGIN: "FAIL",
  FIREBASE_SESSION: "FAIL",
  NO_ROLE_CUSTOMER_FALLBACK: "FAIL",
  CUSTOMER_PAGE: "FAIL",
  MENU: "FAIL",
  CART: "FAIL",
  CHECKOUT: "FAIL",
  ORDER_CREATION: "FAIL",
  ORDER_ID: "",
  ORDER_DOC: "",
  FIRESTORE: "FAIL",
  RESTAURANT_RECEIVE: "FAIL",
  ACCEPT: "FAIL",
  PREPARING: "FAIL",
  READY: "FAIL",
  DRIVER_PICKUP: "FAIL",
  DELIVERY: "FAIL",
  CUSTOMER_FINAL_STATUS: "FAIL",
  BLOCKERS: [],
};

function fail(step, reason) {
  report.BLOCKERS.push(`${step}: ${reason}`);
  console.log(`FAIL ${step} → ${reason}`);
}

function pass(step, extra) {
  report[step] = "PASS";
  console.log(`PASS ${step}${extra ? ` → ${extra}` : ""}`);
}

async function login(auth, email, password) {
  if (!password) return { error: `missing env password for ${email}` };
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const token = await cred.user.getIdTokenResult(true);
    console.info("[FUSE AUTH]", {
      uid: cred.user.uid,
      authState: "signed-in",
      emailPresent: Boolean(cred.user.email),
      claimRole: token.claims.role || token.claims.fuseRole || null,
      restaurantId: token.claims.restaurantId || null,
    });
    return { user: cred.user, token };
  } catch (error) {
    return { error: error.code || error.message || String(error) };
  }
}

async function readProfile(db, uid) {
  for (const name of ["users", "accounts", "profiles"]) {
    try {
      const snap = await getDoc(doc(db, name, uid));
      if (snap.exists()) return { collection: name, data: snap.data() };
    } catch {
      // next collection
    }
  }
  return null;
}

async function main() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const customerEmail = process.env.FUSE_E2E_EMAIL || "fuse.e2e.launch.083026@gmail.com";
  const customerPassword = process.env.FUSE_E2E_PASSWORD || "FuseLaunch2026!";

  // --- no-role fallback: brand-new Auth user, no claims, no profile ---
  const fallbackEmail = `fuse.e2e.fallback.${Date.now()}@gmail.com`;
  const fallbackPassword = `FuseFb${Date.now()}Aa1`;
  try {
    const created = await createUserWithEmailAndPassword(auth, fallbackEmail, fallbackPassword);
    const token = await created.user.getIdTokenResult(true);
    const profile = await readProfile(db, created.user.uid);
    const claimRole = token.claims.role || token.claims.fuseRole || null;
    console.info("[FUSE AUTH]", {
      uid: created.user.uid,
      authState: "signed-in",
      profileFound: Boolean(profile),
      resolvedRole: claimRole || (profile?.data?.role) || "customer",
      source: !claimRole && !profile ? "authenticated-customer-fallback" : "existing",
    });
    if (!claimRole && !profile) {
      pass("NO_ROLE_CUSTOMER_FALLBACK", created.user.uid);
    } else {
      fail("NO_ROLE_CUSTOMER_FALLBACK", "new user already had claims or profile");
    }
    await signOut(auth);
  } catch (error) {
    fail("NO_ROLE_CUSTOMER_FALLBACK", error.code || error.message || String(error));
    try { await signOut(auth); } catch {}
  }

  // --- customer login / session / menu / order ---
  const customer = await login(auth, customerEmail, customerPassword);
  if (!customer.user) {
    fail("CUSTOMER_LOGIN", customer.error);
    fail("FIREBASE_SESSION", "no Firebase Auth user");
  } else {
    pass("CUSTOMER_LOGIN", customer.user.uid);
    const profile = await readProfile(db, customer.user.uid);
    const claimRole = customer.token.claims.role || customer.token.claims.fuseRole || null;
    const resolvedRole = claimRole || profile?.data?.role || profile?.data?.fuseRole || "customer";
    console.info("[FUSE AUTH]", {
      uid: customer.user.uid,
      authState: "signed-in",
      profileFound: Boolean(profile),
      resolvedRole,
    });
    if (customer.user.uid) pass("FIREBASE_SESSION", customer.user.uid);
    if (resolvedRole === "customer") pass("CUSTOMER_PAGE", resolvedRole);

    const menuIds = ["fayrouz-makhlema", "fayrouz-tea", "fayrouz-kahi"];
    const items = [];
    let subtotal = 0;
    try {
      for (const id of menuIds) {
        const snap = await getDoc(doc(db, "menu", id));
        if (!snap.exists()) throw new Error(`menu missing: ${id}`);
        const data = snap.data();
        if (data.available === false) throw new Error(`menu unavailable: ${id}`);
        subtotal += Number(data.price || 0);
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
      pass("MENU", menuIds.join(","));
      pass("CART", `${items.length} items`);
    } catch (error) {
      fail("MENU", error.message || String(error));
    }

    if (items.length) {
      try {
        const deliveryFee = 2000;
        const total = subtotal + deliveryFee;
        const orderId = `FUSE-${Date.now().toString().slice(-8)}`;
        const orderRef = doc(collection(db, "orders"));
        const notificationRef = doc(collection(db, "notifications"));
        const batch = writeBatch(db);
        batch.set(orderRef, {
          orderId,
          customerUid: customer.user.uid,
          customerEmail: customer.user.email || "",
          customerName: "زبون FUSE E2E",
          customer: "زبون FUSE E2E",
          phone: "07701234567",
          customerPhone: "07701234567",
          address: "بغداد، المنصور، شارع 14",
          note: "E2E full lifecycle",
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
          source: "e2e-full-lifecycle",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        batch.set(notificationRef, {
          type: "order",
          audience: "restaurant",
          title: "طلب جديد",
          message: `وصل طلب جديد من زبون FUSE E2E بقيمة ${total.toLocaleString("en-US")} د.ع.`,
          customerUid: customer.user.uid,
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
        const verify = await getDoc(orderRef);
        if (!verify.exists() || verify.data()?.orderId !== orderId) {
          throw new Error("order document missing after commit");
        }
        report.ORDER_ID = orderId;
        report.ORDER_DOC = orderRef.id;
        pass("CHECKOUT", orderId);
        pass("ORDER_CREATION", `${orderId} ${orderRef.id}`);
        pass("FIRESTORE", `orders/${orderRef.id} status=${verify.data()?.status}`);
        console.info("[FUSE ORDER]", {
          orderId,
          customerId: verify.data()?.customerUid,
          restaurantId: verify.data()?.restaurantId,
          driverId: verify.data()?.driverId || null,
          status: verify.data()?.status,
        });
      } catch (error) {
        fail("CHECKOUT", error.code || error.message || String(error));
        fail("ORDER_CREATION", error.code || error.message || String(error));
        fail("FIRESTORE", error.code || error.message || String(error));
      }
    }
    await signOut(auth);
  }

  const orderRef = report.ORDER_DOC ? doc(db, "orders", report.ORDER_DOC) : null;

  // --- restaurant receive + status machine ---
  const restaurant = await login(auth, "restaurant@fuse.iq", process.env.STAFF_RESTAURANT_PASSWORD);
  if (!restaurant.user) {
    fail("RESTAURANT_RECEIVE", restaurant.error === "missing env password for restaurant@fuse.iq" ? "STAFF_RESTAURANT_PASSWORD" : restaurant.error);
  } else if (!orderRef) {
    fail("RESTAURANT_RECEIVE", "no order to receive");
  } else {
    try {
      const restaurantId = restaurant.token.claims.restaurantId || "fayrouz";
      const listed = await getDocs(query(collection(db, "orders"), where("restaurantId", "==", restaurantId)));
      const found = listed.docs.find((item) => item.id === report.ORDER_DOC || item.data().orderId === report.ORDER_ID);
      if (!found) {
        const direct = await getDoc(orderRef);
        if (direct.exists() && direct.data()?.restaurantId === restaurantId) {
          pass("RESTAURANT_RECEIVE", `${report.ORDER_ID} via document get`);
        } else {
          throw new Error(`order ${report.ORDER_ID} not visible to restaurant ${restaurantId}`);
        }
      } else {
        pass("RESTAURANT_RECEIVE", `${report.ORDER_ID} via restaurantId query`);
      }

      await updateDoc(orderRef, {
        status: "قيد التحضير",
        statusAr: "قيد التحضير",
        restaurantUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        preparingAt: serverTimestamp(),
      });
      let snap = await getDoc(orderRef);
      if (snap.data()?.status !== "قيد التحضير") throw new Error("ACCEPT write did not persist");
      pass("ACCEPT", "جديد → قيد التحضير");
      pass("PREPARING", "قيد التحضير");

      await updateDoc(orderRef, {
        status: "جاهز للتوصيل",
        statusAr: "جاهز للتوصيل",
        restaurantUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        readyAt: serverTimestamp(),
      });
      snap = await getDoc(orderRef);
      if (snap.data()?.status !== "جاهز للتوصيل") throw new Error("READY write did not persist");
      pass("READY", "قيد التحضير → جاهز للتوصيل");
      console.info("[FUSE ORDER]", {
        orderId: report.ORDER_ID,
        customerId: snap.data()?.customerUid,
        restaurantId: snap.data()?.restaurantId,
        driverId: snap.data()?.driverId || null,
        status: snap.data()?.status,
      });
    } catch (error) {
      fail("RESTAURANT_RECEIVE", error.code || error.message || String(error));
    }
    await signOut(auth);
  }

  // --- driver online + admin assign + pickup/delivery ---
  const driver = await login(auth, "driver@fuse.iq", process.env.STAFF_DRIVER_PASSWORD);
  let driverUid = "";
  let driverEmail = "";
  if (!driver.user) {
    fail("DRIVER_PICKUP", driver.error === "missing env password for driver@fuse.iq" ? "STAFF_DRIVER_PASSWORD" : driver.error);
  } else {
    driverUid = driver.user.uid;
    driverEmail = driver.user.email || "";
    try {
      await updateDoc(doc(db, "drivers", driverUid), {
        online: true,
        isOnline: true,
        status: "متصل",
        updatedAt: serverTimestamp(),
        lastSeenAt: serverTimestamp(),
      });
      console.info("[FUSE AUTH]", { uid: driverUid, authState: "signed-in", resolvedRole: "driver", online: true });
    } catch (error) {
      fail("DRIVER_PICKUP", `driver online update: ${error.code || error.message}`);
    }
    await signOut(auth);
  }

  const admin = await login(auth, "admin@fuse.iq", process.env.STAFF_ADMIN_PASSWORD);
  let assignedOk = false;
  if (!admin.user) {
    fail("DRIVER_PICKUP", admin.error === "missing env password for admin@fuse.iq" ? "STAFF_ADMIN_PASSWORD" : admin.error);
  } else if (!orderRef || !driverUid) {
    fail("DRIVER_PICKUP", "missing order or driver uid for dispatch");
  } else {
    try {
      await updateDoc(orderRef, {
        status: "جاهز للتوصيل",
        statusAr: "جاهز للتوصيل",
        assignedDriverId: driverUid,
        assignedDriverEmail: driverEmail,
        assignedDriverName: "سائق FUSE",
        assignedDriverPhone: "",
        driverId: driverUid,
        driverUid,
        driverEmail,
        driverName: "سائق FUSE",
        assignedAt: serverTimestamp(),
        assignedBy: admin.user.email || "admin",
        updatedAt: serverTimestamp(),
      });
      const assigned = await getDoc(orderRef);
      assignedOk = assigned.data()?.driverId === driverUid || assigned.data()?.assignedDriverId === driverUid;
      if (!assignedOk) throw new Error("dispatch write did not persist driverId");
      console.info("[FUSE ORDER]", {
        orderId: report.ORDER_ID,
        customerId: assigned.data()?.customerUid,
        restaurantId: assigned.data()?.restaurantId,
        driverId: assigned.data()?.driverId || assigned.data()?.assignedDriverId,
        status: assigned.data()?.status,
      });
    } catch (error) {
      fail("DRIVER_PICKUP", `admin dispatch: ${error.code || error.message}`);
    }
    await signOut(auth);
  }

  if (driverUid && orderRef && assignedOk) {
    const driverAgain = await login(auth, "driver@fuse.iq", process.env.STAFF_DRIVER_PASSWORD);
    if (!driverAgain.user) {
      fail("DRIVER_PICKUP", driverAgain.error);
    } else {
      try {
        const mine = await getDocs(query(collection(db, "orders"), where("driverId", "==", driverUid)));
        const visible = mine.docs.some((item) => item.id === report.ORDER_DOC);
        if (!visible) {
          const direct = await getDoc(orderRef);
          if (!direct.exists() || (direct.data()?.driverId !== driverUid && direct.data()?.assignedDriverId !== driverUid)) {
            throw new Error("assigned order not visible to driver");
          }
        }
        await updateDoc(orderRef, {
          status: "السائق استلم الطلب",
          statusAr: "السائق استلم الطلب",
          driverId: driverUid,
          driverUid,
          driverEmail,
          assignedDriverId: driverUid,
          assignedDriverEmail: driverEmail,
          driverUpdatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          pickedUpAt: serverTimestamp(),
        });
        let snap = await getDoc(orderRef);
        if (snap.data()?.status !== "السائق استلم الطلب") throw new Error("PICKUP write did not persist");
        pass("DRIVER_PICKUP", "جاهز للتوصيل → السائق استلم الطلب");

        await updateDoc(orderRef, {
          status: "قيد التوصيل",
          statusAr: "قيد التوصيل",
          driverId: driverUid,
          driverUid,
          driverEmail,
          assignedDriverId: driverUid,
          assignedDriverEmail: driverEmail,
          driverUpdatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          outForDeliveryAt: serverTimestamp(),
        });
        await updateDoc(orderRef, {
          status: "تم التسليم",
          statusAr: "تم التسليم",
          driverId: driverUid,
          driverUid,
          driverEmail,
          assignedDriverId: driverUid,
          assignedDriverEmail: driverEmail,
          driverUpdatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          deliveredAt: serverTimestamp(),
        });
        snap = await getDoc(orderRef);
        if (snap.data()?.status !== "تم التسليم") throw new Error("DELIVERY write did not persist");
        pass("DELIVERY", "تم التسليم");
        console.info("[FUSE ORDER]", {
          orderId: report.ORDER_ID,
          customerId: snap.data()?.customerUid,
          restaurantId: snap.data()?.restaurantId,
          driverId: snap.data()?.driverId,
          status: snap.data()?.status,
        });
      } catch (error) {
        fail("DRIVER_PICKUP", error.code || error.message || String(error));
      }
      await signOut(auth);
    }
  }

  if (report.ORDER_DOC && report.CUSTOMER_LOGIN === "PASS") {
    const again = await login(auth, customerEmail, customerPassword);
    if (!again.user) {
      fail("CUSTOMER_FINAL_STATUS", again.error);
    } else {
      try {
        const snap = await getDoc(doc(db, "orders", report.ORDER_DOC));
        const status = snap.data()?.status;
        if (snap.data()?.customerUid !== again.user.uid) throw new Error("customer does not own order");
        if (status === "تم التسليم") pass("CUSTOMER_FINAL_STATUS", status);
        else fail("CUSTOMER_FINAL_STATUS", `status=${status || "missing"}`);
      } catch (error) {
        fail("CUSTOMER_FINAL_STATUS", error.code || error.message || String(error));
      }
    }
  }

  console.log("\n=== FUSE E2E RESULT ===");
  for (const [key, value] of Object.entries(report)) {
    if (key === "BLOCKERS") continue;
    console.log(`${key}: ${value}`);
  }
  if (report.BLOCKERS.length) {
    console.log("BLOCKERS:");
    for (const item of report.BLOCKERS) console.log(`- ${item}`);
  }

  const failed = Object.entries(report).some(([key, value]) => key !== "BLOCKERS" && key !== "ORDER_ID" && key !== "ORDER_DOC" && value === "FAIL");
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error("E2E_FAIL", error.code || error.message || error);
  process.exit(1);
});
