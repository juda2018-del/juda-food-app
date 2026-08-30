"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import FuseIcon from "@/components/FuseIcon";
import { db } from "../firebase";

type OfferItem = {
  id: string;
  name: string;
  restaurantId: string;
  restaurantName: string;
  price: number;
  oldPrice: number;
  image: string;
};

const LOAD_TIMEOUT_MS = 7000;

function money(value: number) {
  return `${Math.round(value).toLocaleString("en-US")} د.ع`;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = LOAD_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error("TIMEOUT")), timeoutMs);
    }),
  ]);
}

export default function OffersPage() {
  const [items, setItems] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setMessage("");

    (async () => {
      try {
        const snap = await withTimeout(getDocs(collection(db, "menu")));
        if (!active) return;
        const next = snap.docs.flatMap((entry) => {
          const data = entry.data();
          const price = Number(data.price || 0);
          const oldPrice = Number(data.oldPrice || data.originalPrice || data.beforePrice || 0);
          const available = data.available !== false && data.isAvailable !== false && data.active !== false;
          if (!available || !Number.isFinite(price) || !Number.isFinite(oldPrice) || price <= 0 || oldPrice <= price) return [];
          return [{
            id: entry.id,
            name: String(data.name || data.title || "عرض"),
            restaurantId: String(data.restaurantId || ""),
            restaurantName: String(data.restaurantName || data.restaurant || "مطعم"),
            price,
            oldPrice,
            image: String(data.image || data.imageUrl || data.photo || ""),
          } satisfies OfferItem];
        });
        setItems(next);
      } catch {
        if (active) {
          setItems([]);
          setMessage("تعذر تحميل العروض حالياً. تحقق من الإنترنت وحاول مرة ثانية.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [retry]);

  const sorted = useMemo(
    () => [...items].sort((a, b) => ((b.oldPrice - b.price) / b.oldPrice) - ((a.oldPrice - a.price) / a.oldPrice)),
    [items]
  );

  return (
    <main dir="rtl" className="app">
      <header className="top customer-header">
        <Link href="/profile" className="back fuse-back-btn" aria-label="الرجوع">
          <FuseIcon name="chevron-back" />
        </Link>
        <div className="title">
          <h1>العروض</h1>
          <p>خصومات حقيقية من المنيو</p>
        </div>
        <div className="space" aria-hidden="true" />
      </header>

      <section className="hero">
        <h2>
          <span className="hero-icon-inline"><FuseIcon name="gift" size="sm" /></span>
          عروض FUSE
        </h2>
        <p>نظهر فقط الأصناف التي تحتوي سعراً سابقاً أعلى من السعر الحالي.</p>
      </section>

      {loading ? (
        <section className="state form-card">
          <span className="fuse-spinner" />
          جاري تحميل العروض...
        </section>
      ) : null}
      {!loading && message ? (
        <section className="state error form-card">
          <b>{message}</b>
          <button type="button" className="btn-primary" onClick={() => setRetry((value) => value + 1)}>
            إعادة المحاولة
          </button>
        </section>
      ) : null}
      {!loading && !message && !sorted.length ? (
        <section className="state form-card">
          <b>ماكو عروض فعالة حالياً</b>
          <p>أي خصم يضيفه المطعم إلى المنيو راح يظهر هنا تلقائياً.</p>
          <Link href="/restaurants" className="btn-primary">تصفح المطاعم</Link>
        </section>
      ) : null}

      <section className="offer-grid">
        {sorted.map((item) => {
          const percent = Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100);
          const href = item.restaurantId ? `/restaurants/${encodeURIComponent(item.restaurantId)}` : "/restaurants";
          return (
            <Link href={href} className="offer-card form-card" key={item.id}>
              <div className="visual">
                {item.image ? <img src={item.image} alt={item.name} /> : <span>{item.name.slice(0, 1)}</span>}
                <b className="badge">خصم {percent}%</b>
              </div>
              <div className="info">
                <h3>{item.name}</h3>
                <p>{item.restaurantName}</p>
                <div><strong>{money(item.price)}</strong><del>{money(item.oldPrice)}</del></div>
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
