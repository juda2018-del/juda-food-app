"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { addFuseCartItem } from "@/lib/fuse-cart";
import { isCatalogMenuItemId } from "@/lib/fuse-catalog";

type RestaurantState = {
  documentId: string;
  name?: string;
  title?: string;
  restaurantName?: string;
  open?: boolean;
  isOpen?: boolean;
  active?: boolean;
  status?: string;
};

type ReelDoc = {
  documentId: string;
  title?: string;
  caption?: string;
  restaurant?: string;
  restaurantName?: string;
  restaurantSlug?: string;
  restaurantLogo?: string;
  category?: string;
  offer?: string;
  menuItem?: string;
  menuItemId?: string;
  price?: number;
  deliveryTime?: string;
  videoUrl?: string;
  sourceUrl?: string;
  thumbnail?: string;
  image?: string;
  approved?: boolean;
  active?: boolean;
  status?: string;
  likes?: number;
  views?: number;
  submitterType?: string;
  submittedByName?: string;
};

const fallbackReels: ReelDoc[] = [
  { documentId: "fuse-reel-fayrouz-1", title: "فطور عراقي يفتح النفس", caption: "كاهي وقيمر وشاي عراقي... مذاق بغداد من فيروز.", restaurant: "فيروز", restaurantSlug: "fayrouz", category: "فطور", offer: "خصم 20%", menuItem: "كاهي وقيمر", menuItemId: "fayrouz-kahi", price: 4500, deliveryTime: "20-30 دقيقة", videoUrl: "/videos/reel-1.mp4", image: "/images/m6.jpg", sourceUrl: "https://youtube.com/shorts/Qqfbt9NsxOg?si=BLlq_6YDOwCVWco5", likes: 1800, views: 14200 },
  { documentId: "fuse-reel-shalteta-1", title: "مشلتت جبن يسحب", caption: "طازج، حار، وجبن يذوب من أول لقمة.", restaurant: "شلتتة", restaurantSlug: "shalteta", category: "فطور", offer: "توصيل سريع", menuItem: "مشلتت جبن", menuItemId: "shalteta-mix", price: 7500, deliveryTime: "25-35 دقيقة", videoUrl: "/videos/reel-2.mp4", image: "/images/m3.jpg", sourceUrl: "https://youtube.com/shorts/U7_6LOtam1g?si=wgw08D8gGYivBMZe", likes: 1290, views: 9800 },
  { documentId: "fuse-reel-khan-1", title: "وجبة عراقية من خان قدوري", caption: "رز ومرگ ودجاج مشوي... غداء عراقي كامل.", restaurant: "خان قدوري", restaurantSlug: "khan", category: "مشاوي", offer: "وجبات يومية", menuItem: "دجاج مشوي", menuItemId: "khan-chicken", price: 9000, deliveryTime: "30-40 دقيقة", videoUrl: "/videos/reel-3.mp4", image: "/images/khan.jpg", sourceUrl: "https://youtube.com/shorts/cToLyOXKL8s?si=I1bFwfYihFObgkE6", likes: 2140, views: 18300 },
  { documentId: "fuse-reel-alforn-1", title: "مناقيش الفرن", caption: "مناقيش ومعجنات حارة بطعم يوصلك للفرن مباشرة.", restaurant: "الفرن", restaurantSlug: "alforn", category: "بيتزا", offer: "جديد", menuItem: "مناقيش جبن", menuItemId: "alforn-manakish", price: 6000, deliveryTime: "25-35 دقيقة", videoUrl: "/videos/reel-4.mp4", image: "/images/m5.jpg", likes: 870, views: 7200 },
];

