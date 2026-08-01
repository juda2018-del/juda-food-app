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
  { documentId: "fayrouz", name: "فيروز", description: "فطور عراقي، كاهي وقيمر وبورك.", area: "زيونة", cuisine: "فطور", image: "/images/m6.jpg", open: true, active: true, rating: 4.9, deliveryTime: "20 - 30 دقيقة" },
  { documentId: "shalteta", name: "شلتتة", description: "مشلتت وفطائر حار وحلو.", area: "زيونة", cuisine: "فطور", image: "/images/m7.jpg", open: true, active: true, rating: 4.7, deliveryTime: "25 - 35 دقيقة" },
  { documentId: "khan", name: "خان قدوري", description: "أكلات عراقية شعبية ووجبات يومية.", area: "بغداد", cuisine: "مشاوي", image: "/images/m4.jpg", open: true, active: true, rating: 4.6, deliveryTime: "30 - 40 دقيقة" },
  { documentId: "alforn", name: "الفرن", description: "مناقيش، معجنات، كريب ووافل.", area: "بغداد", cuisine: "بيتزا", image: "/images/m5.jpg", open: true, active: true, rating: 4.5, deliveryTime: "30 - 40 دقيقة" },
];

function mergeRestaurants(remote: RestaurantDoc[]) {
  if (!remote.length) return fallbackRestaurants;
  const map = new Map(fallbackRestaurants.map((item) => [item.documentId, item]));
  remote.forEach((item) => map.set(item.documentId, { ...map.get(item.documentId), ...item }));
  return Array.from(map.values());
}

function RestaurantImage({ src, name, fallback }: { src?: string; name: string; fallback?: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <span className="image-fallback" aria-label={name}>{fallback || name.slice(0, 1) || "🍽️"}</span>;
  }

  return <img src={src} alt={name} onError={() => setFailed(true)} />;
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<RestaurantDoc[]>(fallbackRestaurants);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [connectionWarning, setConnectionWarning] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setRestaurants((current) => current.length ? current : fallbackRestaurants);
      setConnectionWarning(true);
      setLoading(false);
    }, 3500);
    const unsubscribe = onSnapshot(
      query(collection(db, "restaurants")),
      (snapshot) => {
        window.clearTimeout(timeout);
        const remote = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<RestaurantDoc, "documentId">),
          documentId: item.id,
        }));
        setRestaurants(mergeRestaurants(remote));
        setConnectionWarning(false);
        setLoading(false);
      },
      () => {
        window.clearTimeout(timeout);
        setRestaurants(fallbackRestaurants);
        setConnectionWarning(true);
        setLoading(false);
      }
    );
    return () => {
      window.clearTimeout(timeout);
      unsubscribe();
    };
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
    <main dir="rtl" className="page restaurants-page">
      <section className="phone">
        <header className="top customer-header">
          <Link href="/notification-center" className="back" aria-label="الإشعارات">
            <span aria-hidden="true">♢</span>
          </Link>
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
              <a href={`/restaurants/${restaurant.documentId}/`} className="card" key={restaurant.documentId}>
                <div className="icon"><RestaurantImage src={image} name={name} fallback={restaurant.emoji} /></div>
                <div>
                  <div className="name-row"><h3>{name}</h3><span className={open ? "open" : "closed"}>{open ? "مفتوح" : "مغلق"}</span></div>
                  <p>{restaurant.desc || restaurant.description || `${restaurant.category || restaurant.cuisine || "مطعم"} — ${restaurant.area || "بغداد"}`}</p>
                  <small>⭐ {Number(restaurant.rating || 5).toFixed(1)} · {restaurant.deliveryTime || "25 - 35 دقيقة"}</small>
                </div>
                <b>{open ? "اطلب" : "مغلق"}</b>
              </a>
            );
          })}
        </section>

      </section>

      <style jsx>{`
        *{box-sizing:border-box}.page{min-height:100dvh;display:grid;place-items:start center;background:#efe8df;font-family:var(--fuse-body-font);color:#151515}.phone{width:min(100%,430px);min-height:100dvh;background:linear-gradient(180deg,#fffaf4,#fff);padding:calc(14px + env(safe-area-inset-top)) 16px 112px}.top{display:grid;grid-template-columns:84px 1fr 58px;align-items:center;gap:8px;margin-bottom:14px}.top>div{text-align:center}.top p{margin:0;color:#ff4d00;font-weight:900;font-size:12px}.top h1{margin:2px 0 0;font-size:27px;font-weight:950}.back,.cart{height:46px;border-radius:16px;text-decoration:none;font-weight:950;box-shadow:0 8px 22px rgba(0,0,0,.08)}.back{direction:rtl;background:#171717;color:#fff;display:flex;align-items:center;justify-content:center;gap:5px;padding:0 10px}.back span{font-size:19px}.back b{font-size:11px;white-space:nowrap}.cart{display:grid;place-items:center;background:#fff;color:#ff4d00;font-size:12px}.hero{border-radius:24px;padding:19px;background:linear-gradient(135deg,#151515,#2a2a2a);color:white;margin-bottom:14px;box-shadow:0 14px 36px rgba(0,0,0,.14)}.hero span{color:#ff8a00;font-weight:950}.hero h2{margin:8px 0;font-size:23px;font-weight:950;line-height:1.3}.hero p{margin:0;color:rgba(255,255,255,.75);line-height:1.75;font-size:12px;font-weight:700}.warning{margin:0 0 12px;padding:12px 14px;border-radius:16px;background:#fff4d8;color:#7b5700;font-size:12px;font-weight:900;line-height:1.7}.search{margin-bottom:12px}.search input{width:100%;height:50px;border:1px solid #eee4db;outline:0;border-radius:17px;background:#fff;padding:0 16px;font:inherit;box-shadow:0 8px 22px rgba(0,0,0,.05)}.grid{display:grid;grid-template-columns:1fr;gap:12px}.card{display:grid;grid-template-columns:88px minmax(0,1fr);gap:13px;align-items:center;text-decoration:none;color:#151515;background:#fff;border:1px solid #f1e7dd;border-radius:22px;padding:11px;box-shadow:0 9px 24px rgba(0,0,0,.06);position:relative;min-height:112px}.icon{width:88px;height:88px;border-radius:19px;background:#fff3e9;display:grid;place-items:center;font-size:30px;overflow:hidden}.icon img,.image-fallback{width:100%;height:100%}.icon img{object-fit:cover;display:block}.image-fallback{display:grid;place-items:center;background:linear-gradient(135deg,#222,#443a32);color:#ff6a00;font-size:30px;font-weight:950}.name-row{display:flex;gap:8px;align-items:center;justify-content:space-between}.card h3{margin:0;font-size:17px;font-weight:950}.name-row span{font-size:10px;font-weight:900;border-radius:999px;padding:5px 8px;white-space:nowrap}.open{background:#e2f7e8;color:#148b3c}.closed{background:#ffe4e4;color:#c53737}.card p{margin:6px 0;color:#6f6a65;font-size:12px;line-height:1.55;font-weight:700;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.card small{color:#8b847e;font-size:11px;font-weight:800}.card>b{display:none}.empty,.loading{background:#fff;border-radius:20px;padding:16px;text-align:center;color:#777;font-weight:900}.loading{padding:10px;font-size:12px}@media(max-width:360px){.phone{padding-inline:12px}.top{grid-template-columns:76px 1fr 54px}.back b{font-size:10px}.card{grid-template-columns:76px minmax(0,1fr)}.icon{width:76px;height:76px}}
      `}</style>
    </main>
  );
}
