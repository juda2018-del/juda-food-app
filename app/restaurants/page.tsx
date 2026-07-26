"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";

type RestaurantDoc = {
  documentId: string;
  name?: string;
  title?: string;
  restaurantName?: string;
  desc?: string;
  description?: string;
  area?: string;
  category?: string;
  cuisine?: string;
  emoji?: string;
  image?: string;
  cover?: string;
  logo?: string;
  active?: boolean;
  open?: boolean;
  isOpen?: boolean;
  deliveryTime?: string;
  rating?: number;
};

const fallbackRestaurants: RestaurantDoc[] = [
  { documentId: "fayrouz", name: "فيروز", description: "فطور عراقي، كاهي وقيمر وبورك.", area: "زيونة", cuisine: "فطور", image: "/images/m2.jpg", open: true, active: true, rating: 4.9, deliveryTime: "20 - 30 دقيقة" },
  { documentId: "shalteta", name: "شلتتة", description: "مشلتت وفطائر حار وحلو.", area: "زيونة", cuisine: "فطور", image: "/images/m3.jpg", open: true, active: true, rating: 4.7, deliveryTime: "25 - 35 دقيقة" },
  { documentId: "khan", name: "خان قدوري", description: "أكلات عراقية شعبية ووجبات يومية.", area: "بغداد", cuisine: "مشاوي", image: "/images/m4.jpg", open: true, active: true, rating: 4.6, deliveryTime: "30 - 40 دقيقة" },
  { documentId: "alforn", name: "الفرن", description: "مناقيش، معجنات، كريب ووافل.", area: "بغداد", cuisine: "بيتزا", image: "/images/m5.jpg", open: true, active: true, rating: 4.5, deliveryTime: "30 - 40 دقيقة" },
];

