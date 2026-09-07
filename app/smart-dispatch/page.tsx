"use client";

/**
 * Smart dispatch = admin assignment helper (optional auto while page is open).
 * Correct path: keep status "جاهز للتوصيل", set assignedDriverId/Email,
 * then driver advances: استلم → قيد التوصيل → تم التسليم.
 * Does NOT jump status to قيد التوصيل.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { db } from "../firebase";
import { firebaseAuth } from "@/lib/firebase/client";
import { saveFuseSession } from "@/lib/fuse-auth";
import { resolveFuseSession } from "@/lib/fuse-session-resolve";
import { normalizeFuseOrderStatus } from "@/lib/fuse-order-status";

type Order = {
  id: string;
  orderId?: string;
  customerName?: string;
  phone?: string;
  address?: string;
  restaurant?: string;
  restaurantName?: string;
  total?: number;
  status?: string;
  driverName?: string;
  driverPhone?: string;
  driverId?: string;
  driverEmail?: string;
  assignedDriverId?: string;
  assignedDriverEmail?: string;
  assignedDriverName?: string;
  createdAt?: unknown;
};

type Driver = {
  id: string;
  uid?: string;
  name?: string;
  driverName?: string;
  phone?: string;
  driverPhone?: string;
  email?: string;
  status?: string;
  online?: boolean;
  isOnline?: boolean;
  available?: boolean;
  rating?: number;
  completedOrders?: number;
  lastSeen?: number;
};

type GateState = "checking" | "allowed" | "blocked";

function isDriverOnline(driver: Driver) {
  return (
    driver.online === true ||
    driver.isOnline === true ||
    driver.available === true ||
    driver.status === "متصل" ||
    driver.status === "online"
  );
}

function driverEmail(driver: Driver) {
  return String(driver.email || "").trim().toLowerCase();
}

function driverDisplayName(driver: Driver) {
  return String(driver.name || driver.driverName || "سائق").trim();
}

function driverPhone(driver: Driver) {
  return String(driver.phone || driver.driverPhone || "").trim();
}

function isAssigned(order: Order) {
  return Boolean(
    order.assignedDriverId ||
      order.assignedDriverEmail ||
      order.driverId ||
      order.driverEmail ||
      order.assignedDriverName ||
      order.driverName
  );
}

function formatDate(value: unknown) {
  if (!value) return "لا يوجد وقت";

  try {
    let date: Date;

    if (typeof value === "object" && value !== null && "toDate" in value) {
      const fn = (value as { toDate?: unknown }).toDate;
      if (typeof fn === "function") date = (fn as () => Date)();
      else return "لا يوجد وقت";
    } else if (value instanceof Date) {
      date = value;
    } else if (typeof value === "number" || typeof value === "string") {
      date = new Date(value);
    } else {
      return "لا يوجد وقت";
    }

    if (Number.isNaN(date.getTime())) return "لا يوجد وقت";

    return date.toLocaleString("ar-IQ", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "لا يوجد وقت";
  }
}

function StatCard({
  title,
  value,
  green,
  red,
}: {
  title: string;
  value: number;
  green?: boolean;
  red?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl p-4 text-center ${
        green ? "bg-green-900/40" : red ? "bg-red-900/40" : "bg-white/10"
      }`}
    >
      <p className="text-sm text-gray-300">{title}</p>
      <b className="mt-2 block text-3xl font-black">{value}</b>
    </div>
  );
}

export default function SmartDispatchPage() {
  const router = useRouter();
  const [gate, setGate] = useState<GateState>("checking");
  const [gateMessage, setGateMessage] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [dispatchLog, setDispatchLog] = useState<string[]>([]);
  const [autoDispatch, setAutoDispatch] = useState(false);

  const processingOrders = useRef<string[]>([]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setGate("blocked");
      setGateMessage("تأخر التحقق من صلاحية الأدمن.");
      router.replace("/login?next=/smart-dispatch");
    }, 8000);

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      window.clearTimeout(timeout);

      if (!user) {
        setGate("blocked");
        router.replace("/login?next=/smart-dispatch");
        return;
      }

      try {
        const session = await resolveFuseSession(user);
        saveFuseSession(session);

        if (session.role !== "admin") {
          setGate("blocked");
          setGateMessage("لوحة التوزيع الذكي متاحة لحساب الإدارة فقط.");
          router.replace(session.role === "restaurant" ? "/restaurant-admin" : "/");
          return;
        }

        setGate("allowed");
        setGateMessage("");
      } catch (error) {
        setGate("blocked");
        setGateMessage(error instanceof Error ? error.message : "تعذر التحقق من الحساب.");
        router.replace("/login?next=/smart-dispatch");
      }
    });

    return () => {
      window.clearTimeout(timeout);
      unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (gate !== "allowed") return;

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Order[];

      setOrders(data);
    });

    return () => unsub();
  }, [gate]);

  useEffect(() => {
    if (gate !== "allowed") return;

    // Use canonical drivers collection (email required for driver-app queries).
    const unsub = onSnapshot(collection(db, "drivers"), (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Driver[];

      setDrivers(data);
    });

    return () => unsub();
  }, [gate]);

  const readyOrders = useMemo(() => {
    return orders.filter(
      (order) => normalizeFuseOrderStatus(order.status) === "جاهز للتوصيل" && !isAssigned(order)
    );
  }, [orders]);

  const onlineDrivers = useMemo(() => {
    return drivers.filter((driver) => isDriverOnline(driver) && Boolean(driverEmail(driver)));
  }, [drivers]);

  const busyDriverIds = useMemo(() => {
    const active = new Set<string>();
    for (const order of orders) {
      const status = normalizeFuseOrderStatus(order.status);
      if (!["السائق استلم الطلب", "قيد التوصيل"].includes(status)) continue;
      const id = String(order.assignedDriverId || order.driverId || "").trim();
      const email = String(order.assignedDriverEmail || order.driverEmail || "")
        .trim()
        .toLowerCase();
      if (id) active.add(id);
      if (email) active.add(email);
    }
    return active;
  }, [orders]);

  const availableDrivers = useMemo(() => {
    return onlineDrivers
      .filter((driver) => {
        const id = String(driver.uid || driver.id).trim();
        const email = driverEmail(driver);
        return !busyDriverIds.has(id) && !busyDriverIds.has(email);
      })
      .sort((a, b) => {
        const scoreA = Number(a.rating || 0) * 10 + Math.min(Number(a.completedOrders || 0), 50);
        const scoreB = Number(b.rating || 0) * 10 + Math.min(Number(b.completedOrders || 0), 50);
        return scoreB - scoreA;
      });
  }, [onlineDrivers, busyDriverIds]);

  function addLog(message: string) {
    const time = new Date().toLocaleTimeString("ar-IQ", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    setDispatchLog((old) => [`${time} - ${message}`, ...old].slice(0, 20));
  }

  function chooseBestDriver() {
    return availableDrivers[0] || null;
  }

  async function assignOrder(order: Order) {
    if (processingOrders.current.includes(order.id)) return;

    const driver = chooseBestDriver();

    if (!driver) {
      addLog(`لا يوجد سائق متاح للطلب ${order.orderId || order.id.slice(0, 6)}`);
      return;
    }

    const email = driverEmail(driver);
    if (!email) {
      addLog(`السائق ${driverDisplayName(driver)} غير مربوط ببريد دخول`);
      return;
    }

    if (normalizeFuseOrderStatus(order.status) !== "جاهز للتوصيل" || isAssigned(order)) {
      addLog(`الطلب ${order.orderId || order.id.slice(0, 6)} لم يعد متاحاً للتوزيع`);
      return;
    }

    try {
      processingOrders.current.push(order.id);

      const id = String(driver.uid || driver.id).trim();
      const name = driverDisplayName(driver);
      const phone = driverPhone(driver);

      // Keep status جاهز للتوصيل — driver must pick up before out-for-delivery.
      await updateDoc(doc(db, "orders", order.id), {
        status: "جاهز للتوصيل",
        statusAr: "جاهز للتوصيل",
        assignedDriverId: id,
        assignedDriverEmail: email,
        assignedDriverName: name,
        assignedDriverPhone: phone,
        driverId: id,
        driverEmail: email,
        driverName: name,
        driverPhone: phone,
        dispatchType: "تلقائي",
        dispatchAt: Date.now(),
        dispatchNote: "تم اختيار السائق تلقائياً من لوحة التوزيع الذكي مع إبقاء الحالة جاهز للتوصيل",
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      try {
        await addDoc(collection(db, "notifications"), {
          type: "driver",
          role: "driver",
          title: "طلب جديد مخصص إلك",
          message: `تم تخصيص طلب ${order.customerName || "زبون"} من ${order.restaurantName || order.restaurant || "مطعم"} إلك.`,
          orderId: order.orderId || order.id,
          orderDocumentId: order.id,
          driverId: id,
          driverEmail: email,
          read: false,
          createdAt: serverTimestamp(),
        });
      } catch {
        // Assignment succeeded; driver notification is best-effort (admin-only create).
      }

      addLog(`تم تخصيص ${order.orderId || order.id.slice(0, 6)} للسائق ${name} (بانتظار استلام السائق)`);
    } catch (error) {
      console.error(error);
      addLog(`صار خطأ بإسناد الطلب ${order.orderId || order.id.slice(0, 6)}`);
    } finally {
      setTimeout(() => {
        processingOrders.current = processingOrders.current.filter((id) => id !== order.id);
      }, 3000);
    }
  }

  async function assignAllReadyOrders() {
    if (readyOrders.length === 0) {
      addLog("لا توجد طلبات جاهزة للتوزيع");
      return;
    }

    if (availableDrivers.length === 0) {
      addLog("لا يوجد سائقين متاحين حالياً");
      return;
    }

    for (const order of readyOrders) {
      await assignOrder(order);
    }
  }

  useEffect(() => {
    if (gate !== "allowed") return;
    if (!autoDispatch) return;
    if (readyOrders.length === 0) return;
    if (availableDrivers.length === 0) return;

    readyOrders.forEach((order) => {
      void assignOrder(order);
    });
  }, [gate, autoDispatch, readyOrders, availableDrivers]);

  if (gate !== "allowed") {
    return (
      <main dir="rtl" className="min-h-screen bg-black px-4 py-6 text-white grid place-items-center">
        <section className="w-full max-w-lg rounded-3xl border border-yellow-500/30 bg-white/5 p-8 text-center">
          <p className="font-black text-yellow-400">FUSE Admin Gate</p>
          <h1 className="mt-3 text-3xl font-black">التحقق من صلاحية التوزيع</h1>
          <p className="mt-3 text-gray-300 leading-8">
            {gateMessage || "جاري توجيه الحساب الصحيح... لوحة /smart-dispatch للأدمن فقط."}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-black px-4 py-6 text-white">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-center text-4xl font-black text-yellow-400">
          التوزيع الذكي للطلبات
        </h1>

        <p className="mt-2 text-center text-gray-300">
          تخصيص سائق حقيقي مع إبقاء الحالة «جاهز للتوصيل» حتى يستلم السائق الطلب بنفسه
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard title="جاهزة للتوزيع" value={readyOrders.length} />
          <StatCard title="سائقين متصلين" value={onlineDrivers.length} green />
          <StatCard title="سائقين متاحين" value={availableDrivers.length} green />
          <StatCard title="سائقين مشغولين" value={busyDriverIds.size} red />
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <button
            onClick={assignAllReadyOrders}
            className="rounded-3xl bg-yellow-400 py-4 text-xl font-black text-black"
          >
            وزّع كل الطلبات الجاهزة الآن
          </button>

          <button
            onClick={() => setAutoDispatch((old) => !old)}
            className={`rounded-3xl py-4 text-xl font-black ${
              autoDispatch ? "bg-green-600 text-white" : "bg-white/10 text-white"
            }`}
          >
            {autoDispatch ? "التوزيع التلقائي شغّال" : "تشغيل التوزيع التلقائي"}
          </button>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl bg-white/10 p-4">
            <h2 className="mb-4 text-2xl font-black text-yellow-400">
              الطلبات الجاهزة للتوصيل
            </h2>

            {readyOrders.length === 0 ? (
              <div className="rounded-2xl bg-black/40 p-6 text-center text-gray-300">
                لا توجد طلبات جاهزة حالياً
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {readyOrders.map((order) => (
                  <div key={order.id} className="rounded-2xl bg-white p-4 text-black">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black">{order.customerName || "زبون"}</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          #{order.orderId || String(order.id).slice(0, 8)}
                        </p>
                      </div>

                      <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-bold text-purple-700">
                        جاهز للتوصيل
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-gray-700">
                      <p>🍽️ {order.restaurantName || order.restaurant || "مطعم غير محدد"}</p>
                      <p>📞 {order.phone || "لا يوجد رقم"}</p>
                      <p>📍 {order.address || "لا يوجد عنوان"}</p>
                      <p>🕒 {formatDate(order.createdAt)}</p>
                      <p className="font-black">{(order.total || 0).toLocaleString()} د.ع</p>
                    </div>

                    <button
                      onClick={() => void assignOrder(order)}
                      className="mt-4 w-full rounded-2xl bg-black py-3 font-black text-white"
                    >
                      تخصيص سائق لهذا الطلب
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white/10 p-4">
            <h2 className="mb-4 text-2xl font-black text-yellow-400">سجل التوزيع</h2>
            {dispatchLog.length === 0 ? (
              <div className="rounded-2xl bg-black/40 p-6 text-center text-gray-300">
                لا يوجد سجل بعد
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {dispatchLog.map((log, index) => (
                  <div key={`${log}-${index}`} className="rounded-2xl bg-black/50 px-4 py-3 text-sm">
                    {log}
                  </div>
                ))}
              </div>
            )}

            <h2 className="mb-4 mt-8 text-2xl font-black text-yellow-400">سائقون متاحون</h2>
            {availableDrivers.length === 0 ? (
              <div className="rounded-2xl bg-black/40 p-6 text-center text-gray-300">
                لا يوجد سائقون متصلون ومربوطون ببريد
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {availableDrivers.map((driver) => (
                  <div key={driver.id} className="rounded-2xl bg-black/50 px-4 py-3">
                    <b>{driverDisplayName(driver)}</b>
                    <p className="text-sm text-gray-300" dir="ltr">
                      {driverEmail(driver)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
