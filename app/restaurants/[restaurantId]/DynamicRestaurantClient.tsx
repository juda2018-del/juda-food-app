"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../../firebase";
import { addFuseCartItem, readFuseCart } from "@/lib/fuse-cart";

type RestaurantDoc = {
  documentId: string;
  name?: string;
  title?: string;
  restaurantName?: string;
  desc?: string;
  description?: string;
  category?: string;
  cuisine?: string;
  area?: string;
  address?: string;
  phone?: string;
  emoji?: string;
  image?: string;
  cover?: string;
  logo?: string;
  open?: boolean;
  isOpen?: boolean;
  active?: boolean;
  deliveryTime?: string;
  deliveryFee?: number;
  minOrder?: number;
  rating?: number;
};

type MenuDoc = {
  documentId: string;
  name?: string;
  title?: string;
  restaurantId?: string;
  restaurant?: string;
  restaurantName?: string;
  category?: string;
  price?: number;
  image?: string;
  available?: boolean;
  isAvailable?: boolean;
};

const fallbackRestaurants: RestaurantDoc[] = [
  { documentId: "fayrouz", name: "فيروز", description: "فطور عراقي، كاهي وقيمر وبورك.", area: "زيونة", cuisine: "فطور", image: "/images/m6.jpg", open: true, active: true, rating: 4.9, deliveryTime: "20 - 30 دقيقة" },
  { documentId: "shalteta", name: "شلتتة", description: "مشلتت وفطائر حار وحلو.", area: "زيونة", cuisine: "فطور", image: "/images/m7.jpg", open: true, active: true, rating: 4.7, deliveryTime: "25 - 35 دقيقة" },
  { documentId: "khan", name: "خان قدوري", description: "أكلات عراقية شعبية ووجبات يومية.", area: "بغداد", cuisine: "مشاوي", image: "/images/m4.jpg", open: true, active: true, rating: 4.6, deliveryTime: "30 - 40 دقيقة" },
  { documentId: "alforn", name: "الفرن", description: "مناقيش، معجنات، كريب ووافل.", area: "بغداد", cuisine: "بيتزا", image: "/images/m5.jpg", open: true, active: true, rating: 4.5, deliveryTime: "30 - 40 دقيقة" },
];

const fallbackMenu: MenuDoc[] = [
  { documentId: "fayrouz-makhlema", restaurantId: "fayrouz", name: "مخلمة", category: "فطور", price: 7000, image: "/images/m6.jpg", available: true },
  { documentId: "fayrouz-kahi", restaurantId: "fayrouz", name: "كاهي وقيمر", category: "كاهي", price: 5000, image: "/images/m6.jpg", available: true },
  { documentId: "fayrouz-baqala", restaurantId: "fayrouz", name: "باقلة بالدهن", category: "فطور", price: 6000, image: "/images/m6.jpg", available: true },
];

function formatIQD(value?: number) {
  return `${Number(value || 0).toLocaleString("ar-IQ")} د.ع`;
}

