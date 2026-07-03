"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";

type ReelDoc = {
  documentId: string;
  title?: string;
  caption?: string;
  restaurant?: string;
  restaurantName?: string;
  restaurantSlug?: string;
  category?: string;
  offer?: string;
  menuItem?: string;
  videoUrl?: string;
  thumbnail?: string;
  image?: string;
  approved?: boolean;
  active?: boolean;
  status?: string;
  likes?: number;
  views?: number;
  createdAt?: unknown;
};

const fallbackReels: ReelDoc[] = [
  {
    documentId: "fuse-reel-fayrouz-1",
    title: "كاهي فيروز طالع حار",
    caption: "لقطة سريعة من فطور فيروز، كاهي وقيمر وشاي عراقي.",
    restaurant: "فيروز",
    restaurantSlug: "fayrouz",
    category: "فطور",
    offer: "خصم 20%",
    menuItem: "كاهي وقيمر",
    image: "/images/m2.jpg",
    likes: 128,
    views: 2400,
  },
  {
    documentId: "fuse-reel-shalteta-1",
    title: "مشلتت جبن يسحب",
    caption: "شلتتة تقدم فطائر ومشلتت حار بطريقة تخليك تطلب فوراً.",
    restaurant: "شلتتة",
    restaurantSlug: "shalteta",
    category: "فطور",
    offer: "توصيل سريع",
    menuItem: "مشلتت جبن",
    image: "/images/m3.jpg",
    likes: 96,
    views: 1800,
  },
  {
    documentId: "fuse-reel-khan-1",
    title: "وجبة عراقية من خان قدوري",
    caption: "أكلات عراقية، رز، مرگ، ومشاوي للغداء اليومي.",
    restaurant: "خان قدوري",
    restaurantSlug: "khan",
    category: "مشاوي",
    offer: "وجبات يومية",
    menuItem: "دجاج مشوي",
    image: "/images/khan.jpg",
    likes: 143,
    views: 3100,
  },
  {
    documentId: "fuse-reel-alforn-1",
    title: "مناقيش الفرن",
    caption: "مناقيش ومعجنات وكريب ووافل بتجربة سريعة داخل FUSE.",
    restaurant: "الفرن",
    restaurantSlug: "restaurants/alforn",
    category: "بيتزا",
    offer: "قريباً",
    menuItem: "مناقيش جبن",
    image: "/images/m5.jpg",
    likes: 71,
    views: 950,
  },
];

const categories = ["الكل", "فطور", "مشاوي", "بيتزا", "مشروبات"];

function clean(value: string | null | undefined) {
  return (value || "").trim();
}

