 "use client";

import { useState } from "react";
import { getToken } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { db, messaging } from "../firebase";

const vapidKey =
  "BMPj4adpalvtSTsdOc85iO4YYeSXGRzYH4YIPHvwS4WhmNxWNBsxXx2Q9La5nPMpMhqxlGu-NBA4rKQbfEOLowI";

export default function NotificationPermission({
  userType,
  userId,
}: {
  userType: "driver" | "customer" | "admin";
  userId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function enableNotifications() {
    try {
      setLoading(true);

      if (!("serviceWorker" in navigator)) {
        alert("المتصفح لا يدعم Service Worker");
        return;
      }

      if (!messaging) {
        alert("الإشعارات غير مدعومة على هذا المتصفح");
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        alert("لازم تضغط سماح حتى تشتغل الإشعارات");
        return;
      }

      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        { scope: "/" }
      );

      await navigator.serviceWorker.ready;

      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        alert("ما حصلنا توكن الإشعارات");
        return;
      }

      await setDoc(
        doc(db, "notificationTokens", `${userType}_${userId}`),
        {
          userType,
          userId,
          token,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      setDone(true);
      alert("تم تفعيل الإشعارات بنجاح");
    } catch (error) {
      console.error(error);
      alert("صار خطأ بتفعيل الإشعارات");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={enableNotifications}
      disabled={loading || done}
      className={`mt-3 w-full rounded-2xl py-3 font-black text-white ${
        done ? "bg-green-600" : "bg-purple-700"
      }`}
    >
      {done
        ? "✅ الإشعارات مفعّلة"
        : loading
        ? "جاري تفعيل الإشعارات..."
        : "🔔 تفعيل الإشعارات"}
    </button>
  );
}