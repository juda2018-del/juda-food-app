"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";
import FuseIcon from "@/components/FuseIcon";

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

function RestaurantImage({ src, name }: { src?: string; name: string; fallback?: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span className="image-fallback" aria-label={name}>
        <FuseIcon name="store" size="lg" />
      </span>
    );
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
          <Link href="/" className="back fuse-back-btn" aria-label="الرئيسية">
            <FuseIcon name="chevron-back" />
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
                  <small className="rating-line"><FuseIcon name="star" size="sm" /> {Number(restaurant.rating || 5).toFixed(1)} · {restaurant.deliveryTime || "25 - 35 دقيقة"}</small>
                </div>
              </a>
            );
          })}
        </section>

      </section>

    </main>
  );
}