export default function DynamicRestaurantClient({ restaurantId: restaurantIdProp }: { restaurantId: string }) {
  const restaurantId = decodeURIComponent(restaurantIdProp || "");
  const [restaurants, setRestaurants] = useState<RestaurantDoc[]>(fallbackRestaurants);
  const [menu, setMenu] = useState<MenuDoc[]>(fallbackMenu);
  const [cartCount, setCartCount] = useState(0);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [connectionWarning, setConnectionWarning] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setRestaurants((current) => current.length ? current : fallbackRestaurants);
      setMenu((current) => current.length ? current : fallbackMenu);
      setLoading(false);
      setConnectionWarning(true);
    }, 4500);
    const unsubscribeRestaurants = onSnapshot(
      query(collection(db, "restaurants")),
      (snapshot) => {
        window.clearTimeout(timeout);
        const remote = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<RestaurantDoc, "documentId">),
          documentId: item.id,
        }));
        setRestaurants(remote.length ? remote : fallbackRestaurants);
        setLoading(false);
        setConnectionWarning(false);
      },
      () => {
        window.clearTimeout(timeout);
        setRestaurants(fallbackRestaurants);
        setLoading(false);
        setConnectionWarning(true);
      }
    );
    const unsubscribeMenu = onSnapshot(
      query(collection(db, "menu")),
      (snapshot) => {
        const remote = snapshot.docs.map((item) => ({
        ...(item.data() as Omit<MenuDoc, "documentId">),
        documentId: item.id,
        }));
        setMenu(remote.length ? remote : fallbackMenu);
      },
      () => { setMenu(fallbackMenu); setConnectionWarning(true); }
    );
    return () => {
      window.clearTimeout(timeout);
      unsubscribeRestaurants();
      unsubscribeMenu();
    };
  }, []);

  useEffect(() => {
    setCartCount(readFuseCart().reduce((sum, item) => sum + item.qty, 0));
  }, []);

  const restaurant = useMemo(() => {
    const clean = restaurantId.toLowerCase();
    return restaurants.find((item) => {
      const name = item.name || item.title || item.restaurantName || "";
      return item.documentId === restaurantId || name.toLowerCase() === clean;
    });
  }, [restaurantId, restaurants]);

  const restaurantName = restaurant?.name || restaurant?.title || restaurant?.restaurantName || "المطعم";
  const items = useMemo(() => menu.filter((item) => {
    const sameRestaurant = item.restaurantId === restaurantId || item.restaurantId === restaurant?.documentId;
    const sameName = item.restaurantName === restaurantName || item.restaurant === restaurantName;
    const available = item.available !== false && item.isAvailable !== false;
    return available && (sameRestaurant || sameName);
  }), [menu, restaurant, restaurantId, restaurantName]);

  function addItem(item: MenuDoc) {
    const next = addFuseCartItem({
      id: item.documentId,
      name: item.name || item.title || "صنف",
      restaurant: restaurantName,
      restaurantId: restaurant?.documentId || restaurantId,
      category: item.category || "عام",
      price: Number(item.price || 0),
      qty: 1,
      image: item.image,
    });
    setCartCount(next.reduce((sum, cartItem) => sum + cartItem.qty, 0));
    setNotice("تمت الإضافة للسلة");
    window.setTimeout(() => setNotice(""), 1800);
  }

  if (restaurants.length > 0 && !restaurant) {
    return <main dir="rtl" className="missing"><h1>المطعم غير موجود</h1><Link href="/restaurants">العودة للمطاعم</Link><style jsx>{`.missing{min-height:100vh;display:grid;place-content:center;gap:16px;text-align:center;font-family:Arial;background:#fff7ee}.missing a{color:#ff5b00;font-weight:900}`}</style></main>;
  }

  const isOpen = restaurant?.active !== false && restaurant?.open !== false && restaurant?.isOpen !== false;
  const image = restaurant?.image || restaurant?.cover || restaurant?.logo || "";

  return (
    <main dir="rtl" className="page restaurant-detail-page dynamic-restaurant-page">
      <section className="phone">
        <header className="customer-header">
          <Link href="/restaurants/" className="back" aria-label="العودة إلى المطاعم">‹</Link>
          <div><small>FUSE IRAQ</small><b>{restaurantName}</b></div>
          <Link href="/cart" className="cart">السلة {cartCount ? `(${cartCount})` : ""}</Link>
        </header>

        {loading ? <div className="state-card">جاري تحميل المطعم…</div> : null}
        {connectionWarning ? <div className="state-card">تعذر تحديث المطعم الآن. ارجع لقائمة المطاعم وحاول مرة ثانية.</div> : null}

        <section className="hero" style={image ? { backgroundImage: `linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.78)),url(${image})` } : undefined}>
          <span className="emoji">{restaurant?.emoji || "🍽️"}</span>
          <div>
            <p>{restaurant?.category || restaurant?.cuisine || "مطعم"} · {restaurant?.area || "بغداد"}</p>
            <h1>{restaurantName}</h1>
            <p>{restaurant?.desc || restaurant?.description || "اطلب وجبتك المفضلة مباشرة من FUSE."}</p>
          </div>
        </section>

        <section className="info">
          <div><span>الحالة</span><b className={isOpen ? "green" : "red"}>{isOpen ? "مفتوح" : "مغلق"}</b></div>
          <div><span>التوصيل</span><b>{restaurant?.deliveryTime || "25 - 35 دقيقة"}</b></div>
          <div><span>التقييم</span><b>⭐ {Number(restaurant?.rating || 5).toFixed(1)}</b></div>
          <div><span>الأدنى</span><b>{formatIQD(restaurant?.minOrder)}</b></div>
        </section>

        <div className="title"><div><small>المنيو</small><h2>اختار وجبتك</h2></div><span>{items.length} صنف</span></div>

        <section className="menu">
          {items.length === 0 ? <div className="empty"><h3>المنيو قيد الإضافة</h3><p>تظهر الأصناف هنا فور إضافتها من لوحة الإدارة.</p></div> : items.map((item) => (
            <article key={item.documentId}>
              <div className="item-image">{item.image ? <img src={item.image} alt={item.name || "صنف"} /> : <span>🍴</span>}</div>
              <div className="copy"><small>{item.category || "عام"}</small><h3>{item.name || item.title || "صنف"}</h3><b>{formatIQD(item.price)}</b></div>
              <button disabled={!isOpen} onClick={() => addItem(item)}>+</button>
            </article>
          ))}
        </section>

        {restaurant?.address || restaurant?.phone ? <section className="contact"><b>معلومات المطعم</b><p>{restaurant.address || restaurant.area}</p>{restaurant.phone ? <a href={`tel:${restaurant.phone}`}>{restaurant.phone}</a> : null}</section> : null}
        {notice ? <div className="toast">{notice}</div> : null}
      </section>

      <style jsx>{`
        *{box-sizing:border-box}.page{min-height:100vh;background:transparent;display:block;padding:calc(14px + env(safe-area-inset-top)) 14px calc(104px + env(safe-area-inset-bottom));font-family:var(--fuse-body-font);color:#15171a}.phone{width:min(100%,430px);min-height:0;margin:0 auto;background:transparent;border-radius:0;padding:0;box-shadow:none;position:relative}header{display:grid;grid-template-columns:48px 1fr auto;gap:12px;align-items:center;margin-bottom:14px;padding:8px 10px;border-radius:28px;background:rgba(255,252,247,.82);border:1px solid rgba(255,255,255,.95);box-shadow:0 10px 28px rgba(21,23,26,.08);backdrop-filter:blur(22px)}header div{display:grid;text-align:center}header small{color:#1f7a4f;font-weight:900;font-size:10px}header b{font-size:16px;color:#15171a}.back,.cart{height:46px;text-decoration:none;font-weight:900}.back{width:46px;border-radius:50%;display:grid;place-items:center;background:rgba(255,252,247,.9);border:1px solid rgba(21,23,26,.08);color:#1f7a4f;font-size:28px;line-height:1;box-shadow:0 8px 22px rgba(21,23,26,.06)}.cart{padding:0 12px;border-radius:18px;display:grid;place-items:center;background:linear-gradient(135deg,#1f7a4f,#2f915f);color:#fff;font-size:12px;box-shadow:0 10px 24px rgba(31,122,79,.2)}.hero{min-height:250px;border-radius:28px;background:linear-gradient(135deg,#1a2235,#263759);background-size:cover;background-position:center;color:#fff;padding:22px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 16px 42px rgba(26,34,53,.16)}.emoji{font-size:44px}.hero p{margin:4px 0;color:rgba(255,255,255,.78);line-height:1.7;font-weight:700}.hero h1{font-size:34px;margin:4px 0}.info{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin:12px 0}.info div{background:rgba(255,252,247,.86);border-radius:18px;padding:12px;display:grid;gap:5px;border:1px solid rgba(255,255,255,.92);backdrop-filter:blur(18px)}.info span{font-size:11px;color:#888;font-weight:800}.info b{font-size:13px}.green{color:#1f7a4f}.red{color:#d63b3b}.title{display:flex;justify-content:space-between;align-items:end;margin:20px 2px 10px}.title small{color:#1f7a4f;font-weight:900}.title h2{margin:2px 0 0;font-size:25px}.title span{font-size:12px;color:#777;font-weight:800}.menu{display:grid;gap:10px}.menu article{display:grid;grid-template-columns:82px 1fr 42px;gap:12px;align-items:center;background:rgba(255,252,247,.86);border-radius:22px;padding:10px;border:1px solid rgba(255,255,255,.92);box-shadow:0 10px 28px rgba(21,23,26,.07);backdrop-filter:blur(18px)}.item-image{width:82px;height:82px;border-radius:50%;background:rgba(255,255,255,.72);overflow:hidden;display:grid;place-items:center;font-size:30px;border:1px solid rgba(21,23,26,.06)}.item-image img{width:100%;height:100%;object-fit:cover}.copy{display:grid;gap:4px}.copy small{color:#1f7a4f;font-weight:900}.copy h3{margin:0;font-size:17px}.copy b{font-size:14px;color:#15171a}.menu button{width:42px;height:42px;border:0;border-radius:50%;background:linear-gradient(135deg,#1f7a4f,#2f915f);color:#fff;font-size:26px;font-weight:900;box-shadow:0 10px 24px rgba(31,122,79,.2)}.menu button:disabled{background:#bbb;box-shadow:none}.empty,.contact{background:rgba(255,252,247,.86);border-radius:22px;padding:20px;text-align:center;border:1px solid rgba(21,23,26,.06)}.empty h3{margin:0}.empty p,.contact p{color:#777}.contact{margin-top:12px}.contact a{color:#1f7a4f;font-weight:900}.toast{position:fixed;bottom:calc(96px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);background:#15171a;color:#fff;padding:13px 20px;border-radius:999px;font-weight:900;z-index:20}@media(max-width:520px){.page{padding-inline:14px}}
      `}</style>
    </main>
  );
}
