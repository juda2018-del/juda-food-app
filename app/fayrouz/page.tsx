 "use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

const LocationMap = dynamic(() => import("../components/LocationMap"), {
  ssr: false,
});

type MenuItem = {
  name: string;
  price: number;
  category: string;
  restaurant?: string;
  image?: string;
  active?: boolean;
};

type CartItem = MenuItem & {
  qty: number;
};

type OrderTrack = {
  documentId: string;
  restaurant?: string;
  customerName?: string;
  phone?: string;
  address?: string;
  total?: number;
  status?: string;
  driverName?: string;
  createdAt?: any;
};

type DriverStatus = {
  name?: string;
  phone?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  lastSeen?: number;
};

const categories = ["الكل", "الفطور", "كاهي وبورك", "مشروبات", "سيت منيو"];

export default function Fayrouz() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [locationLink, setLocationLink] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [position, setPosition] = useState<[number, number]>([33.3152, 44.3661]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");

  const [lastOrderId, setLastOrderId] = useState("");
  const [trackingOrder, setTrackingOrder] = useState<OrderTrack | null>(null);
  const [driverStatus, setDriverStatus] = useState<DriverStatus | null>(null);

  useEffect(() => {
    const savedOrderId = localStorage.getItem("lastFayrouzOrderId") || "";
    setLastOrderId(savedOrderId);
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "menuItems"), (snapshot) => {
      const data = snapshot.docs
        .map((doc) => doc.data() as MenuItem)
        .filter((item) => item.active !== false)
        .filter((item) => !item.restaurant || item.restaurant === "فيروز");

      setMenuItems(data);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!lastOrderId) return;

    const unsubscribe = onSnapshot(doc(db, "orders", lastOrderId), (snap) => {
      if (snap.exists()) {
        setTrackingOrder({
          documentId: snap.id,
          ...snap.data(),
        } as OrderTrack);
      }
    });

    return () => unsubscribe();
  }, [lastOrderId]);

  useEffect(() => {
    if (!trackingOrder?.driverName) {
      setDriverStatus(null);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "driversStatus", trackingOrder.driverName),
      (snap) => {
        if (snap.exists()) {
          setDriverStatus(snap.data() as DriverStatus);
        }
      }
    );

    return () => unsubscribe();
  }, [trackingOrder?.driverName]);

  const updateLocation = (newLat: number, newLng: number) => {
    setPosition([newLat, newLng]);

    const link = `https://www.google.com/maps?q=${newLat},${newLng}`;
    setLocationLink(link);

    setAddress((old) =>
      old
        ? `${old.split(" - موقع الخريطة")[0]} - موقع الخريطة: ${link}`
        : `موقع الخريطة: ${link}`
    );
  };

  const handleMapChange = (pos: [number, number]) => {
    updateLocation(pos[0], pos[1]);
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const filteredItems = menuItems.filter((item) => {
    const byCategory =
      selectedCategory === "الكل" || item.category === selectedCategory;
    const bySearch = item.name.toLowerCase().includes(search.toLowerCase());
    return byCategory && bySearch;
  });

  const addToCart = (item: MenuItem) => {
    setCart((oldCart) => {
      const found = oldCart.find((x) => x.name === item.name);
      if (found) {
        return oldCart.map((x) =>
          x.name === item.name ? { ...x, qty: x.qty + 1 } : x
        );
      }
      return [...oldCart, { ...item, qty: 1 }];
    });
  };

  const removeOne = (name: string) => {
    setCart((oldCart) =>
      oldCart
        .map((x) => (x.name === name ? { ...x, qty: x.qty - 1 } : x))
        .filter((x) => x.qty > 0)
    );
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("المتصفح لا يدعم تحديد الموقع");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateLocation(pos.coords.latitude, pos.coords.longitude);
        setLocationLoading(false);
        alert("تم تحديد موقعك بنجاح");
      },
      () => {
        setLocationLoading(false);
        alert("ما قدرنا نحدد الموقع. فعّل صلاحية الموقع وجرب مرة ثانية");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const sendOrder = async () => {
    if (!customerName || !phone || !address) {
      alert("اكتب اسم الزبون ورقم الهاتف والعنوان");
      return;
    }

    if (cart.length === 0) {
      alert("السلة فارغة");
      return;
    }

    const orderText = cart
      .map(
        (item) =>
          `• ${item.name} × ${item.qty} = ${(
            item.price * item.qty
          ).toLocaleString()} د.ع`
      )
      .join("\n");

    const message = `طلب جديد من فيروز

اسم الزبون: ${customerName}
رقم الهاتف: ${phone}
العنوان: ${address}
${locationLink ? `رابط الموقع: ${locationLink}` : ""}

الطلبات:
${orderText}

عدد الأصناف: ${cartCount}
المجموع: ${total.toLocaleString()} د.ع`;

    const newOrder = {
      id: Date.now(),
      restaurant: "فيروز",
      customerName,
      phone,
      address,
      locationLink,
      location: {
        lat: position[0],
        lng: position[1],
      },
      items: cart,
      total,
      status: "جديد",
      createdAt: new Date().toLocaleString("ar-IQ"),
    };

    const docRef = await addDoc(collection(db, "orders"), newOrder);

    localStorage.setItem("lastFayrouzOrderId", docRef.id);
    setLastOrderId(docRef.id);
    setCart([]);

    window.open(
      `https://wa.me/9647733778077?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#120018] text-white p-4 pb-28">
      <a
        href="/"
        className="fixed top-4 left-4 bg-white text-black px-4 py-2 rounded-xl font-bold shadow-lg z-50"
      >
        🏠 الرئيسية
      </a>

      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-l from-yellow-500 via-orange-400 to-purple-700 p-6 rounded-3xl mb-5 shadow-2xl">
          <h1 className="text-4xl font-extrabold">مطعم فيروز</h1>
          <p className="text-lg mt-2">اطلب مباشرة من فيروز عبر الواتساب</p>
        </div>

        {trackingOrder && (
          <OrderTracking
            order={trackingOrder}
            driverStatus={driverStatus}
          />
        )}

        <div className="bg-white/10 p-4 rounded-2xl mb-5 border border-white/10">
          <h2 className="text-yellow-300 text-xl font-bold mb-3">
            بيانات الزبون
          </h2>

          <input
            type="text"
            placeholder="اسم الزبون"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full p-3 mb-2 bg-white text-black rounded-xl font-bold"
          />

          <input
            type="text"
            placeholder="رقم الهاتف"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 mb-2 bg-white text-black rounded-xl font-bold"
          />

          <textarea
            placeholder="العنوان أو أقرب نقطة دالة"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-3 mb-2 bg-white text-black rounded-xl font-bold min-h-[90px]"
          />

          <button
            onClick={getCurrentLocation}
            disabled={locationLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 px-4 py-3 rounded-xl font-bold mb-3"
          >
            {locationLoading
              ? "جاري تحديد الموقع..."
              : "📍 تحديد موقعي على الخريطة"}
          </button>

          {locationLink && (
            <a
              href={locationLink}
              target="_blank"
              className="block mb-3 bg-green-600 text-center px-4 py-3 rounded-xl font-bold"
            >
              فتح الموقع على Google Maps
            </a>
          )}

          <LocationMap position={position} setPosition={handleMapChange} />
        </div>

        <div className="bg-black/60 p-4 rounded-2xl mb-5 sticky top-2 z-10 border border-yellow-400/40 shadow-xl">
          <div className="text-yellow-300 text-xl font-extrabold mb-3">
            🛒 السلة: {cartCount} صنف | المجموع: {total.toLocaleString()} د.ع
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCart([])}
              className="bg-red-600 px-4 py-2 rounded-xl font-bold"
            >
              🗑️ تفريغ
            </button>

            <button
              onClick={sendOrder}
              className="bg-green-600 px-4 py-2 rounded-xl font-bold"
            >
              📱 إرسال الطلب
            </button>
          </div>
        </div>

        {cart.length > 0 && (
          <div className="bg-zinc-900 p-4 rounded-2xl mb-6 border border-purple-400/30">
            <h2 className="text-xl font-bold text-yellow-400 mb-3">طلباتك</h2>

            <div className="space-y-3">
              {cart.map((item, index) => (
                <div
                  key={`cart-${item.name}-${index}`}
                  className="bg-purple-900 p-4 rounded-2xl flex items-center justify-between gap-3 border border-purple-500"
                >
                  <div>
                    <div className="font-bold text-white">{item.name}</div>
                    <div className="text-sm text-yellow-300 font-bold">
                      {(item.price * item.qty).toLocaleString()} د.ع
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => removeOne(item.name)}
                      className="bg-red-600 w-8 h-8 rounded-full font-bold"
                    >
                      -
                    </button>

                    <span className="font-bold">{item.qty}</span>

                    <button
                      onClick={() => addToCart(item)}
                      className="bg-green-600 w-8 h-8 rounded-full font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <input
          type="text"
          placeholder="ابحث عن صنف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-4 mb-4 bg-white text-black rounded-2xl font-bold border-2 border-yellow-400"
        />

        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl font-extrabold whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-yellow-400 text-black"
                  : "bg-black/60 text-white border border-yellow-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <section className="mb-7">
          <h2 className="text-2xl font-extrabold text-yellow-400 mb-3">
            {selectedCategory === "الكل" ? "كل المنيو" : selectedCategory}
          </h2>

          <div className="grid gap-3">
            {filteredItems.map((item, index) => (
              <div
                key={`menu-${item.name}-${item.category}-${index}`}
                className="bg-gradient-to-l from-purple-700 to-purple-900 p-4 rounded-2xl shadow-lg border border-purple-500 flex items-center justify-between gap-3"
              >
                <div>
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-20 object-cover rounded-xl mb-2 bg-white"
                    />
                  )}

                  <h3 className="text-xl font-bold text-white">{item.name}</h3>

                  <p className="text-yellow-300 font-bold mt-1">
                    {item.price.toLocaleString()} د.ع
                  </p>
                </div>

                <button
                  onClick={() => addToCart(item)}
                  className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-xl font-bold"
                >
                  أضف
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function OrderTracking({
  order,
  driverStatus,
}: {
  order: OrderTrack;
  driverStatus: DriverStatus | null;
}) {
  const status = order.status || "جديد";

  const steps = [
    { title: "تم استلام الطلب", active: true },
    { title: "قيد التحضير", active: status.includes("قيد") || status.includes("جاهز") || status.includes("استلم") || status.includes("بالطريق") || status.includes("تم التسليم") },
    { title: "جاهز للتوصيل", active: status.includes("جاهز") || status.includes("استلم") || status.includes("بالطريق") || status.includes("تم التسليم") },
    { title: "السائق استلم الطلب", active: status.includes("استلم") || status.includes("بالطريق") || status.includes("تم التسليم") },
    { title: "السائق بالطريق", active: status.includes("بالطريق") || status.includes("تم التسليم") },
    { title: "تم التسليم", active: status.includes("تم التسليم") },
  ];

  return (
    <div className="bg-white text-black p-4 rounded-3xl mb-5 shadow-2xl">
      <h2 className="text-2xl font-black mb-2">تتبع طلبك</h2>

      <div className="bg-yellow-100 rounded-2xl p-4 mb-4">
        <p className="font-black">الحالة الحالية:</p>
        <p className="text-2xl font-black text-purple-700">{status}</p>
        <p className="mt-1 text-sm text-gray-700">
          المجموع: {(order.total || 0).toLocaleString()} د.ع
        </p>
      </div>

      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`p-3 rounded-2xl font-bold ${
              step.active
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {step.active ? "✅" : "⏳"} {step.title}
          </div>
        ))}
      </div>

      {order.driverName && (
        <div className="mt-4 bg-gray-100 rounded-2xl p-4">
          <p className="font-black">السائق:</p>
          <p className="text-xl font-black">{order.driverName}</p>

          {driverStatus?.phone && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href={`tel:${driverStatus.phone}`}
                className="bg-black text-white text-center rounded-xl py-3 font-bold"
              >
                اتصال بالسائق
              </a>

              <a
                href={`https://wa.me/964${driverStatus.phone.slice(1)}`}
                target="_blank"
                className="bg-green-600 text-white text-center rounded-xl py-3 font-bold"
              >
                واتساب السائق
              </a>
            </div>
          )}
        </div>
      )}

      {driverStatus?.latitude && driverStatus?.longitude && (
        <div className="mt-4">
          <h3 className="text-xl font-black mb-2">موقع السائق المباشر</h3>

          <div className="overflow-hidden rounded-3xl border">
            <iframe
              title="موقع السائق"
              className="w-full h-[320px]"
              loading="lazy"
              src={`https://maps.google.com/maps?q=${driverStatus.latitude},${driverStatus.longitude}&z=16&output=embed`}
            />
          </div>

          <a
            href={`https://www.google.com/maps?q=${driverStatus.latitude},${driverStatus.longitude}`}
            target="_blank"
            className="mt-3 block bg-purple-700 text-white text-center rounded-xl py-3 font-bold"
          >
            فتح موقع السائق على Google Maps
          </a>
        </div>
      )}
    </div>
  );
}