"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";
import { addFuseCartItem } from "@/lib/fuse-cart";

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
  thumbnail?: string;
  image?: string;
  approved?: boolean;
  active?: boolean;
  status?: string;
  likes?: number;
  views?: number;
  orders?: number;
  submitterType?: string;
  submittedByName?: string;
  createdAt?: unknown;
};

const fallbackReels: ReelDoc[] = [
  {
    documentId: "fuse-reel-fayrouz-1",
    title: "كاهي فيروز طالع حار",
    caption: "كاهي وقيمر وشاي عراقي... فطور يفتح النفس.",
    restaurant: "فيروز",
    restaurantSlug: "fayrouz",
    category: "فطور",
    offer: "خصم 20%",
    menuItem: "كاهي وقيمر",
    price: 4500,
    deliveryTime: "20-30 دقيقة",
    image: "/images/m2.jpg",
    likes: 128,
    views: 2400,
    orders: 74,
  },
  {
    documentId: "fuse-reel-shalteta-1",
    title: "مشلتت جبن يسحب",
    caption: "طازج، حار، وجبن يذوب من أول لقمة.",
    restaurant: "شلتتة",
    restaurantSlug: "shalteta",
    category: "فطور",
    offer: "توصيل سريع",
    menuItem: "مشلتت جبن",
    price: 7500,
    deliveryTime: "25-35 دقيقة",
    image: "/images/m3.jpg",
    likes: 96,
    views: 1800,
    orders: 52,
  },
  {
    documentId: "fuse-reel-khan-1",
    title: "وجبة عراقية من خان قدوري",
    caption: "رز ومرگ ودجاج مشوي... غداء عراقي كامل.",
    restaurant: "خان قدوري",
    restaurantSlug: "khan",
    category: "مشاوي",
    offer: "وجبات يومية",
    menuItem: "دجاج مشوي",
    price: 9000,
    deliveryTime: "30-40 دقيقة",
    image: "/images/khan.jpg",
    likes: 143,
    views: 3100,
    orders: 89,
  },
  {
    documentId: "fuse-reel-alforn-1",
    title: "مناقيش الفرن",
    caption: "مناقيش ومعجنات حارة بطعم يوصلك للفرن مباشرة.",
    restaurant: "الفرن",
    restaurantSlug: "alforn",
    category: "بيتزا",
    offer: "جديد",
    menuItem: "مناقيش جبن",
    price: 6000,
    deliveryTime: "25-35 دقيقة",
    image: "/images/m5.jpg",
    likes: 71,
    views: 950,
    orders: 31,
  },
];

function clean(value?: string | null) {
  return (value || "").trim();
}

function restaurantName(reel: ReelDoc) {
  return clean(reel.restaurantName || reel.restaurant || "FUSE");
}

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
  return (
    reel.active !== false &&
    reel.approved !== false &&
    reel.status !== "rejected" &&
    reel.status !== "pending"
  );
}

function mediaFor(reel: ReelDoc, index: number) {
  return reel.thumbnail || reel.image || `/images/m${(index % 9) + 1}.jpg`;
}

function formatIQD(value?: number) {
  return `${Number(value || 0).toLocaleString("ar-IQ")} د.ع`;
}

