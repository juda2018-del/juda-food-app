"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import FuseIcon, { type FuseIconName } from "@/components/FuseIcon";
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

function Icon({ name }: { name: FuseIconName }) {
  return <FuseIcon name={name} size="md" />;
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
                <div className="restaurant-line"><b>@{isCustomerReel ? reel.submittedByName || "مجتمع FUSE" : restaurantName(reel)}</b>{!isCustomerReel ? <em className="verified-badge"><FuseIcon name="check" size="sm" /></em> : null}{reel.offer ? <strong>{reel.offer}</strong> : null}</div>
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

    </main>
  );
}
