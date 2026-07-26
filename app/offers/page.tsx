"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
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

function money(value: number) {
  return `${Math.round(value).toLocaleString("en-US")} د.ع`;
}

export default function OffersPage() {
  const [items, setItems] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "menu"));
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
        if (active) setItems(next);
      } catch {
        if (active) setMessage("تعذر تحميل العروض حالياً.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const sorted = useMemo(() => [...items].sort((a, b) => ((b.oldPrice - b.price) / b.oldPrice) - ((a.oldPrice - a.price) / a.oldPrice)), [items]);

  return (
    <main dir="rtl" className="app">
      <header className="top">
        <Link href="/profile" className="back" aria-label="الرجوع">‹</Link>
        <div className="title"><h1>العروض</h1><p>خصومات حقيقية من المنيو</p></div>
        <div className="space" />
      </header>

      <section className="hero"><h2>🔥 عروض FUSE</h2><p>نظهر فقط الأصناف التي تحتوي سعراً سابقاً أعلى من السعر الحالي.</p></section>

      {loading ? <section className="state">جاري تحميل العروض...</section> : null}
      {!loading && message ? <section className="state error">{message}</section> : null}
      {!loading && !message && !sorted.length ? (
        <section className="state"><b>ماكو عروض فعالة حالياً</b><p>أي خصم يضيفه المطعم إلى المنيو راح يظهر هنا تلقائياً.</p><Link href="/restaurants">تصفح المطاعم</Link></section>
      ) : null}

      <section className="grid">
        {sorted.map((item) => {
          const percent = Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100);
          const href = item.restaurantId ? `/restaurants/${encodeURIComponent(item.restaurantId)}` : "/restaurants";
          return (
            <Link href={href} className="card" key={item.id}>
              <div className="visual">
                {item.image ? <img src={item.image} alt={item.name} /> : <span>{item.name.slice(0, 1)}</span>}
                <b className="badge">خصم {percent}%</b>
              </div>
              <div className="info"><h3>{item.name}</h3><p>{item.restaurantName}</p><div><strong>{money(item.price)}</strong><del>{money(item.oldPrice)}</del></div></div>
            </Link>
          );
        })}
      </section>

      <style jsx>{`
        :global(*){box-sizing:border-box}:global(body){margin:0;background:#efe8df;font-family:Arial,"Cairo",sans-serif;color:#181818}
        .app{width:100%;max-width:430px;min-height:100dvh;margin:auto;padding:18px 18px 100px;background:linear-gradient(180deg,#fffaf4,#fff)}
        .top{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.back,.space{width:44px;height:44px}.back{display:grid;place-items:center;border-radius:16px;background:#fff;color:#181818;text-decoration:none;font-size:28px;font-weight:900;box-shadow:0 10px 28px rgba(0,0,0,.08)}
        .title{text-align:center}.title h1{margin:0;font-size:28px;font-weight:950}.title p{margin:4px 0 0;color:#888;font-size:12px;font-weight:800}
        .hero{padding:22px;border-radius:28px;background:linear-gradient(135deg,#ff4d00,#ff8a00);color:#fff;box-shadow:0 18px 42px rgba(255,77,0,.22)}.hero h2{margin:0 0 6px;font-size:24px}.hero p{margin:0;line-height:1.7;font-size:12px;font-weight:800}
        .state{margin-top:18px;padding:24px;text-align:center;border-radius:24px;background:#fff;color:#777;box-shadow:0 12px 32px rgba(0,0,0,.06)}.state b{display:block;color:#181818;font-size:18px}.state p{line-height:1.8}.state a{display:inline-flex;margin-top:10px;padding:12px 18px;border-radius:14px;background:#181818;color:#fff;text-decoration:none;font-weight:900}.error{color:#b42318}
        .grid{display:grid;gap:14px;margin-top:18px}.card{overflow:hidden;border-radius:24px;background:#fff;color:#181818;text-decoration:none;box-shadow:0 14px 34px rgba(0,0,0,.08)}
        .visual{height:155px;position:relative;display:grid;place-items:center;background:#fff1e8;font-size:56px;font-weight:950;color:#ff5a00}.visual img{width:100%;height:100%;object-fit:cover}.badge{position:absolute;top:12px;right:12px;padding:8px 11px;border-radius:999px;background:#181818;color:#fff;font-size:12px}
        .info{padding:15px}.info h3{margin:0;font-size:19px}.info p{margin:5px 0 10px;color:#888;font-size:12px;font-weight:800}.info div{display:flex;align-items:center;gap:10px}.info strong{color:#ff4d00;font-size:18px}.info del{color:#999;font-size:13px}
      `}</style>
    </main>
  );
}
