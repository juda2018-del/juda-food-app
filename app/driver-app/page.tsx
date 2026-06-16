 "use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

type DriverOrder = {
  documentId: string;
  customerName?: string;
  phone?: string;
  address?: string;
  restaurant?: string;
  total?: number;
  status?: string;
  driverName?: string;
  createdAt?: any;
  ref?: any;
};

const driversAccounts = [
  { name: "محمد علي", phone: "07701234567", password: "1234" },
  { name: "حيدر كريم", phone: "07709876543", password: "1234" },
];

export default function DriverAppPage() {
  const [allOrders, setAllOrders] = useState<DriverOrder[]>([]);
  const [driverName, setDriverName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [locationStatus, setLocationStatus] = useState("لم يتم تشغيل الموقع بعد");
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [statusAlert, setStatusAlert] = useState("");

  const firstLoadRef = useRef(true);
  const notifiedOrdersRef = useRef<string[]>([]);

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
    audio.play().catch((error) => {
      console.log("Audio Error:", error);
    });
  }

  function showStatusAlert(message: string) {
    setStatusAlert(message);

    setTimeout(() => {
      setStatusAlert("");
    }, 5000);
  }

  useEffect(() => {
    const savedDriver = localStorage.getItem("driverName");
    const savedPhone = localStorage.getItem("driverPhone");

    if (savedDriver) {
      setDriverName(savedDriver);
      setDriverOnline(savedDriver, savedPhone || "");
    }
  }, []);

  useEffect(() => {
    if (!driverName) return;

    if (!navigator.geolocation) {
      setLocationStatus("المتصفح لا يدعم تحديد الموقع");
      return;
    }

    setLocationStatus("جاري تشغيل الموقع...");

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        await updateDriverLocation(driverName, latitude, longitude, accuracy);
        setLocationStatus("الموقع شغال ويتحدث مباشرة");
      },
      (error) => {
        console.error(error);
        setLocationStatus("لم يتم السماح بالموقع، فعّل GPS من المتصفح");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
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

          setTimeout(() => {
            setNewOrderAlert(false);
          }, 8000);
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
      });

      if (status === "استلم السائق الطلب") {
        showStatusAlert("✅ تم استلام الطلب، المطعم والزبون يشوفون التحديث");
      }

      if (status === "بالطريق") {
        showStatusAlert("🚗 تم تحديث الطلب: السائق بالطريق");
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

  if (!driverName) {
    return (
      <main dir="rtl" className="min-h-screen bg-black px-4 py-6 text-white">
        <section className="mx-auto max-w-md">
          <h1 className="text-center text-4xl font-black text-yellow-400">
            دخول السائق
          </h1>

          <p className="mt-2 text-center text-gray-300">
            سجل دخولك حتى تشوف طلباتك
          </p>

          <div className="mt-8 rounded-3xl bg-white p-5 text-black">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="رقم الهاتف"
              inputMode="tel"
              className="mb-3 w-full rounded-2xl bg-gray-100 p-4 outline-none"
            />

            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              type="password"
              className="mb-4 w-full rounded-2xl bg-gray-100 p-4 outline-none"
            />

            <button
              onClick={loginDriver}
              className="w-full rounded-2xl bg-yellow-400 py-4 font-black text-black"
            >
              دخول
            </button>

            <div className="mt-4 rounded-2xl bg-gray-100 p-3 text-center text-sm text-gray-600">
              <p>للتجربة:</p>
              <p className="font-bold">محمد علي: 07701234567 / 1234</p>
              <p className="font-bold">حيدر كريم: 07709876543 / 1234</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-black px-4 py-6 text-white">
      <section className="mx-auto max-w-3xl">
        {newOrderAlert && (
          <div className="mb-5 rounded-3xl bg-yellow-400 p-4 text-center text-xl font-black text-black shadow-2xl">
            🔔 وصل طلب جديد مخصص لك
          </div>
        )}

        {statusAlert && (
          <div className="mb-5 rounded-3xl bg-green-600 p-4 text-center text-lg font-black text-white shadow-2xl">
            {statusAlert}
          </div>
        )}

        <h1 className="text-center text-4xl font-black text-yellow-400">
          تطبيق السائق
        </h1>

        <div className="mt-6 rounded-3xl bg-white/10 p-4 text-center">
          <p className="text-sm text-gray-300">السائق الحالي</p>
          <p className="mt-2 text-2xl font-black text-yellow-400">
            {driverName}
          </p>

          <div className="mt-4 rounded-2xl bg-black/40 p-3">
            <p className="text-sm text-gray-300">حالة الموقع GPS</p>
            <p className="mt-1 font-black text-green-400">{locationStatus}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => window.location.reload()}
              className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white"
            >
              تحديث
            </button>

            <button
              onClick={logoutDriver}
              className="rounded-2xl bg-red-600 px-4 py-3 font-black text-white"
            >
              خروج
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <StatCard title="الطلبات الحالية" value={activeOrders.length} />
          <StatCard title="المسلّمة" value={deliveredOrders.length} />
          <StatCard
            title="قيمة الحالية"
            value={`${activeTotal.toLocaleString()} د.ع`}
            green
          />
          <StatCard
            title="أرباح المسلّمة"
            value={`${deliveredTotal.toLocaleString()} د.ع`}
            green
          />
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-2xl font-black text-yellow-400">
            الطلبات الحالية
          </h2>

          {activeOrders.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center text-black">
              <p className="text-2xl font-black">لا توجد طلبات حالياً</p>
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
          <h2 className="mb-4 text-2xl font-black text-yellow-400">
            سجل الطلبات المسلّمة
          </h2>

          {deliveredOrders.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-center text-black">
              لا توجد طلبات مسلّمة بعد
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {deliveredOrders.map((order) => (
                <div
                  key={order.documentId}
                  className="rounded-3xl bg-white p-4 text-black"
                >
                  <p className="text-xl font-black">
                    {order.customerName || "زبون"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    🍽️ {order.restaurant || "مطعم غير معروف"}
                  </p>
                  <p className="mt-3 font-black">
                    {(order.total || 0).toLocaleString()} د.ع
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function normalizeStatus(status?: string) {
  return (status || "").trim();
}

function isReady(status?: string) {
  return normalizeStatus(status).includes("جاهز");
}

function isPicked(status?: string) {
  return normalizeStatus(status).includes("استلم");
}

function isOnWay(status?: string) {
  return normalizeStatus(status).includes("بالطريق");
}

function isDelivered(status?: string) {
  return normalizeStatus(status).includes("تم التسليم");
}

function isRejected(status?: string) {
  return normalizeStatus(status).includes("مرفوض");
}

function StatCard({
  title,
  value,
  green,
}: {
  title: string;
  value: string | number;
  green?: boolean;
}) {
  return (
    <div className="rounded-3xl bg-white/10 p-4 text-center">
      <p className="text-sm text-gray-300">{title}</p>
      <p
        className={`mt-2 text-3xl font-black ${
          green ? "text-green-400" : "text-yellow-400"
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
    <div className="rounded-3xl bg-white p-5 text-black shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">
            {order.customerName || "زبون"}
          </h2>

          <p className="mt-2 text-gray-700">📞 {order.phone || "لا يوجد رقم"}</p>
          <p className="mt-1 text-gray-700">
            📍 {order.address || "لا يوجد عنوان"}
          </p>
          <p className="mt-1 text-gray-700">
            🍽️ {order.restaurant || "مطعم غير معروف"}
          </p>
        </div>

        <span className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-black text-black">
          {order.status || "جديد"}
        </span>
      </div>

      <div className="mt-5 rounded-2xl bg-gray-100 p-4 text-center">
        <p className="text-sm text-gray-500">المجموع</p>
        <p className="mt-2 text-3xl font-black">
          {(order.total || 0).toLocaleString()} د.ع
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <a
          href={`tel:${cleanPhone}`}
          className="rounded-2xl bg-black py-3 text-center font-bold text-white"
        >
          اتصال
        </a>

        <a
          href={`https://wa.me/${whatsappPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl bg-green-600 py-3 text-center font-bold text-white"
        >
          واتساب
        </a>

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            order.address || ""
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl bg-purple-600 py-3 text-center font-bold text-white"
        >
          خرائط
        </a>

        {isReady(order.status) && (
          <button
            onClick={() => updateOrderStatus(order, "استلم السائق الطلب")}
            className="rounded-2xl bg-blue-600 py-3 font-bold text-white"
          >
            استلام الطلب
          </button>
        )}

        {isPicked(order.status) && (
          <button
            onClick={() => updateOrderStatus(order, "بالطريق")}
            className="rounded-2xl bg-orange-500 py-3 font-bold text-white"
          >
            بالطريق
          </button>
        )}

        {isOnWay(order.status) && (
          <button
            onClick={() => updateOrderStatus(order, "تم التسليم")}
            className="rounded-2xl bg-green-600 py-3 font-bold text-white"
          >
            تم التسليم
          </button>
        )}
      </div>
    </div>
  );
}