function Icon({ name }: { name: string }) {
  const p = {
    width: 25,
    height: 25,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (name === "back") return <svg {...p}><path d="M15 18l-6-6 6-6" /></svg>;
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

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "reels")),
      (snapshot) => {
        const next = snapshot.docs
          .map((item) => ({ ...(item.data() as Omit<ReelDoc, "documentId">), documentId: item.id }))
          .filter(isVisible);
        setReels(next);
      },
      () => setReels([])
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "restaurants")),
      (snapshot) => setRestaurants(snapshot.docs.map((item) => ({
        ...(item.data() as Omit<RestaurantState, "documentId">),
        documentId: item.id,
      }))),
      () => setRestaurants([])
    );
    return unsubscribe;
  }, []);

  const visibleReels = useMemo(() => {
    const source = reels.length ? reels : fallbackReels;
    if (!restaurants.length) return source;
    return source.filter((reel) => {
      const slug = restaurantSlug(reel);
      const name = restaurantName(reel);
      const matchingRestaurant = restaurants.find((item) => {
        const itemName = clean(item.restaurantName || item.name || item.title);
        return item.documentId === slug || itemName === name;
      });
      if (!matchingRestaurant) return true;
      return matchingRestaurant.active !== false && matchingRestaurant.open !== false && matchingRestaurant.isOpen !== false && matchingRestaurant.status !== "مغلق";
    });
  }, [reels, restaurants]);

  useEffect(() => {
    setActiveId(visibleReels[0]?.documentId || "");
  }, [visibleReels]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-reel-id]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.7) {
            setActiveId((entry.target as HTMLElement).dataset.reelId || "");
          }
        });
      },
      { root, threshold: [0.7] }
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [visibleReels]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLVideoElement>("video").forEach((video) => {
      video.muted = muted;
      const id = video.closest<HTMLElement>("[data-reel-id]")?.dataset.reelId;
      if (id === activeId) video.play().catch(() => undefined);
      else video.pause();
    });
  }, [activeId, muted]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
  }

  function addToCart(reel: ReelDoc) {
    addFuseCartItem({
      id: reel.menuItemId || reel.documentId,
      name: reel.menuItem || reel.title || "وجبة FUSE",
      restaurant: restaurantName(reel),
      restaurantId: restaurantSlug(reel),
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
      else {
        await navigator.clipboard.writeText(url);
        flash("تم نسخ رابط الريل");
      }
    } catch {
      // User cancelled share.
    }
  }

  return (
    <main dir="rtl" className="page">
      <div className="feed" ref={containerRef}>
        {visibleReels.map((reel, index) => {
          const id = reel.documentId;
          const isLiked = Boolean(liked[id]);
          const isSaved = Boolean(saved[id]);
          const slug = restaurantSlug(reel);
          const isCustomerReel = reel.submitterType === "customer";
          return (
            <article className="reel" data-reel-id={id} key={id}>
              {reel.videoUrl ? (
                <video src={reel.videoUrl} poster={mediaFor(reel, index)} loop playsInline muted={muted} preload={index < 2 ? "auto" : "metadata"} />
              ) : (
                <img src={mediaFor(reel, index)} alt={reel.title || "FUSE Reel"} />
              )}

              <div className="shade" />
              <header className="topbar">
                <button type="button" className="glass" aria-label="رجوع" onClick={() => window.location.assign("/")}><Icon name="back" /></button>
                <div className="tabs"><b>لك</b><span>متابعة</span></div>
                <div className="top-actions">
                  <Link href="/restaurant-reels" className="glass create" aria-label="نشر ريل">+</Link>
                  <button className="glass" onClick={() => setMuted((value) => !value)} aria-label="الصوت">
                    <Icon name={muted ? "mute" : "volume"} />
                  </button>
                </div>
              </header>

              <aside className="actions">
                <Link href={isCustomerReel ? "/reels" : `/restaurants/${slug}`} className="avatar">
                  <img src={reel.restaurantLogo || mediaFor(reel, index)} alt={restaurantName(reel)} />
                  <i>+</i>
                </Link>
                <button className={isLiked ? "active" : ""} onClick={() => setLiked((prev) => ({ ...prev, [id]: !isLiked }))}>
                  <span><Icon name="heart" /></span><b>{(reel.likes || 0) + (isLiked ? 1 : 0)}</b>
                </button>
                <button onClick={() => flash("التعليقات قريباً داخل FUSE")}><span><Icon name="comment" /></span><b>تعليق</b></button>
                <button className={isSaved ? "active" : ""} onClick={() => setSaved((prev) => ({ ...prev, [id]: !isSaved }))}>
                  <span><Icon name="save" /></span><b>حفظ</b>
                </button>
                <button onClick={() => shareReel(reel)}><span><Icon name="share" /></span><b>مشاركة</b></button>
              </aside>

              <section className="content">
                <div className="restaurant-line">
                  <b>@{isCustomerReel ? reel.submittedByName || "مجتمع FUSE" : restaurantName(reel)}</b>
                  {!isCustomerReel ? <em>✓</em> : null}
                  {reel.offer ? <strong>{reel.offer}</strong> : null}
                </div>
                <h1>{reel.title || reel.menuItem || "وجبة مميزة من FUSE"}</h1>
                <p>{reel.caption || "شاهد، اختار، واطلب مباشرة من داخل الريل."}</p>
                <div className="stats">
                  <span>{reel.category || "عام"}</span>
                  <span>{reel.deliveryTime || "30-45 دقيقة"}</span>
                  <span>{(reel.views || 0).toLocaleString("ar-IQ")} مشاهدة</span>
                </div>

                {!isCustomerReel ? (
                  <>
                    <div className="product-card">
                      <div>
                        <small>اطلب من داخل الريل</small>
                        <b>{reel.menuItem || reel.title || "وجبة FUSE"}</b>
                        <strong>{formatIQD(reel.price)}</strong>
                      </div>
                      <button onClick={() => addToCart(reel)} aria-label="إضافة للسلة">+</button>
                    </div>

                    <div className="cta-row">
                      <Link href={`/restaurants/${slug}`} className="order-btn"><Icon name="cart" /> اطلب الآن</Link>
                      <button onClick={() => addToCart(reel)} className="quick-add">إضافة سريعة</button>
                    </div>
                  </>
                ) : null}
              </section>

              {activeId === id && !reel.videoUrl ? <div className="photo-label">صورة تجريبية — أضف videoUrl من لوحة الإدارة</div> : null}
            </article>
          );
        })}
      </div>

      {notice ? <div className="toast">{notice}</div> : null}

      <style jsx>{`
        :global(*){box-sizing:border-box} :global(html),:global(body){margin:0;background:#000;overflow:hidden;width:100%;height:100%;padding:0!important}
        .page{height:100vh;height:100dvh;min-height:-webkit-fill-available;width:100%;background:#000;color:#fff;font-family:var(--fuse-body-font);overflow:hidden;padding:0}
        .top-actions{display:flex;gap:8px;align-items:center}.top-actions :global(.create){font-size:29px;font-weight:400;text-decoration:none;line-height:1}
        .feed{height:100%;overflow-y:auto;scroll-snap-type:y mandatory;overscroll-behavior-y:contain;scrollbar-width:none}
        .feed::-webkit-scrollbar{display:none}
        .reel{position:relative;height:100%;min-height:0;scroll-snap-align:start;scroll-snap-stop:always;overflow:hidden;background:#090909}
        .reel>video,.reel>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;display:block}
        .reel>img{transform:scale(1.02)}
        .shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.36) 0%,transparent 24%,transparent 50%,rgba(0,0,0,.25) 66%,rgba(0,0,0,.94) 100%)}
        .topbar{position:absolute;top:0;left:0;right:0;z-index:5;padding:calc(max(10px,env(safe-area-inset-top)) + 2px) max(14px,env(safe-area-inset-right)) 8px max(14px,env(safe-area-inset-left));display:grid;grid-template-columns:46px 1fr 46px;align-items:center}
        .glass{width:44px;height:44px;border:1px solid rgba(255,255,255,.18);border-radius:50%;display:grid;place-items:center;background:rgba(10,10,10,.35);backdrop-filter:blur(14px);color:#fff;text-decoration:none}
        button.glass{cursor:pointer}
        .tabs{justify-self:center;display:flex;align-items:center;gap:20px;font-size:15px;text-shadow:0 2px 8px #000}
        .tabs b{position:relative}.tabs b:after{content:"";position:absolute;width:20px;height:3px;border-radius:9px;background:#ff6700;bottom:-8px;left:50%;transform:translateX(-50%)}
        .tabs span{color:rgba(255,255,255,.68)}
        .actions{position:absolute;z-index:6;left:12px;bottom:178px;display:grid;gap:14px;justify-items:center}
        .actions button{border:0;background:none;color:#fff;padding:0;display:grid;justify-items:center;gap:4px;text-shadow:0 2px 8px #000}
        .actions button span{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:rgba(15,15,15,.42);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(12px)}
        .actions button b{font-size:10px}.actions button.active span{color:#ff5a36;background:rgba(255,255,255,.92)}
        .avatar{position:relative;width:50px;height:50px;border-radius:50%;padding:2px;border:2px solid #fff;display:block;margin-bottom:4px}
        .avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%}.avatar i{position:absolute;right:50%;bottom:-9px;transform:translateX(50%);width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#ff5a00;color:#fff;font-style:normal;font-weight:900}
        .content{position:absolute;z-index:5;right:max(14px,env(safe-area-inset-right));left:max(70px,calc(env(safe-area-inset-left) + 70px));bottom:calc(max(10px,env(safe-area-inset-bottom)) + 2px);text-shadow:0 2px 10px rgba(0,0,0,.85)}
        .restaurant-line{display:flex;align-items:center;gap:7px;margin-bottom:7px}.restaurant-line b{font-size:15px}.restaurant-line em{width:17px;height:17px;display:grid;place-items:center;border-radius:50%;background:#ff6200;font-size:11px;font-style:normal}.restaurant-line strong{font-size:10px;padding:5px 8px;border-radius:999px;background:#ff5a00}
        h1{margin:0 0 6px;font-size:22px;line-height:1.2;font-weight:900}p{margin:0 0 9px;font-size:13px;line-height:1.6;color:rgba(255,255,255,.88);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        .stats{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}.stats span{font-size:9px;padding:5px 8px;border-radius:999px;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(8px)}
        .product-card{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 12px;border-radius:18px;background:rgba(12,12,12,.58);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(16px);margin-bottom:9px;text-shadow:none}
        .product-card div{min-width:0;display:grid;gap:2px}.product-card small{font-size:9px;color:#ff9a55}.product-card b{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.product-card strong{font-size:13px;color:#ff7a00}
        .product-card button{flex:0 0 42px;width:42px;height:42px;border:0;border-radius:50%;background:linear-gradient(135deg,#ff8a00,#ff3d00);color:#fff;font-size:25px;font-weight:900}
        .cta-row{display:grid;grid-template-columns:1.25fr .75fr;gap:8px;text-shadow:none}.order-btn,.quick-add{height:46px;border-radius:15px;border:0;display:flex;align-items:center;justify-content:center;gap:7px;font-weight:900;font-family:inherit}.order-btn{background:linear-gradient(135deg,#ff7a00,#ff3d00);color:#fff;text-decoration:none}.quick-add{background:#fff;color:#101010}
        .photo-label{position:absolute;z-index:4;top:82px;right:16px;font-size:9px;padding:6px 9px;border-radius:999px;background:rgba(0,0,0,.45);color:rgba(255,255,255,.65)}
        .toast{position:fixed;z-index:30;left:50%;bottom:110px;transform:translateX(-50%);background:#fff;color:#111;padding:12px 18px;border-radius:999px;font-weight:900;box-shadow:0 12px 40px rgba(0,0,0,.35);white-space:nowrap}
        @media (min-width:700px){.feed{width:min(430px,100%);margin:auto;background:#000;box-shadow:0 0 80px rgba(0,0,0,.7)}.reel{border-left:1px solid #222;border-right:1px solid #222}}
        @media (max-width:360px){.content{right:12px;left:67px}.actions{left:8px}.actions button span{width:42px;height:42px}h1{font-size:19px}.product-card{padding:9px 10px}}
      `}</style>
    </main>
  );
}