function toDate(value: unknown): Date | null {
  try {
    if (!value) return null;

    if (
      typeof value === "object" &&
      value !== null &&
      "toDate" in value &&
      typeof (value as { toDate?: unknown }).toDate === "function"
    ) {
      return (value as { toDate: () => Date }).toDate();
    }

    if (value instanceof Date) return value;

    const date = new Date(value as string | number);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

function createdMs(value: unknown) {
  return toDate(value)?.getTime() || 0;
}

function restaurantName(reel: ReelDoc) {
  return clean(reel.restaurantName || reel.restaurant || "FUSE");
}

function restaurantHref(reel: ReelDoc) {
  const slug = clean(reel.restaurantSlug);
  if (slug.startsWith("/")) return slug;
  if (slug) return slug.startsWith("restaurants/") ? `/${slug}` : `/restaurants/${slug}`;

  const name = restaurantName(reel);
  if (name.includes("فيروز")) return "/restaurants/fayrouz";
  if (name.includes("شلتتة")) return "/restaurants/shalteta";
  if (name.includes("خان")) return "/restaurants/khan";
  return "/";
}

function isVisibleReel(reel: ReelDoc) {
  return reel.active !== false && reel.approved !== false && reel.status !== "rejected";
}

function imageForReel(reel: ReelDoc, index: number) {
  return reel.thumbnail || reel.image || `/images/m${(index % 9) + 1}.jpg`;
}

function Icon({ name }: { name: string }) {
  const p = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "play") {
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="9" />
        <path d="M10 8l6 4-6 4V8z" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (name === "heart") {
    return (
      <svg {...p}>
        <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.6-7 10-7 10z" />
      </svg>
    );
  }

  if (name === "eye") {
    return (
      <svg {...p}>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
        <circle cx="12" cy="12" r="2.8" />
      </svg>
    );
  }

  if (name === "flag") {
    return (
      <svg {...p}>
        <path d="M5 21V4" />
        <path d="M5 5h12l-1.5 4L17 13H5" />
      </svg>
    );
  }

  if (name === "home") {
    return (
      <svg {...p}>
        <path d="M4 11.5L12 5l8 6.5" />
        <path d="M6.5 10.5V19h11v-8.5" />
      </svg>
    );
  }

  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

export default function ReelsPage() {
  const [reels, setReels] = useState<ReelDoc[]>([]);
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [reported, setReported] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "reels")),
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<ReelDoc, "documentId">),
          documentId: item.id,
        }));

        data.sort((a, b) => createdMs(b.createdAt) - createdMs(a.createdAt));
        setReels(data.filter(isVisibleReel));
      },
      () => setReels([])
    );

    return () => unsubscribe();
  }, []);

  const sourceReels = reels.length ? reels : fallbackReels;

  const visibleReels = useMemo(() => {
    if (activeCategory === "الكل") return sourceReels;

    return sourceReels.filter((reel) => clean(reel.category) === activeCategory);
  }, [activeCategory, sourceReels]);

  return (
    <main dir="rtl" className="page">
      <section className="shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-icon">
              <Icon name="play" />
            </div>
            <div>
              <b>FUSE Reels</b>
              <span>ريلز المطاعم والعروض</span>
            </div>
          </div>

          <nav className="nav">
            <Link href="/customer" className="pill">الزبون</Link>
            <Link href="/" className="pill">الرئيسية</Link>
            <Link href="/cart" className="pill">السلة</Link>
            <Link href="/reels" className="pill active">الريلز</Link>
          </nav>
        </header>

        <section className="hero">
          <div>
            <span>Short Food Videos</span>
            <h1>
              ريلز أكل
              <br />
              <em>تبيع قبل المنيو</em>
            </h1>
            <p>
              فيديوهات قصيرة للمطاعم والعروض والأصناف المميزة. حالياً الصفحة تقرأ من
              Firestore collection باسم <b dir="ltr">reels</b>، وإذا ماكو بيانات تعرض نماذج جاهزة.
            </p>
          </div>

          <div className="hero-card">
            <Icon name="eye" />
            <b>{visibleReels.length}</b>
            <span>ريلز ظاهرة</span>
          </div>
        </section>

        <section className="category-strip">
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              onClick={() => setActiveCategory(category)}
              className={activeCategory === category ? "active" : ""}
            >
              {category}
            </button>
          ))}
        </section>

        <section className="reels-layout">
          {visibleReels.map((reel, index) => {
            const reelLiked = Boolean(liked[reel.documentId]);
            const reelReported = Boolean(reported[reel.documentId]);

            return (
              <article key={reel.documentId} className="reel-card">
                <div className="media-wrap">
                  {reel.videoUrl ? (
                    <video
                      src={reel.videoUrl}
                      poster={imageForReel(reel, index)}
                      controls
                      playsInline
                      loop
                    />
                  ) : (
                    <img src={imageForReel(reel, index)} alt={reel.title || "FUSE Reel"} />
                  )}

                  <div className="media-overlay" />
                  <div className="play-chip">
                    <Icon name="play" />
                    <span>{reel.videoUrl ? "Video" : "Preview"}</span>
                  </div>

                  {reel.offer ? <div className="offer-chip">{reel.offer}</div> : null}
                </div>

                <div className="reel-body">
                  <div>
                    <span className="restaurant">{restaurantName(reel)}</span>
                    <h2>{reel.title || reel.menuItem || "ريل FUSE"}</h2>
                    <p>{reel.caption || "لقطة قصيرة من المطعم."}</p>
                  </div>

                  <div className="meta-row">
                    <span>{reel.category || "عام"}</span>
                    <span>{reel.menuItem || "صنف مميز"}</span>
                  </div>

                  <div className="actions">
                    <button
                      type="button"
                      onClick={() => setLiked((prev) => ({ ...prev, [reel.documentId]: !reelLiked }))}
                      className={reelLiked ? "liked" : ""}
                    >
                      <Icon name="heart" />
                      {(reel.likes || 0) + (reelLiked ? 1 : 0)}
                    </button>

                    <button type="button">
                      <Icon name="eye" />
                      {(reel.views || 0).toLocaleString()}
                    </button>

                    <button
                      type="button"
                      onClick={() => setReported((prev) => ({ ...prev, [reel.documentId]: true }))}
                      className={reelReported ? "reported" : ""}
                    >
                      <Icon name="flag" />
                      {reelReported ? "تم التبليغ" : "تبليغ"}
                    </button>
                  </div>

                  <Link href={restaurantHref(reel)} className="order-link">
                    اطلب من المطعم
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      </section>

      <style jsx>{`
        :global(*) {
          box-sizing: border-box;
        }

        :global(html),
        :global(body) {
          margin: 0;
          padding: 0;
          background: #050505;
        }

        .page {
          min-height: 100vh;
          padding: 24px 16px 42px;
          color: #fff;
          font-family: Cairo, system-ui, sans-serif;
          background:
            radial-gradient(circle at top right, rgba(255,122,0,0.18), transparent 34%),
            radial-gradient(circle at bottom left, rgba(255,61,0,0.11), transparent 34%),
            #050505;
        }

        .shell {
          width: min(1180px, 100%);
          margin: 0 auto;
        }

        .topbar,
        .hero,
        .reel-card,
        .category-strip {
          border: 1px solid rgba(255,255,255,0.11);
          background: rgba(255,255,255,0.055);
          box-shadow: 0 24px 70px rgba(0,0,0,0.28);
          backdrop-filter: blur(18px);
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          border-radius: 28px;
          padding: 14px;
          margin-bottom: 16px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-icon {
          width: 52px;
          height: 52px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #ff8a00, #ff3d00);
          color: #101010;
        }

        .brand b {
          display: block;
          font-size: 20px;
          font-weight: 950;
        }

        .brand span {
          display: block;
          color: rgba(255,255,255,0.55);
          font-size: 12px;
          font-weight: 850;
          margin-top: 4px;
        }

        .nav {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .pill {
          border-radius: 999px;
          padding: 11px 15px;
          color: rgba(255,255,255,0.74);
          text-decoration: none;
          background: rgba(255,255,255,0.065);
          font-size: 13px;
          font-weight: 950;
        }

        .pill.active {
          background: #ff7a00;
          color: #101010;
        }

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 220px;
          gap: 16px;
          align-items: stretch;
          border-radius: 34px;
          padding: 26px;
          margin-bottom: 16px;
          background:
            radial-gradient(circle at 85% 20%, rgba(255,255,255,0.13), transparent 24%),
            linear-gradient(135deg, rgba(255,255,255,0.075), rgba(255,122,0,0.11));
        }

        .hero span {
          color: #ff7a00;
          font-size: 12px;
          font-weight: 950;
        }

        .hero h1 {
          margin: 12px 0;
          font-size: clamp(46px, 6vw, 86px);
          line-height: 0.96;
          font-weight: 950;
          letter-spacing: -1px;
        }

        .hero em {
          color: #ff7a00;
          font-style: normal;
        }

        .hero p {
          margin: 0;
          max-width: 740px;
          color: rgba(255,255,255,0.66);
          line-height: 1.9;
          font-weight: 750;
        }

        .hero-card {
          border-radius: 26px;
          padding: 20px;
          display: grid;
          place-items: center;
          text-align: center;
          background: rgba(0,0,0,0.28);
          border: 1px solid rgba(255,255,255,0.09);
        }

        .hero-card svg {
          color: #ff7a00;
        }

        .hero-card b {
          display: block;
          font-size: 46px;
          font-weight: 950;
        }

        .category-strip {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          border-radius: 24px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .category-strip button {
          flex: 0 0 auto;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 999px;
          padding: 12px 18px;
          background: rgba(255,255,255,0.055);
          color: rgba(255,255,255,0.76);
          font-family: inherit;
          font-weight: 950;
          cursor: pointer;
        }

        .category-strip button.active {
          background: #ff7a00;
          color: #101010;
          border-color: transparent;
        }

        .reels-layout {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .reel-card {
          overflow: hidden;
          border-radius: 34px;
          background: rgba(12,12,14,0.78);
        }

        .media-wrap {
          position: relative;
          aspect-ratio: 9 / 14;
          min-height: 430px;
          background: #111;
        }

        .media-wrap img,
        .media-wrap video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .media-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.72));
          pointer-events: none;
        }

        .play-chip,
        .offer-chip {
          position: absolute;
          z-index: 2;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 950;
        }

        .play-chip {
          top: 14px;
          right: 14px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 12px;
          color: #fff;
          background: rgba(0,0,0,0.55);
          border: 1px solid rgba(255,255,255,0.12);
        }

        .offer-chip {
          left: 14px;
          top: 14px;
          padding: 9px 12px;
          color: #101010;
          background: #ff7a00;
        }

        .reel-body {
          display: grid;
          gap: 12px;
          padding: 18px;
        }

        .restaurant {
          display: inline-flex;
          color: #ff9a31;
          font-size: 12px;
          font-weight: 950;
          margin-bottom: 8px;
        }

        .reel-body h2 {
          margin: 0;
          font-size: 28px;
          line-height: 1.08;
          font-weight: 950;
        }

        .reel-body p {
          margin: 8px 0 0;
          color: rgba(255,255,255,0.62);
          line-height: 1.7;
          font-weight: 700;
        }

        .meta-row,
        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .meta-row span,
        .actions button {
          border-radius: 999px;
          padding: 9px 11px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.09);
          color: rgba(255,255,255,0.78);
          font-size: 12px;
          font-weight: 950;
        }

        .actions button {
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
        }

        .actions button.liked {
          color: #fca5a5;
          background: rgba(239,68,68,0.12);
          border-color: rgba(239,68,68,0.26);
        }

        .actions button.reported {
          color: #fbbf24;
          background: rgba(251,191,36,0.12);
          border-color: rgba(251,191,36,0.26);
        }

        .order-link {
          min-height: 50px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #ff8a00, #ff3d00);
          color: #101010;
          text-decoration: none;
          font-weight: 950;
        }

        @media (max-width: 760px) {
          .page {
            padding: 12px;
          }

          .topbar,
          .hero,
          .reel-card {
            border-radius: 26px;
          }

          .hero {
            grid-template-columns: 1fr;
            padding: 20px;
          }

          .media-wrap {
            min-height: 540px;
          }

          .nav {
            width: 100%;
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 2px;
          }

          .pill {
            flex: 0 0 auto;
          }
        }
      `}</style>
    </main>
  );
}