function mergeRestaurants(remote: RestaurantDoc[]) {
  if (!remote.length) return fallbackRestaurants;
  const map = new Map(fallbackRestaurants.map((item) => [item.documentId, item]));
  remote.forEach((item) => map.set(item.documentId, { ...map.get(item.documentId), ...item }));
  return Array.from(map.values());
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<RestaurantDoc[]>(fallbackRestaurants);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [connectionWarning, setConnectionWarning] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "restaurants")),
      (snapshot) => {
        const remote = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<RestaurantDoc, "documentId">),
          documentId: item.id,
        }));
        setRestaurants(mergeRestaurants(remote));
        setConnectionWarning(false);
        setLoading(false);
      },
      () => {
        setRestaurants(fallbackRestaurants);
        setConnectionWarning(true);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const visibleRestaurants = useMemo(() => {
    const clean = search.trim().toLowerCase();
    return restaurants
      .filter((item) => item.active !== false)
      .filter((item) => {
        if (!clean) return true;
        const name = item.name || item.title || item.restaurantName || "";
        const haystack = `${name} ${item.desc || item.description || ""} ${item.area || ""} ${item.category || item.cuisine || ""}`.toLowerCase();
        return haystack.includes(clean);
      });
  }, [restaurants, search]);

  return (
    <main dir="rtl" className="page">
      <section className="phone">
        <header className="top">
          <Link href="/" className="back" aria-label="الرجوع للرئيسية">‹</Link>
          <div><p>FUSE Iraq</p><h1>المطاعم</h1></div>
          <Link href="/cart" className="cart">السلة</Link>
        </header>

        <section className="hero">
          <span>اختار مطعمك</span>
          <h2>كل مطاعم FUSE بمكان واحد</h2>
          <p>المطاعم الجديدة تظهر مباشرة من لوحة الإدارة بدون تحديث التطبيق.</p>
        </section>

        {connectionWarning && <div className="warning">تعذر تحديث المطاعم الآن؛ عرضنا آخر قائمة مستقرة حتى يبقى التطبيق شغال.</div>}

        <div className="search"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث عن مطعم أو منطقة..." /></div>

        <section className="grid">
          {loading && <div className="loading">جاري تحديث المطاعم...</div>}
          {visibleRestaurants.length === 0 ? <div className="empty">ماكو مطاعم مطابقة حالياً.</div> : visibleRestaurants.map((restaurant) => {
            const name = restaurant.name || restaurant.title || restaurant.restaurantName || "مطعم";
            const image = restaurant.image || restaurant.cover || restaurant.logo || "";
            const open = restaurant.open !== false && restaurant.isOpen !== false;
            return (
              <Link href={`/restaurants/${restaurant.documentId}`} className="card" key={restaurant.documentId}>
                <div className="icon">{image ? <img src={image} alt={name} /> : <span>{restaurant.emoji || "🍽️"}</span>}</div>
                <div>
                  <div className="name-row"><h3>{name}</h3><span className={open ? "open" : "closed"}>{open ? "مفتوح" : "مغلق"}</span></div>
                  <p>{restaurant.desc || restaurant.description || `${restaurant.category || restaurant.cuisine || "مطعم"} — ${restaurant.area || "بغداد"}`}</p>
                  <small>⭐ {Number(restaurant.rating || 5).toFixed(1)} · {restaurant.deliveryTime || "25 - 35 دقيقة"}</small>
                </div>
                <b>{open ? "اطلب" : "مغلق"}</b>
              </Link>
            );
          })}
        </section>

        <nav className="bottom" aria-label="التنقل الرئيسي">
          <Link href="/">الرئيسية</Link>
          <Link href="/restaurants" className="active">المطاعم</Link>
          <Link href="/reels">ريلز</Link>
          <Link href="/order-status">طلباتي</Link>
          <Link href="/profile">حسابي</Link>
        </nav>
      </section>

      <style jsx>{`
        *{box-sizing:border-box}.page{min-height:100vh;display:grid;place-items:start center;padding:24px;background:#efe8df;font-family:Arial,sans-serif;color:#151515}.phone{width:min(100%,430px);min-height:calc(100vh - 48px);border-radius:38px;background:linear-gradient(180deg,#fffaf4,#fff);padding:18px 18px 92px;box-shadow:0 34px 90px rgba(0,0,0,.12);position:relative}.top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}.top p{margin:0;color:#ff4d00;font-weight:900;font-size:13px}.top h1{margin:2px 0 0;font-size:30px;font-weight:950}.back,.cart{min-width:44px;height:44px;border-radius:16px;background:white;color:#151515;text-decoration:none;display:grid;place-items:center;padding:0 12px;font-weight:950;box-shadow:0 12px 28px rgba(0,0,0,.07)}.back{font-size:30px}.cart{color:#ff4d00;font-size:13px}.hero{border-radius:30px;padding:22px;background:linear-gradient(135deg,#151515,#2a2a2a);color:white;margin-bottom:14px;box-shadow:0 18px 44px rgba(0,0,0,.16)}.hero span{color:#ff8a00;font-weight:950}.hero h2{margin:8px 0;font-size:26px;font-weight:950;line-height:1.25}.hero p{margin:0;color:rgba(255,255,255,.75);line-height:1.8;font-weight:800}.warning{margin:0 0 12px;padding:12px 14px;border-radius:16px;background:#fff4d8;color:#7b5700;font-size:12px;font-weight:900;line-height:1.7}.search{margin-bottom:12px}.search input{width:100%;border:0;outline:0;border-radius:18px;background:#fff;padding:14px 16px;font:inherit;box-shadow:0 10px 26px rgba(0,0,0,.06)}.grid{display:grid;gap:12px}.card{display:grid;grid-template-columns:72px 1fr auto;gap:12px;align-items:center;text-decoration:none;color:#151515;background:white;border-radius:26px;padding:12px;box-shadow:0 14px 34px rgba(0,0,0,.08)}.icon{width:72px;height:72px;border-radius:22px;background:#fff3e9;display:grid;place-items:center;font-size:30px;overflow:hidden}.icon img{width:100%;height:100%;object-fit:cover}.name-row{display:flex;gap:8px;align-items:center;justify-content:space-between}.card h3{margin:0;font-size:19px;font-weight:950}.name-row span{font-size:10px;font-weight:900;border-radius:999px;padding:5px 8px}.open{background:#e2f7e8;color:#148b3c}.closed{background:#ffe4e4;color:#c53737}.card p{margin:5px 0;color:#777;font-size:12px;line-height:1.6;font-weight:800}.card small{color:#999;font-weight:800}.card>b{color:#ff4d00;font-size:12px}.empty,.loading{background:#fff;border-radius:22px;padding:18px;text-align:center;color:#777;font-weight:900}.loading{padding:10px;font-size:12px}.bottom{position:absolute;right:12px;left:12px;bottom:12px;height:66px;border-radius:22px;background:#fff;display:grid;grid-template-columns:repeat(5,1fr);align-items:center;box-shadow:0 14px 35px rgba(0,0,0,.14);overflow:hidden}.bottom a{height:100%;display:grid;place-items:center;text-decoration:none;color:#777;font-size:11px;font-weight:900}.bottom a.active{color:#ff4d00;background:#fff3ea}@media(max-width:520px){.page{padding:0}.phone{min-height:100vh;border-radius:0;box-shadow:none}.bottom{position:fixed;z-index:20}}
      `}</style>
    </main>
  );
}
