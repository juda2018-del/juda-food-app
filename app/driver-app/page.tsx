 "use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app, db } from "../firebase";

type DriverOrder = {
  documentId: string;
  customerName?: string;
  phone?: string;
  address?: string;
  restaurant?: string;
  total?: number;
  status?: string;
  driverName?: string;
  driverPhone?: string;
  createdAt?: any;
  ref?: any;
};

const driversAccounts = [
  { name: "محمد علي", phone: "07701234567", password: "1234" },
  { name: "حيدر كريم", phone: "07709876543", password: "1234" },
];

export default function DriverAppPage() {
  const [authChecking, setAuthChecking] = useState(true);
  const [allOrders, setAllOrders] = useState<DriverOrder[]>([]);
  const [driverName, setDriverName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [locationStatus, setLocationStatus] =
    useState("لم يتم تشغيل الموقع بعد");
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [statusAlert, setStatusAlert] = useState("");

  const firstLoadRef = useRef(true);
  const notifiedOrdersRef = useRef<string[]>([]);

  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/auth";
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(
          userRef,
          {
            uid: user.uid,
            email: user.email,
            role: "driver",
            roleTitle: "سائق",
            updatedAt: Date.now(),
            createdAt: Date.now(),
          },
          { merge: true }
        );

        setAuthChecking(false);
        return;
      }

      const userData = userSnap.data();

      if (userData.role !== "driver" && userData.role !== "admin") {
        alert("هذا الحساب ليس حساب سائق");
        window.location.href = "/auth";
        return;
      }

      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  async function setDriverOnline(name: string, phoneNumber: string) {
    await setDoc(
      doc(db, "driversStatus", name),
      {
        name,
        phone: phoneNumber,
        status: "متصل",
        lastSeen: Date.now(),
      },
      { merge: true }
    );
  }

  async function setDriverOffline(name: string) {
    await setDoc(
      doc(db, "driversStatus", name),
      {
        status: "غير متصل",
        lastSeen: Date.now(),
      },
      { merge: true }
    );
  }

  async function updateDriverLocation(
    name: string,
    latitude: number,
    longitude: number,
    accuracy: number
  ) {
    const savedPhone = localStorage.getItem("driverPhone") || "";

    await setDoc(
      doc(db, "driversStatus", name),
      {
        name,
        phone: savedPhone,
        status: "متصل",
        latitude,
        longitude,
        accuracy,
        lastSeen: Date.now(),
      },
      { merge: true }
    );
  }

  async function loginDriver() {
    const cleanPhone = phone.trim();
    const cleanPassword = password.trim();

    const driver = driversAccounts.find(
      (d) => d.phone === cleanPhone && d.password === cleanPassword
    );

    if (!driver) {
      alert("رقم الهاتف أو كلمة المرور غير صحيحة");
      return;
    }

    setDriverName(driver.name);
    localStorage.setItem("driverName", driver.name);
    localStorage.setItem("driverPhone", driver.phone);
    await setDriverOnline(driver.name, driver.phone);
  }

  async function logoutDriver() {
    const savedDriver = localStorage.getItem("driverName");

    if (savedDriver) {
      await setDriverOffline(savedDriver);
    }

    localStorage.removeItem("driverName");
    localStorage.removeItem("driverPhone");
    setDriverName("");
    setAllOrders([]);
    setPhone("");
    setPassword("");
    setLocationStatus("لم يتم تشغيل الموقع بعد");
    setNewOrderAlert(false);
    setStatusAlert("");
    firstLoadRef.current = true;
    notifiedOrdersRef.current = [];
  }

  function playNewOrderSound() {
    const audio = new Audio("/sounds/new-order.mp3.wav");
    audio.volume = 1;
    audio.play().catch((error) => console.log("Audio Error:", error));
  }

  function showStatusAlert(message: string) {
    setStatusAlert(message);
    setTimeout(() => setStatusAlert(""), 5000);
  }

  useEffect(() => {
    if (authChecking) return;

    const savedDriver = localStorage.getItem("driverName");
    const savedPhone = localStorage.getItem("driverPhone");

    if (savedDriver) {
      setDriverName(savedDriver);
      setDriverOnline(savedDriver, savedPhone || "");
    }
  }, [authChecking]);

  useEffect(() => {
    if (!driverName) return;

    if (!navigator.geolocation) {
      setLocationStatus("المتصفح لا يدعم تحديد الموقع");
      return;
    }

    setLocationStatus("جاري تشغيل الموقع...");

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        await updateDriverLocation(
          driverName,
          position.coords.latitude,
          position.coords.longitude,
          position.coords.accuracy
        );

        setLocationStatus("الموقع شغال ويتحدث مباشرة");
      },
      () => {
        setLocationStatus("لم يتم السماح بالموقع، فعّل GPS من المتصفح");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [driverName]);

  useEffect(() => {
    if (!driverName) return;

    firstLoadRef.current = true;
    notifiedOrdersRef.current = [];

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((item) => {
        const orderData = item.data();

        return {
          ...orderData,
          documentId: item.id,
          ref: item.ref,
        } as DriverOrder;
      });

      const myOrders = data.filter(
        (order) => (order.driverName || "").trim() === driverName.trim()
      );

      const activeOrdersNow = myOrders.filter(
        (order) => !isDelivered(order.status) && !isRejected(order.status)
      );

      if (firstLoadRef.current) {
        notifiedOrdersRef.current = activeOrdersNow.map(
          (order) => order.documentId
        );

        firstLoadRef.current = false;
        setAllOrders(myOrders);
        return;
      }

      activeOrdersNow.forEach((order) => {
        if (!notifiedOrdersRef.current.includes(order.documentId)) {
          notifiedOrdersRef.current.push(order.documentId);
          setNewOrderAlert(true);
          playNewOrderSound();
          setTimeout(() => setNewOrderAlert(false), 8000);
        }
      });

      setAllOrders(myOrders);
    });

    return () => unsub();
  }, [driverName]);

  async function updateOrderStatus(order: DriverOrder, status: string) {
    try {
      if (!order.ref) {
        alert("ما لكيت رابط الطلب");
        return;
      }

      await updateDoc(order.ref, {
        status,
        driverLastUpdate: Date.now(),
        driverName,
        driverPhone: localStorage.getItem("driverPhone") || "",
      });

      if (status === "قيد التوصيل") {
        showStatusAlert("🚗 تم استلام الطلب وتحويله إلى قيد التوصيل");
      }

      if (status === "تم التسليم") {
        showStatusAlert("✅ تم تسليم الطلب بنجاح");
      }
    } catch (error) {
      console.error(error);
      alert("صار خطأ بتحديث حالة الطلب");
    }
  }

  const activeOrders = useMemo(() => {
    return allOrders.filter(
      (order) => !isDelivered(order.status) && !isRejected(order.status)
    );
  }, [allOrders]);

  const deliveredOrders = useMemo(() => {
    return allOrders.filter((order) => isDelivered(order.status));
  }, [allOrders]);

  const activeTotal = activeOrders.reduce(
    (sum, order) => sum + (order.total || 0),
    0
  );

  const deliveredTotal = deliveredOrders.reduce(
    (sum, order) => sum + (order.total || 0),
    0
  );

  if (authChecking) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-white"
      >
        <div className="w-full max-w-md rounded-[2rem] border border-[#FF7A00]/30 bg-[#111116] p-8 text-center">
          <p className="text-2xl font-black text-[#FF7A00]">جاري التحقق...</p>
        </div>
      </main>
    );
  }

  if (!driverName) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#050505] px-4 py-8 text-white">
        <section className="mx-auto w-full max-w-md">
          <div className="rounded-[2rem] border border-[#FF7A00]/30 bg-[#111116] p-6 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[#FF7A00] text-5xl">
              🛵
            </div>

            <h1 className="text-4xl font-black text-[#FF7A00]">دخول السائق</h1>
            <p className="mt-2 text-zinc-400">
              سجل دخول السائق حتى تظهر الطلبات المخصصة له
            </p>
          </div>

          <div className="mt-6 rounded-[2rem] border border-white/10 bg-[#111116] p-5">
            <label className="mb-2 block font-black text-zinc-300">
              رقم الهاتف
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07701234567"
              inputMode="tel"
              className="mb-4 w-full rounded-2xl border border-white/10 bg-[#1A1A20] p-4 text-white outline-none placeholder:text-zinc-500"
            />

            <label className="mb-2 block font-black text-zinc-300">
              كلمة المرور
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              type="password"
              className="mb-5 w-full rounded-2xl border border-white/10 bg-[#1A1A20] p-4 text-white outline-none placeholder:text-zinc-500"
            />

            <button
              onClick={loginDriver}
              className="w-full rounded-2xl bg-[#FF7A00] py-4 text-xl font-black text-black active:scale-95"
            >
              دخول السائق
            </button>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-3 text-center text-sm text-zinc-400">
              <p className="font-black text-[#FF7A00]">للتجربة</p>
              <p className="mt-1 font-bold">محمد علي: 07701234567 / 1234</p>
              <p className="font-bold">حيدر كريم: 07709876543 / 1234</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto min-h-screen w-full max-w-md pb-10">
        <div className="bg-[#111116] px-5 pb-6 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-zinc-400">FUSE Driver</p>
              <h1 className="mt-1 text-3xl font-black text-white">
                أهلاً، {driverName}
              </h1>
            </div>

            <button
              onClick={logoutDriver}
              className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 font-black text-red-300"
            >
              خروج
            </button>
          </div>

          <div className="mt-5 rounded-[2rem] border border-[#FF7A00]/30 bg-[#050505] p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF7A00] text-4xl">
                🛵
              </div>

              <div>
                <p className="text-sm text-zinc-400">حالة السائق</p>
                <p className="text-2xl font-black text-[#FF7A00]">متصل الآن</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-[#17171C] p-3">
              <p className="text-sm text-zinc-400">GPS</p>
              <p className="mt-1 text-sm font-black leading-6 text-green-400">
                {locationStatus}
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full rounded-2xl bg-[#FF7A00] py-3 font-black text-black"
            >
              تحديث الطلبات
            </button>
          </div>
        </div>

        <div className="px-4">
          {newOrderAlert && (
            <div className="mt-5 rounded-[2rem] bg-[#FF7A00] p-4 text-center text-xl font-black text-black">
              🔔 وصل طلب جديد مخصص لك
            </div>
          )}

          {statusAlert && (
            <div className="mt-5 rounded-[2rem] bg-green-600 p-4 text-center text-lg font-black text-white">
              {statusAlert}
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <StatCard title="الطلبات الحالية" value={activeOrders.length} icon="📦" />
            <StatCard title="المسلّمة" value={deliveredOrders.length} icon="✅" />
            <StatCard
              title="قيمة الحالية"
              value={`${activeTotal.toLocaleString()} د.ع`}
              icon="💰"
              green
            />
            <StatCard
              title="أرباح المسلّمة"
              value={`${deliveredTotal.toLocaleString()} د.ع`}
              icon="🏁"
              green
            />
          </div>

          <div className="mt-8 flex items-center justify-between">
            <h2 className="text-3xl font-black text-white">الطلبات الحالية</h2>
            <span className="rounded-full bg-[#FF7A00] px-4 py-2 text-sm font-black text-black">
              {activeOrders.length}
            </span>
          </div>

          <div className="mt-4">
            {activeOrders.length === 0 ? (
              <div className="rounded-[2rem] border border-white/10 bg-[#111116] p-8 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-[#1A1A20] text-4xl">
                  📭
                </div>
                <p className="text-2xl font-black">لا توجد طلبات حالياً</p>
                <p className="mt-2 text-sm text-zinc-500">
                  أول ما ينضاف طلب باسمك راح يظهر هنا مباشرة
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {activeOrders.map((order) => (
                  <OrderCard
                    key={order.documentId}
                    order={order}
                    updateOrderStatus={updateOrderStatus}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-10">
            <h2 className="mb-4 text-3xl font-black text-white">سجل الطلبات</h2>

            {deliveredOrders.length === 0 ? (
              <div className="rounded-[2rem] border border-white/10 bg-[#111116] p-6 text-center text-zinc-400">
                لا توجد طلبات مسلّمة بعد
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {deliveredOrders.map((order) => (
                  <div
                    key={order.documentId}
                    className="rounded-[2rem] border border-white/10 bg-[#111116] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xl font-black">
                          {order.customerName || "زبون"}
                        </p>
                        <p className="mt-1 text-sm text-zinc-400">
                          🍽️ {order.restaurant || "مطعم غير معروف"}
                        </p>
                      </div>
                      <p className="font-black text-[#FF7A00]">
                        {(order.total || 0).toLocaleString()} د.ع
                      </p>
                    </div>
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

function normalizeStatus(status?: string) {
  return (status || "").trim();
}

function isReady(status?: string) {
  return normalizeStatus(status).includes("جاهز للتوصيل");
}

function isOnDelivery(status?: string) {
  return normalizeStatus(status).includes("قيد التوصيل");
}

function isDelivered(status?: string) {
  return normalizeStatus(status).includes("تم التسليم");
}

function isRejected(status?: string) {
  return normalizeStatus(status).includes("مرفوض");
}

function statusBadge(status?: string) {
  const clean = normalizeStatus(status);

  if (clean.includes("جاهز"))
    return "bg-purple-500/15 text-purple-300 border-purple-500/30";
  if (clean.includes("قيد التوصيل"))
    return "bg-[#FF7A00]/15 text-[#FF7A00] border-[#FF7A00]/30";
  if (clean.includes("تم التسليم"))
    return "bg-green-500/15 text-green-300 border-green-500/30";
  if (clean.includes("مرفوض"))
    return "bg-red-500/15 text-red-300 border-red-500/30";

  return "bg-zinc-500/15 text-zinc-300 border-zinc-500/30";
}

function StatCard({
  title,
  value,
  icon,
  green,
}: {
  title: string;
  value: string | number;
  icon: string;
  green?: boolean;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#111116] p-4">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-black/40 text-2xl">
        {icon}
      </div>
      <p className="text-sm text-zinc-400">{title}</p>
      <p
        className={`mt-2 text-2xl font-black ${
          green ? "text-green-400" : "text-[#FF7A00]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function OrderCard({
  order,
  updateOrderStatus,
}: {
  order: DriverOrder;
  updateOrderStatus: (order: DriverOrder, status: string) => void;
}) {
  const cleanPhone = (order.phone || "").replace(/\s/g, "");
  const whatsappPhone = cleanPhone.startsWith("0")
    ? `964${cleanPhone.slice(1)}`
    : cleanPhone;

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#111116]">
      <div className="border-b border-white/10 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-400">طلب توصيل</p>
            <h2 className="mt-1 text-2xl font-black">
              {order.customerName || "زبون"}
            </h2>
          </div>

          <span
            className={`rounded-full border px-4 py-2 text-xs font-black ${statusBadge(
              order.status
            )}`}
          >
            {order.status || "جديد"}
          </span>
        </div>

        <div className="mt-4 rounded-2xl bg-black/35 p-4">
          <p className="text-sm text-zinc-500">المجموع</p>
          <p className="mt-1 text-3xl font-black text-[#FF7A00]">
            {(order.total || 0).toLocaleString()} د.ع
          </p>
        </div>
      </div>

      <div className="space-y-3 p-5">
        <InfoLine icon="📞" text={order.phone || "لا يوجد رقم"} />
        <InfoLine icon="📍" text={order.address || "لا يوجد عنوان"} />
        <InfoLine icon="🍽️" text={order.restaurant || "مطعم غير معروف"} />

        <div className="grid grid-cols-3 gap-2 pt-2">
          <a
            href={`tel:${cleanPhone}`}
            className="rounded-2xl bg-white py-3 text-center text-sm font-black text-black"
          >
            اتصال
          </a>

          <a
            href={`https://wa.me/${whatsappPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl bg-green-600 py-3 text-center text-sm font-black text-white"
          >
            واتساب
          </a>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              order.address || ""
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl bg-[#FF7A00] py-3 text-center text-sm font-black text-black"
          >
            خرائط
          </a>
        </div>

        {isReady(order.status) && (
          <button
            onClick={() => updateOrderStatus(order, "قيد التوصيل")}
            className="w-full rounded-2xl bg-[#FF7A00] py-4 text-lg font-black text-black"
          >
            استلام الطلب
          </button>
        )}

        {isOnDelivery(order.status) && (
          <button
            onClick={() => updateOrderStatus(order, "تم التسليم")}
            className="w-full rounded-2xl bg-green-600 py-4 text-lg font-black text-white"
          >
            تم التسليم
          </button>
        )}
      </div>
    </div>
  );
}

function InfoLine({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-black/30 p-3 text-sm text-zinc-300">
      <span>{icon}</span>
      <span className="leading-6">{text}</span>
    </div>
  );
}