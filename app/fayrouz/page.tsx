 "use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { collection, addDoc, onSnapshot, doc } from "firebase/firestore";
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

type CartItem = MenuItem & { qty: number };

type OrderTrack = {
  documentId: string;
  restaurant?: string;
  customerName?: string;
  phone?: string;
  address?: string;
  total?: number;
  status?: string;
  driverName?: string;
};

type DriverStatus = {
  name?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
};

const categories = ["الكل", "الفطور", "كاهي وبورك", "مشروبات", "سيت منيو"];

export default function Fayrouz() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [locationLink, setLocationLink] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [position, setPosition] = useState<[number, number]>([33.3152, 44.3661]);

  const [lastOrderId, setLastOrderId] = useState("");
  const [trackingOrder, setTrackingOrder] = useState<OrderTrack | null>(null);
  const [driverStatus, setDriverStatus] = useState<DriverStatus | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    setLastOrderId(localStorage.getItem("lastFayrouzOrderId") || "");
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "menuItems"), (snapshot) => {
      const data = snapshot.docs
        .map((doc) => doc.data() as MenuItem)
        .filter((item) => item.active !== false)
        .filter((item) => !item.restaurant || item.restaurant === "فيروز");

      setMenuItems(data);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!lastOrderId) return;

    const unsub = onSnapshot(doc(db, "orders", lastOrderId), (snap) => {
      if (snap.exists()) {
        setTrackingOrder({ documentId: snap.id, ...snap.data() } as OrderTrack);
      }
    });

    return () => unsub();
  }, [lastOrderId]);

  useEffect(() => {
    if (!trackingOrder?.driverName) {
      setDriverStatus(null);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "driversStatus", trackingOrder.driverName),
      (snap) => {
        if (snap.exists()) setDriverStatus(snap.data() as DriverStatus);
      }
    );

    return () => unsub();
  }, [trackingOrder?.driverName]);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const filteredItems = menuItems.filter((item) => {
    const byCategory =
      selectedCategory === "الكل" || item.category === selectedCategory;
    const bySearch = item.name.toLowerCase().includes(search.toLowerCase());
    return byCategory && bySearch;
  });

  const getQty = (name: string) =>
    cart.find((item) => item.name === name)?.qty || 0;

  const addToCart = (item: MenuItem) => {
    setCart((old) => {
      const found = old.find((x) => x.name === item.name);
      if (found) {
        return old.map((x) =>
          x.name === item.name ? { ...x, qty: x.qty + 1 } : x
        );
      }
      return [...old, { ...item, qty: 1 }];
    });
  };

  const removeOne = (name: string) => {
    setCart((old) =>
      old.map((x) => (x.name === name ? { ...x, qty: x.qty - 1 } : x)).filter((x) => x.qty > 0)
    );
  };

  const updateLocation = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    const link = `https://www.google.com/maps?q=${lat},${lng}`;
    setLocationLink(link);
    setAddress((old) =>
      old
        ? `${old.split(" - موقع الخريطة")[0]} - موقع الخريطة: ${link}`
        : `موقع الخريطة: ${link}`
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
      },
      () => {
        setLocationLoading(false);
        alert("ما قدرنا نحدد الموقع. فعّل صلاحية الموقع وجرب مرة ثانية");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
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
          `• ${item.name} × ${item.qty} = ${(item.price * item.qty).toLocaleString()} د.ع`
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

    const docRef = await addDoc(collection(db, "orders"), {
      id: Date.now(),
      restaurant: "فيروز",
      customerName,
      phone,
      address,
      locationLink,
      location: { lat: position[0], lng: position[1] },
      items: cart,
      total,
      status: "جديد",
      createdAt: new Date().toLocaleString("ar-IQ"),
    });

    localStorage.setItem("lastFayrouzOrderId", docRef.id);
    setLastOrderId(docRef.id);
    setCart([]);
    setCheckoutOpen(false);

    window.open(
      `https://wa.me/9647733778077?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; }

        body {
          margin: 0;
          font-family: "Cairo", sans-serif;
          background: #efe8df;
        }

        .app {
          width: 100%;
          max-width: 430px;
          min-height: 100vh;
          margin: 0 auto;
          padding-bottom: 105px;
          direction: rtl;
          background: linear-gradient(180deg, #fffaf4 0%, #ffffff 100%);
          color: #151515;
        }

        .hero {
          height: 310px;
          position: relative;
          overflow: hidden;
          border-bottom-left-radius: 34px;
          border-bottom-right-radius: 34px;
        }

        .hero img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hero::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,.70), rgba(0,0,0,.10));
        }

        .topbar {
          position: absolute;
          top: 18px;
          left: 18px;
          right: 18px;
          z-index: 3;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .topbtn {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          border: 0;
          background: rgba(255,255,255,.92);
          color: #151515;
          display: grid;
          place-items: center;
          text-decoration: none;
          font-weight: 900;
          box-shadow: 0 12px 26px rgba(0,0,0,.16);
        }

        .hero-info {
          position: absolute;
          z-index: 3;
          right: 18px;
          left: 18px;
          bottom: 20px;
          color: white;
        }

        .status {
          display: inline-flex;
          background: #ff4d00;
          color: white;
          padding: 8px 13px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 10px;
        }

        .hero-info h1 {
          margin: 0;
          font-size: 42px;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .hero-info p {
          margin: 8px 0 14px;
          color: rgba(255,255,255,.86);
          font-size: 14px;
          font-weight: 700;
        }

        .stats {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .stats span {
          background: rgba(255,255,255,.92);
          color: #151515;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
        }

        .content {
          padding: 18px;
        }

        .tracking, .checkout {
          background: white;
          border-radius: 26px;
          padding: 16px;
          box-shadow: 0 14px 34px rgba(0,0,0,.07);
          margin-bottom: 18px;
        }

        .tracking h2, .checkout h2 {
          margin: 0 0 12px;
          font-size: 20px;
          font-weight: 900;
        }

        .track-status {
          background: #fff3e9;
          border-radius: 20px;
          padding: 13px;
          font-weight: 900;
          margin-bottom: 12px;
          color: #ff4d00;
        }

        .search {
          height: 54px;
          border-radius: 21px;
          background: white;
          box-shadow: 0 12px 28px rgba(0,0,0,.06);
          display: flex;
          align-items: center;
          padding: 0 16px;
          color: #999;
          margin-bottom: 14px;
        }

        .search input {
          width: 100%;
          border: 0;
          outline: none;
          background: transparent;
          font-family: inherit;
          font-weight: 800;
          color: #151515;
        }

        .tabs {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 8px;
          margin-bottom: 16px;
          scrollbar-width: none;
        }

        .tabs::-webkit-scrollbar { display: none; }

        .tab {
          flex: 0 0 auto;
          border: 0;
          border-radius: 999px;
          padding: 11px 18px;
          background: white;
          color: #151515;
          font-family: inherit;
          font-weight: 900;
          box-shadow: 0 10px 24px rgba(0,0,0,.06);
        }

        .tab.active {
          background: #ff4d00;
          color: white;
          box-shadow: 0 12px 26px rgba(255,77,0,.25);
        }

        .section-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 10px 0 14px;
        }

        .section-title h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 900;
        }

        .section-title span {
          color: #ff4d00;
          font-size: 12px;
          font-weight: 900;
        }

        .items {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .item {
          background: white;
          border-radius: 25px;
          padding: 12px;
          display: grid;
          grid-template-columns: 102px 1fr;
          gap: 13px;
          box-shadow: 0 12px 30px rgba(0,0,0,.07);
        }

        .item-img {
          width: 102px;
          height: 102px;
          border-radius: 22px;
          overflow: hidden;
          background: #f5f1eb;
          display: grid;
          place-items: center;
          font-size: 34px;
        }

        .item-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 900;
          line-height: 1.35;
        }

        .item .cat-name {
          margin: 4px 0 8px;
          font-size: 12px;
          color: #888;
          font-weight: 800;
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .price {
          color: #ff4d00;
          font-size: 15px;
          font-weight: 900;
        }

        .add {
          min-width: 42px;
          height: 36px;
          border: 0;
          border-radius: 14px;
          background: #ff4d00;
          color: white;
          font-size: 20px;
          font-weight: 900;
        }

        .qty {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ff4d00;
          color: white;
          border-radius: 14px;
          padding: 5px 7px;
          font-weight: 900;
        }

        .qty button {
          width: 28px;
          height: 28px;
          border: 0;
          border-radius: 10px;
          background: white;
          color: #151515;
          font-size: 18px;
          font-weight: 900;
        }

        .input, .textarea {
          width: 100%;
          border: 0;
          outline: none;
          border-radius: 18px;
          background: #f8f3ee;
          padding: 14px 15px;
          font-family: inherit;
          font-weight: 800;
          margin-bottom: 10px;
          color: #151515;
        }

        .textarea {
          min-height: 84px;
          resize: none;
        }

        .orange-btn {
          width: 100%;
          border: 0;
          border-radius: 18px;
          background: #ff4d00;
          color: white;
          padding: 14px;
          font-family: inherit;
          font-weight: 900;
          margin-bottom: 10px;
          box-shadow: 0 12px 26px rgba(255,77,0,.22);
        }

        .map {
          overflow: hidden;
          border-radius: 22px;
          margin-top: 10px;
        }

        .cartbar {
          position: fixed;
          left: 50%;
          bottom: 14px;
          transform: translateX(-50%);
          width: calc(100% - 32px);
          max-width: 398px;
          background: #151515;
          color: white;
          border-radius: 26px;
          padding: 13px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 20px 45px rgba(0,0,0,.28);
          z-index: 80;
        }

        .cartbar p {
          margin: 0;
          font-size: 12px;
          color: #aaa;
          font-weight: 800;
        }

        .cartbar b {
          font-size: 16px;
          font-weight: 900;
        }

        .cartbar button {
          border: 0;
          border-radius: 18px;
          background: #ff4d00;
          color: white;
          padding: 13px 18px;
          font-family: inherit;
          font-weight: 900;
        }
      `}</style>

      <main className="app">
        <section className="hero">
          <img src="/images/fayrouz.jpg" alt="فيروز" />

          <div className="topbar">
            <a href="/" className="topbtn">‹</a>
            <button className="topbtn">♡</button>
          </div>

          <div className="hero-info">
            <div className="status">مفتوح الآن</div>
            <h1>فيروز</h1>
            <p>كاهي، قيمر، بورك وفطور عراقي أصيل</p>
            <div className="stats">
              <span>⭐ 4.8</span>
              <span>25-35 د</span>
              <span>توصيل سريع</span>
            </div>
          </div>
        </section>

        <section className="content">
          {trackingOrder && (
            <div className="tracking">
              <h2>تتبع طلبك</h2>
              <div className="track-status">{trackingOrder.status || "جديد"}</div>
              <p>المجموع: {(trackingOrder.total || 0).toLocaleString()} د.ع</p>
              {trackingOrder.driverName && <p>السائق: {trackingOrder.driverName}</p>}
              {driverStatus?.latitude && driverStatus?.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${driverStatus.latitude},${driverStatus.longitude}`}
                  target="_blank"
                  className="orange-btn"
                  style={{ display: "block", textAlign: "center", textDecoration: "none" }}
                >
                  فتح موقع السائق
                </a>
              )}
            </div>
          )}

          {checkoutOpen && (
            <div className="checkout">
              <h2>بيانات الطلب</h2>

              <input
                className="input"
                placeholder="اسم الزبون"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />

              <input
                className="input"
                placeholder="رقم الهاتف"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <textarea
                className="textarea"
                placeholder="العنوان أو أقرب نقطة دالة"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />

              <button
                className="orange-btn"
                onClick={getCurrentLocation}
                disabled={locationLoading}
              >
                {locationLoading ? "جاري تحديد الموقع..." : "تحديد موقعي"}
              </button>

              {locationLink && (
                <a
                  href={locationLink}
                  target="_blank"
                  className="orange-btn"
                  style={{ display: "block", textAlign: "center", textDecoration: "none" }}
                >
                  فتح الموقع على Google Maps
                </a>
              )}

              <div className="map">
                <LocationMap
                  position={position}
                  setPosition={(pos: [number, number]) =>
                    updateLocation(pos[0], pos[1])
                  }
                />
              </div>

              <button className="orange-btn" onClick={sendOrder}>
                تأكيد وإرسال الطلب
              </button>
            </div>
          )}

          <div className="search">
            <input
              placeholder="ابحث عن صنف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? "tab active" : "tab"}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="section-title">
            <span>{filteredItems.length} صنف</span>
            <h2>{selectedCategory === "الكل" ? "قائمة الطعام" : selectedCategory}</h2>
          </div>

          <section className="items">
            {filteredItems.map((item, index) => {
              const qty = getQty(item.name);

              return (
                <div className="item" key={`${item.name}-${index}`}>
                  <div className="item-img">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      "🍽️"
                    )}
                  </div>

                  <div>
                    <h3>{item.name}</h3>
                    <p className="cat-name">{item.category}</p>

                    <div className="price-row">
                      <div className="price">{item.price.toLocaleString()} د.ع</div>

                      {qty > 0 ? (
                        <div className="qty">
                          <button onClick={() => removeOne(item.name)}>-</button>
                          <span>{qty}</span>
                          <button onClick={() => addToCart(item)}>+</button>
                        </div>
                      ) : (
                        <button className="add" onClick={() => addToCart(item)}>
                          +
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        </section>

        {cartCount > 0 && (
          <div className="cartbar">
            <div>
              <p>السلة</p>
              <b>{cartCount} صنف • {total.toLocaleString()} د.ع</b>
            </div>

            <button onClick={() => setCheckoutOpen(true)}>إتمام الطلب</button>
          </div>
        )}
      </main>
    </>
  );
}