function clean(value?: string | null) { return (value || "").trim(); }
function restaurantName(reel: ReelDoc) { return clean(reel.restaurantName || reel.restaurant || "FUSE"); }
function restaurantSlug(reel: ReelDoc) {
  const explicit = clean(reel.restaurantSlug).replace(/^\/|restaurants\//g, "");
  if (explicit) return explicit;
  const name = restaurantName(reel);
  if (name.includes("فيروز")) return "fayrouz";
  if (name.includes("شلتتة")) return "shalteta";
  if (name.includes("خان")) return "khan";
  if (name.includes("الفرن")) return "alforn";
  return "fayrouz";
}
function isVisible(reel: ReelDoc) {
  return reel.active !== false && reel.approved !== false && reel.status !== "rejected" && reel.status !== "pending";
}
function mediaFor(reel: ReelDoc, index: number) { return reel.thumbnail || reel.image || `/images/m${(index % 9) + 1}.jpg`; }
function formatIQD(value?: number) { return `${Number(value || 0).toLocaleString("ar-IQ")} د.ع`; }

function Icon({ name }: { name: string }) {
  const p = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "heart") return <svg {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.6-7 10-7 10z" /></svg>;
  if (name === "comment") return <svg {...p}><path d="M21 12a8 8 0 01-8 8 8.5 8.5 0 01-4-.9L3 21l1.8-5A8 8 0 1121 12z" /></svg>;
  if (name === "share") return <svg {...p}><circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="M8 11l8-5M8 13l8 5"/></svg>;
  if (name === "save") return <svg {...p}><path d="M6 4h12v17l-6-4-6 4V4z" /></svg>;
  if (name === "volume") return <svg {...p}><path d="M5 9v6h4l5 4V5L9 9H5z"/><path d="M18 9a4 4 0 010 6"/></svg>;
  if (name === "mute") return <svg {...p}><path d="M5 9v6h4l5 4V5L9 9H5z"/><path d="M18 9l4 4M22 9l-4 4"/></svg>;
  if (name === "cart") return <svg {...p}><path d="M4 6h2l1.5 8h8l2-6H8"/><circle cx="10" cy="18" r="1.3"/><circle cx="16" cy="18" r="1.3"/></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="9" /></svg>;
}

export default function ReelsPage() {
  const [reels, setReels] = useState<ReelDoc[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantState[]>([]);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [muted, setMuted] = useState(true);
  const [notice, setNotice] = useState("");
  const [activeId, setActiveId] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => onSnapshot(query(
    collection(db, "reels"),
    where("approved", "==", true),
    where("active", "==", true)
  ), (snapshot) => {
    setReels(snapshot.docs.map((item) => ({ ...(item.data() as Omit<ReelDoc, "documentId">), documentId: item.id })).filter(isVisible));
  }, () => setReels([])), []);

  useEffect(() => onSnapshot(query(collection(db, "restaurants")), (snapshot) => {
    setRestaurants(snapshot.docs.map((item) => ({ ...(item.data() as Omit<RestaurantState, "documentId">), documentId: item.id })));
  }, () => setRestaurants([])), []);

  const visibleReels = useMemo(() => {
    const source = reels.length ? reels : fallbackReels;
    if (!restaurants.length) return source;
    return source.filter((reel) => {
      const slug = restaurantSlug(reel);
      const name = restaurantName(reel);
      const restaurant = restaurants.find((item) => item.documentId === slug || clean(item.restaurantName || item.name || item.title) === name);
      if (!restaurant) return true;
      return restaurant.active !== false && restaurant.open !== false && restaurant.isOpen !== false && restaurant.status !== "مغلق";
    });
  }, [reels, restaurants]);

  useEffect(() => { setActiveId(visibleReels[0]?.documentId || ""); }, [visibleReels]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-reel-id]"));
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.7) setActiveId((entry.target as HTMLElement).dataset.reelId || "");
    }), { root, threshold: [0.7] });
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [visibleReels]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLVideoElement>("video").forEach((video) => {
      video.muted = muted;
      const id = video.closest<HTMLElement>("[data-reel-id]")?.dataset.reelId;
      if (id === activeId) video.play().catch(() => undefined); else video.pause();
    });
  }, [activeId, muted]);

  function flash(message: string) { setNotice(message); window.setTimeout(() => setNotice(""), 1800); }
  function addToCart(reel: ReelDoc) {
    const slug = restaurantSlug(reel);
    const restaurant = restaurants.find((item) => item.documentId === slug);
    const restaurantId = restaurant?.documentId || slug;
    const menuItemId = clean(reel.menuItemId);

    if (!menuItemId || !isCatalogMenuItemId(menuItemId)) {
      flash("الصنف غير مربوط بالمنيو الحي. افتح المطعم بعد تفعيل المنيو في Firebase.");
      return;
    }

    addFuseCartItem({
      id: menuItemId,
      name: reel.menuItem || reel.title || "وجبة FUSE",
      restaurant: restaurantName(reel),
      restaurantId,
      category: reel.category || "عام",
      price: Number(reel.price || 0),
      qty: 1,
      image: reel.thumbnail || reel.image,
    });
    if (navigator.vibrate) navigator.vibrate(40);
    flash("تمت إضافة الوجبة للسلة");
  }
  async function shareReel(reel: ReelDoc) {
    const url = `${window.location.origin}/reels#${reel.documentId}`;
    try {
      if (navigator.share) await navigator.share({ title: reel.title || "FUSE Reels", text: reel.caption, url });
      else { await navigator.clipboard.writeText(url); flash("تم نسخ رابط الريل"); }
    } catch { /* user cancelled */ }
  }

  return (
    <main dir="rtl" className="page reels-page">
      <div className="feed" ref={containerRef}>
        {visibleReels.map((reel, index) => {
          const id = reel.documentId;
          const isLiked = Boolean(liked[id]);
          const isSaved = Boolean(saved[id]);
          const slug = restaurantSlug(reel);
          const isCustomerReel = reel.submitterType === "customer";
          return (
            <article className="reel" data-reel-id={id} key={id}>
              {reel.videoUrl ? <video src={reel.videoUrl} poster={mediaFor(reel, index)} loop playsInline muted={muted} preload={index < 2 ? "auto" : "metadata"} /> : <img src={mediaFor(reel, index)} alt={reel.title || "FUSE Reel"} />}
              <div className="shade" />
              <header className="topbar">
                <div className="tabs"><b>لك</b><span>متابعة</span></div>
                <div className="top-actions"><Link href="/restaurant-reels" className="glass create" aria-label="نشر ريل">+</Link><button className="glass" onClick={() => setMuted((value) => !value)} aria-label="الصوت"><Icon name={muted ? "mute" : "volume"} /></button></div>
              </header>

              <aside className="actions">
                <Link href={isCustomerReel ? "/reels" : `/restaurants/${slug}`} className="avatar"><img src={reel.restaurantLogo || mediaFor(reel, index)} alt={restaurantName(reel)} /><i>+</i></Link>
                <button className={isLiked ? "active" : ""} onClick={() => setLiked((prev) => ({ ...prev, [id]: !isLiked }))}><span><Icon name="heart" /></span><b>{(reel.likes || 0) + (isLiked ? 1 : 0)}</b></button>
                <button onClick={() => flash("التعليقات قريباً داخل FUSE")}><span><Icon name="comment" /></span><b>تعليق</b></button>
                <button className={isSaved ? "active" : ""} onClick={() => setSaved((prev) => ({ ...prev, [id]: !isSaved }))}><span><Icon name="save" /></span><b>حفظ</b></button>
                <button onClick={() => shareReel(reel)}><span><Icon name="share" /></span><b>مشاركة</b></button>
              </aside>

              <section className="content">
                <div className="restaurant-line"><b>@{isCustomerReel ? reel.submittedByName || "مجتمع FUSE" : restaurantName(reel)}</b>{!isCustomerReel ? <em>✓</em> : null}{reel.offer ? <strong>{reel.offer}</strong> : null}</div>
                <h1>{reel.title || reel.menuItem || "وجبة مميزة من FUSE"}</h1>
                <p>{reel.caption || "شاهد، اختار، واطلب مباشرة من داخل الريل."}</p>
                <div className="stats"><span>{reel.category || "عام"}</span><span>{reel.deliveryTime || "30-45 دقيقة"}</span><span>{(reel.views || 0).toLocaleString("ar-IQ")} مشاهدة</span></div>
                {reel.sourceUrl ? <a className="source-link" href={reel.sourceUrl} target="_blank" rel="noreferrer">مشاهدة الفيديو الأصلي</a> : null}
                {!isCustomerReel ? <><div className="product-card"><div><small>اطلب من داخل الريل</small><strong>{formatIQD(reel.price)}</strong></div><button onClick={() => addToCart(reel)} aria-label="إضافة للسلة">+</button></div><div className="cta-row"><Link href={`/restaurants/${slug}`} className="order-btn"><Icon name="cart" /> اطلب الآن</Link><button onClick={() => addToCart(reel)} className="quick-add">إضافة سريعة</button></div></> : null}
              </section>
            </article>
          );
        })}
      </div>

      {notice ? <div className="toast">{notice}</div> : null}

      <style jsx>{`
        :global(*){box-sizing:border-box}:global(html),:global(body){margin:0;background:#000;overflow:hidden;width:100%;height:100%;padding:0!important}
        .page{height:100vh;height:100dvh;width:100%;background:#000;color:#fff;font-family:var(--fuse-body-font);overflow:hidden;padding:0}
        .feed{height:calc(100dvh - 86px - env(safe-area-inset-bottom));overflow-y:auto;scroll-snap-type:y mandatory;overscroll-behavior-y:contain;scrollbar-width:none}.feed::-webkit-scrollbar{display:none}
        .reel{position:relative;height:100%;min-height:0;scroll-snap-align:start;scroll-snap-stop:always;overflow:hidden;background:#090909}.reel>video,.reel>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}.reel>img{transform:scale(1.02)}
        .shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.36),transparent 25%,transparent 48%,rgba(0,0,0,.28) 65%,rgba(0,0,0,.95))}
        .topbar{position:absolute;top:0;left:0;right:0;z-index:5;padding:calc(max(10px,env(safe-area-inset-top)) + 2px) 14px 8px;display:flex;justify-content:flex-end;align-items:center;min-height:64px}.top-actions{display:flex;gap:8px}.glass{width:44px;height:44px;border:1px solid rgba(255,255,255,.18);border-radius:50%;display:grid;place-items:center;background:rgba(10,10,10,.38);backdrop-filter:blur(14px);color:#fff;text-decoration:none}.create{font-size:29px;line-height:1}.tabs{position:absolute;left:50%;transform:translateX(-50%);display:flex;gap:20px;font-size:15px;text-shadow:0 2px 8px #000}.tabs b{position:relative}.tabs b:after{content:"";position:absolute;width:20px;height:3px;border-radius:9px;background:#1f7a4f;bottom:-8px;left:50%;transform:translateX(-50%)}.tabs span{color:rgba(255,255,255,.68)}
        .actions{position:absolute;z-index:6;left:12px;bottom:178px;display:grid;gap:14px;justify-items:center}.actions button{border:0;background:none;color:#fff;padding:0;display:grid;justify-items:center;gap:4px}.actions button span{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:rgba(15,15,15,.45);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(12px)}.actions button b{font-size:10px}.actions button.active span{color:#1f7a4f;background:#fff}.avatar{position:relative;width:50px;height:50px;border-radius:50%;padding:2px;border:2px solid #fff;display:block}.avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%}.avatar i{position:absolute;right:50%;bottom:-9px;transform:translateX(50%);width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#1f7a4f;color:#fff;font-style:normal}
        .content{position:absolute;z-index:5;right:14px;left:70px;bottom:16px;text-shadow:0 2px 10px rgba(0,0,0,.85)}.restaurant-line{display:flex;align-items:center;gap:7px;margin-bottom:7px}.restaurant-line b{font-size:15px}.restaurant-line em{width:17px;height:17px;display:grid;place-items:center;border-radius:50%;background:#54b9ff;font-size:11px;font-style:normal}.restaurant-line strong{font-size:10px;padding:5px 8px;border-radius:999px;background:rgba(31,122,79,.88)}h1{margin:0 0 6px;font-size:22px}p{margin:0 0 9px;font-size:13px;line-height:1.6;color:rgba(255,255,255,.88);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.stats{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:7px}.stats span{font-size:9px;padding:5px 8px;border-radius:999px;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(8px)}.source-link{display:inline-block;margin-bottom:9px;color:#fff;font-size:10px;font-weight:900;text-decoration:underline;text-underline-offset:3px}
        .product-card{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 12px;border-radius:18px;background:rgba(12,12,12,.62);border:1px solid rgba(255,255,255,.16);margin-bottom:9px;text-shadow:none;backdrop-filter:blur(14px)}.product-card div{min-width:0;display:grid;gap:2px}.product-card small{font-size:9px;color:rgba(255,255,255,.72)}.product-card b{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.product-card strong{font-size:13px;color:#7fd4a8}.product-card button{width:42px;height:42px;border:0;border-radius:50%;background:linear-gradient(135deg,#1f7a4f,#2f915f);color:#fff;font-size:25px}.cta-row{display:grid;grid-template-columns:1.25fr .75fr;gap:8px}.order-btn,.quick-add{height:46px;border-radius:15px;border:0;display:flex;align-items:center;justify-content:center;gap:7px;font-weight:900;font-family:inherit}.order-btn{background:linear-gradient(135deg,#1f7a4f,#2f915f);color:#fff;text-decoration:none}.quick-add{background:rgba(255,255,255,.92);color:#15171a}
        .toast{position:fixed;z-index:50;left:50%;bottom:var(--fuse-toast-bottom,98px);transform:translateX(-50%);background:rgba(255,252,247,.92);color:#15171a;padding:12px 18px;border-radius:999px;font-weight:900;white-space:nowrap;border:1px solid rgba(255,255,255,.92);backdrop-filter:blur(18px)}
        @media(min-width:700px){.feed{width:min(430px,100%);margin:auto;box-shadow:0 0 80px rgba(0,0,0,.7)}}@media(max-width:360px){.content{right:12px;left:67px}.actions{left:8px}.actions button span{width:42px;height:42px}h1{font-size:19px}}
      `}</style>
    </main>
  );
}
