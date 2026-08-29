"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "./firebase";
import { firebaseAuth } from "@/lib/firebase/client";
import { addFuseCartItem, FUSE_CART_EVENT, readFuseCart } from "@/lib/fuse-cart";
import { performFuseLogout } from "@/lib/fuse-logout";
import {
  FUSE_COOKIE_EMAIL,
  FUSE_COOKIE_NAME,
  FUSE_COOKIE_PHONE,
  FUSE_COOKIE_RESTAURANT,
  FUSE_COOKIE_ROLE,
  FUSE_LOCAL_SESSION,
  parseFuseRole,
  roleHome,
  type FuseRole,
  type FuseSession,
} from "@/lib/fuse-auth";

type RestaurantDoc = {
  documentId: string;
  name?: string;
  title?: string;
  restaurantName?: string;
  restaurant?: string;
  description?: string;
  cuisine?: string;
  area?: string;
  open?: boolean;
  isOpen?: boolean;
  active?: boolean;
  status?: string;
  rating?: number;
  deliveryTime?: string;
  priceRange?: string;
  image?: string;
  cover?: string;
  logo?: string;
};

type MenuDoc = {
  documentId: string;
  name?: string;
  title?: string;
  restaurantName?: string;
  restaurant?: string;
  restaurantId?: string;
  category?: string;
  price?: number;
  available?: boolean;
  isAvailable?: boolean;
  image?: string;
};

const heroImage = "/images/m6.jpg";

const fallbackRestaurants: RestaurantDoc[] = [
  {
    documentId: "fayrouz",
    name: "فيروز",
    description: "فطور عراقي، كاهي، قيمر وبورك أصيل.",
    cuisine: "فطور",
    area: "زيونة",
    open: true,
    rating: 4.9,
    deliveryTime: "20 - 30 دقيقة",
    priceRange: "25-35 د",
    image: "/images/m7.jpg",
  },
  {
    documentId: "shalteta",
    name: "شلتتة",
    description: "مشلتت وفطائر حار وحلو.",
    cuisine: "فطور",
    area: "زيونة",
    open: true,
    rating: 4.7,
    deliveryTime: "25 - 35 دقيقة",
    priceRange: "25-35 د",
    image: "/images/m3.jpg",
  },
  {
    documentId: "khan",
    name: "خان قدوري",
    description: "أكلات عراقية شعبية ووجبات يومية.",
    cuisine: "مشاوي",
    area: "بغداد",
    open: true,
    rating: 4.6,
    deliveryTime: "30 - 40 دقيقة",
    priceRange: "20-35 د",
    image: "/images/m4.jpg",
  },
  {
    documentId: "alforn",
    name: "الفرن",
    description: "مناقيش، معجنات، كريب ووافل.",
    cuisine: "بيتزا",
    area: "بغداد",
    open: true,
    rating: 4.5,
    deliveryTime: "30 - 40 دقيقة",
    priceRange: "20-35 د",
    image: "/images/m5.jpg",
  },
];

const fallbackMenu: MenuDoc[] = [
  {
    documentId: "m1",
    restaurantName: "فيروز",
    restaurantId: "fayrouz",
    category: "فطور",
    name: "كاهي وقيمر",
    price: 4500,
    available: true,
    image: "/images/m6.jpg",
  },
  {
    documentId: "m2",
    restaurantName: "فيروز",
    restaurantId: "fayrouz",
    category: "فطور",
    name: "مخلمة عراقية",
    price: 5000,
    available: true,
    image: "/images/m7.jpg",
  },
  {
    documentId: "m3",
    restaurantName: "شلتتة",
    restaurantId: "shalteta",
    category: "فطور",
    name: "فطير جبن",
    price: 7500,
    available: true,
    image: "/images/m8.jpg",
  },
  {
    documentId: "m4",
    restaurantName: "خان قدوري",
    restaurantId: "khan",
    category: "مشاوي",
    name: "دجاج مشوي",
    price: 9000,
    available: true,
    image: "/images/m9.jpg",
  },
  {
    documentId: "m5",
    restaurantName: "الفرن",
    restaurantId: "alforn",
    category: "بيتزا",
    name: "بيتزا لحم",
    price: 8500,
    available: true,
    image: "/images/m10.jpg",
  },
  {
    documentId: "m6",
    restaurantName: "فيروز",
    restaurantId: "fayrouz",
    category: "مشروبات",
    name: "شاي عراقي",
    price: 1500,
    available: true,
    image: "/images/1.jpg",
  },
];

const categories = [
  { key: "الكل", label: "الكل", icon: "grid" },
  { key: "بركر", label: "بركر", icon: "burger" },
  { key: "بيتزا", label: "بيتزا", icon: "pizza" },
  { key: "مشاوي", label: "مشاوي", icon: "grill" },
  { key: "فطور", label: "فطور", icon: "breakfast" },
  { key: "مشروبات", label: "مشروبات", icon: "drink" },
];

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function readSession(): FuseSession | null {
  try {
    const raw = localStorage.getItem(FUSE_LOCAL_SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FuseSession;
    const role = parseFuseRole(parsed.role);
    if (!parsed.email || !role) return null;
    return { ...parsed, role };
  } catch {
    return null;
  }
}

function getRestaurantName(item: RestaurantDoc | MenuDoc) {
  return item.name || item.title || item.restaurantName || item.restaurant || "مطعم";
}

function isOpen(item: RestaurantDoc) {
  return item.active !== false && item.open !== false && item.isOpen !== false && item.status !== "مغلق";
}

function menuBelongsToRestaurant(menuItem: MenuDoc, restaurant: RestaurantDoc) {
  const restaurantName = getRestaurantName(restaurant);
  const menuRestaurant = menuItem.restaurantName || menuItem.restaurant || "";
  return menuItem.restaurantId === restaurant.documentId || menuRestaurant === restaurantName;
}

function menuAvailable(item: MenuDoc) {
  return item.available !== false && item.isAvailable !== false;
}

function restaurantSlug(name: string, documentId?: string) {
  const clean = `${name} ${documentId || ""}`.toLowerCase();

  if (clean.includes("fayrouz") || clean.includes("فيروز")) return "fayrouz";
  if (clean.includes("shalteta") || clean.includes("شلتتة")) return "shalteta";
  if (clean.includes("khan") || clean.includes("خان")) return "khan";
  if (clean.includes("alforn") || clean.includes("الفرن")) return "alforn";

  return documentId || "fayrouz";
}

function roleHomeSafe(role: FuseRole | null) {
  if (!role) return "/login";
  return roleHome[role] || "/login";
}

function formatIQD(value?: number) {
  return `${Number(value || 0).toLocaleString()} د.ع`;
}

function FuseMark() {
  return (
    <div className="fuse-mark">
      <span className="top" />
      <span className="mid" />
      <span className="stem" />
    </div>
  );
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

  if (name === "menu") return <svg {...p}><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></svg>;
  if (name === "search") return <svg {...p}><circle cx="11" cy="11" r="6" /><path d="M20 20l-4-4" /></svg>;
  if (name === "pin") return <svg {...p}><path d="M12 21s6-5 6-11a6 6 0 10-12 0c0 6 6 11 6 11z" /><circle cx="12" cy="10" r="2" /></svg>;
  if (name === "bell") return <svg {...p}><path d="M18 9a6 6 0 10-12 0c0 7-2 7-2 9h16c0-2-2-2-2-9z" /><path d="M10 21h4" /></svg>;
  if (name === "sliders") return <svg {...p}><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /><circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" /><circle cx="11" cy="18" r="2" fill="currentColor" stroke="none" /></svg>;
  if (name === "heart") return <svg {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.6-7 10-7 10z" /></svg>;
  if (name === "star") return <svg {...p}><path d="M12 3l2.7 5.4 6 .9-4.4 4.3 1 6-5.3-2.8-5.3 2.8 1-6L3.3 9.3l6-.9L12 3z" /></svg>;
  if (name === "clock") return <svg {...p}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>;
  if (name === "home") return <svg {...p}><path d="M4 11.5L12 5l8 6.5" /><path d="M6.5 10.5V19h11v-8.5" /></svg>;
  if (name === "explore") return <svg {...p}><circle cx="12" cy="12" r="8" /><path d="M9 15l2-6 4-2-2 4-6 2z" /></svg>;
  if (name === "reels") return <svg {...p}><rect x="5" y="4" width="14" height="16" rx="3" /><path d="M9 4l2 5" /><path d="M14 4l2 5" /><path d="M5 9h14" /><path d="M10 13l5 3-5 3v-6z" fill="currentColor" stroke="none" /></svg>;
  if (name === "cart") return <svg {...p}><path d="M4 6h2l1.5 8h8l2-6H8" /><circle cx="10" cy="18" r="1.4" /><circle cx="16" cy="18" r="1.4" /></svg>;
  if (name === "orders") return <svg {...p}><rect x="6" y="4" width="12" height="16" rx="2" /><path d="M9 9h6" /><path d="M9 13h6" /></svg>;
  if (name === "user") return <svg {...p}><circle cx="12" cy="8" r="3" /><path d="M5 19c2-3 4-4.5 7-4.5s5 1.5 7 4.5" /></svg>;
  if (name === "grid") return <svg {...p}><rect x="4" y="4" width="6" height="6" rx="1.5" /><rect x="14" y="4" width="6" height="6" rx="1.5" /><rect x="4" y="14" width="6" height="6" rx="1.5" /><rect x="14" y="14" width="6" height="6" rx="1.5" /></svg>;
  if (name === "burger") return <svg {...p}><path d="M5 10a7 7 0 0114 0H5z" /><path d="M4.5 13h15" /><path d="M5.5 16h13" /><path d="M7 19h10" /></svg>;
  if (name === "pizza") return <svg {...p}><path d="M4 8c4-2 12-2 16 0L12 20 4 8z" /><circle cx="10" cy="10.5" r="1" fill="currentColor" stroke="none" /><circle cx="14" cy="12" r="1" fill="currentColor" stroke="none" /></svg>;
  if (name === "grill") return <svg {...p}><path d="M6 6c2-2 4-2 6 0s4 2 6 0" /><path d="M8 8l8 8" /><path d="M16 8l-8 8" /></svg>;
  if (name === "breakfast") return <svg {...p}><path d="M7 6v6a4 4 0 004 4h1a4 4 0 004-4V6" /><path d="M7 10h10" /><path d="M9 4v2" /><path d="M12 4v2" /><path d="M15 4v2" /></svg>;
  if (name === "drink") return <svg {...p}><path d="M8 4h8" /><path d="M10 4l1 16h2l1-16" /><path d="M12 4l4-2" /></svg>;

  return <svg {...p}><circle cx="12" cy="12" r="8" /></svg>;
}

function SafeImage({
  src,
  alt,
  className,
  label,
}: {
  src?: string;
  alt: string;
  className?: string;
  label: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`${className || ""} image-fallback`}>
        <FuseMark />
        <b>{label}</b>
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}

export default function HomePage() {
  const [session, setSession] = useState<FuseSession | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantDoc[]>([]);
  const [menu, setMenu] = useState<MenuDoc[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("الكل");
  const [cartCount, setCartCount] = useState(0);
  const [notice, setNotice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [locationNotice, setLocationNotice] = useState("بغداد - المنصور");

  useEffect(() => {
    setSession(readSession());

    const unsubscribeRestaurants = onSnapshot(
      query(collection(db, "restaurants")),
      (snapshot) => {
        setRestaurants(
          snapshot.docs.map((doc) => ({
            ...(doc.data() as Omit<RestaurantDoc, "documentId">),
            documentId: doc.id,
          }))
        );
      },
      () => setRestaurants([])
    );

    const unsubscribeMenu = onSnapshot(
      query(collection(db, "menu")),
      (snapshot) => {
        setMenu(
          snapshot.docs.map((doc) => ({
            ...(doc.data() as Omit<MenuDoc, "documentId">),
            documentId: doc.id,
          }))
        );
      },
      () => setMenu([])
    );

    return () => {
      unsubscribeRestaurants();
      unsubscribeMenu();
    };
  }, []);

  useEffect(() => {
    function refreshCartCount() {
      setCartCount(readFuseCart().reduce((sum, item) => sum + item.qty, 0));
    }

    refreshCartCount();
    window.addEventListener(FUSE_CART_EVENT, refreshCartCount);
    window.addEventListener("storage", refreshCartCount);

    return () => {
      window.removeEventListener(FUSE_CART_EVENT, refreshCartCount);
      window.removeEventListener("storage", refreshCartCount);
    };
  }, []);

  const sourceRestaurants = restaurants.length
    ? restaurants.map((item, index) => ({
        ...item,
        image: item.image || item.cover || item.logo || `/images/m${index + 2}.jpg`,
      }))
    : fallbackRestaurants;

  const sourceMenu = menu.length
    ? menu.map((item, index) => ({
        ...item,
        image: item.image || `/images/m${index + 6}.jpg`,
      }))
    : fallbackMenu;

  const role = session?.role || null;
  const availableRestaurants = useMemo(() => sourceRestaurants.filter(isOpen), [sourceRestaurants]);

  const visibleRestaurants = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    return availableRestaurants.filter((restaurant) => {
      const name = getRestaurantName(restaurant);
      const haystack = `${name} ${restaurant.description || ""} ${restaurant.cuisine || ""}`.toLowerCase();

      const matchesSearch = !cleanSearch || haystack.includes(cleanSearch);
      const matchesCategory = category === "الكل" || restaurant.cuisine === category;

      return matchesSearch && matchesCategory;
    });
  }, [availableRestaurants, category, search]);

  const featuredRestaurants = visibleRestaurants.slice(0, 3);
  const popularMenu = sourceMenu.filter((item) => menuAvailable(item) && availableRestaurants.some((restaurant) => menuBelongsToRestaurant(item, restaurant))).slice(0, 6);

  function showNotice(text: string) {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function addPopularToCart(item: MenuDoc) {
    const restaurantName = item.restaurantName || item.restaurant || "FUSE";
    const slug = restaurantSlug(restaurantName, item.restaurantId);

    const next = addFuseCartItem({
      id: item.documentId,
      name: item.name || item.title || "صنف",
      restaurant: restaurantName,
      restaurantId: slug,
      category: item.category || "عام",
      price: Number(item.price || 0),
      qty: 1,
      image: item.image,
    });

    setCartCount(next.reduce((sum, cartItem) => sum + cartItem.qty, 0));
    showNotice("تمت الإضافة للسلة بنجاح");
  }

  async function logout() {
    await performFuseLogout("/");
  }

  return (
    <main dir="rtl" className="page home-page">
      <section className="phone">
        <header className="topbar">
          <Link className="menu-btn" aria-label="القائمة" href="/profile">
            <Icon name="menu" />
          </Link>

          <div className="brand-location">
            <strong>FUSE IRAQ</strong>
            <button className="location" type="button" onClick={() => {
              setLocationNotice((current) => current === "بغداد - المنصور" ? "بغداد - زيونة" : "بغداد - المنصور");
              showNotice("تم تحديث موقع العرض التجريبي");
            }}>
              <Icon name="pin" />
              <b>{locationNotice}</b>
            </button>
          </div>

          <div className="top-actions">
            <Link href="/notification-center" className="icon-btn">
              <Icon name="bell" />
            </Link>

            <Link href={session && role ? roleHomeSafe(role) : "/login"} className="profile">
              <FuseMark />
            </Link>
          </div>
        </header>

        <section className="search-row">
          <div className="search-box">
            <Icon name="search" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="إبحث عن مطعم أو وجبة..."
            />
          </div>

          <button className="filter-btn" type="button" onClick={() => {
            setFiltersOpen((current) => !current);
            showNotice("الفلاتر جاهزة للاستخدام");
          }}>
            <Icon name="sliders" />
          </button>
        </section>

        <section className="categories">
          {categories.map((item) => (
            <button
              key={item.key}
              onClick={() => setCategory(item.key)}
              className={category === item.key ? "active" : ""}
            >
              <span>
                <Icon name={item.icon} />
              </span>
              <b>{item.label}</b>
            </button>
          ))}
        </section>

        {filtersOpen ? (
          <section className="filter-panel">
            <button type="button" onClick={() => setCategory("الكل")}>الكل</button>
            <button type="button" onClick={() => setCategory("فطور")}>فطور</button>
            <button type="button" onClick={() => setCategory("مشاوي")}>مشاوي</button>
            <button type="button" onClick={() => setCategory("بيتزا")}>بيتزا</button>
          </section>
        ) : null}

        <section className="hero">
          <div className="hero-copy">
            <span>عرض خاص</span>
            <h1>خصم حتى 50%</h1>
            <p>على أول طلب داخل FUSE</p>
            <Link href="/restaurants/fayrouz">اطلب الآن</Link>
          </div>

          <div className="hero-food">
            <SafeImage src={heroImage} alt="عرض فيوز" className="hero-img" label="FUSE" />
          </div>
        </section>

        <section className="benefits">
          <div>
            <Icon name="clock" />
            <b>توصيل سريع</b>
            <small>30-45 دقيقة</small>
          </div>

          <div>
            <Icon name="star" />
            <b>جودة مضمونة</b>
            <small>أفضل المطاعم</small>
          </div>

          <div>
            <Icon name="pin" />
            <b>قريب منك</b>
            <small>داخل بغداد</small>
          </div>
        </section>

        <section className="section-head">
          <div>
            <small>قريب منك</small>
            <h2>المطاعم المميزة</h2>
          </div>

          <button onClick={() => setCategory("الكل")}>عرض الكل</button>
        </section>

        <section className="restaurants">
          {featuredRestaurants.map((restaurant) => {
            const name = getRestaurantName(restaurant);
            const slug = restaurantSlug(name, restaurant.documentId);
            const image = restaurant.image || restaurant.cover || restaurant.logo || "";

            return (
              <Link href={`/restaurants/${slug}`} key={restaurant.documentId} className="rest-card">
                <div className="rest-img-wrap">
                  <SafeImage src={image} alt={name} className="rest-img" label={name} />

                  <button type="button" className="heart">
                    <Icon name="heart" />
                  </button>

                  <span className="time">{restaurant.deliveryTime || "25-35 د"}</span>
                </div>

                <div className="rest-body">
                  <div className="rest-rating">
                    <Icon name="star" />
                    <b>{Number(restaurant.rating || 4.8).toFixed(1)}</b>
                  </div>

                  <h3>{name}</h3>
                  <p>{restaurant.cuisine || "مطعم"} · {restaurant.area || "بغداد"}</p>

                  <div className="rest-footer">
                    <strong>{restaurant.priceRange || "25-35 د"}</strong>
                    <span>{isOpen(restaurant) ? "اطلب الآن" : "مغلق"}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        <section className="section-head second">
          <div>
            <small>الأكثر طلباً</small>
            <h2>اختيارات سريعة</h2>
          </div>

          <button type="button" onClick={() => setCategory("الكل")}>عرض الكل</button>
        </section>

        <section className="products">
          {popularMenu.map((item) => {
            const restaurantName = item.restaurantName || item.restaurant || "FUSE";
            const slug = restaurantSlug(restaurantName, item.restaurantId);

            return (
              <article key={item.documentId} className="product">
                <Link href={`/restaurants/${slug}`} className="product-image-link">
                  <SafeImage
                    src={item.image}
                    alt={item.name || item.title || "صنف"}
                    className="product-img"
                    label={item.name || "FUSE"}
                  />
                </Link>

                <div className="product-body">
                  <Link href={`/restaurants/${slug}`} className="product-title-link">
                    <h3>{item.name || item.title || "صنف"}</h3>
                    <p>{restaurantName}</p>
                  </Link>

                  <div>
                    <strong>{formatIQD(item.price)}</strong>
                    <button type="button" onClick={() => addPopularToCart(item)} aria-label="إضافة للسلة">+</button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {notice ? <div className="toast">{notice}</div> : null}

        {session ? (
          <button onClick={logout} className="logout">
            خروج
          </button>
        ) : null}
      </section>

      <style jsx>{`
        :global(*) {
          box-sizing: border-box;
        }

        :global(html),
        :global(body) {
          margin: 0;
          padding: 0;
          background: #f4efe6;
        }

        .page {
          min-height: 100vh;
          background: transparent;
          display: block;
          padding: calc(12px + env(safe-area-inset-top)) 14px calc(104px + env(safe-area-inset-bottom));
          font-family: var(--fuse-body-font);
        }

        .phone {
          width: min(100%, 430px);
          min-height: 0;
          position: relative;
          margin: 0 auto;
          border-radius: 0;
          overflow: visible;
          padding: 0;
          background: transparent;
          color: var(--ref-ink, #15171a);
          box-shadow: none;
        }

        .topbar {
          display: grid;
          grid-template-columns: 48px 1fr auto;
          align-items: center;
          gap: 10px;
          margin: 0 0 14px;
          padding: 8px 10px;
          border-radius: 28px;
          background: rgba(255, 252, 247, 0.82);
          border: 1px solid rgba(255, 255, 255, 0.95);
          box-shadow: 0 10px 28px rgba(21, 23, 26, 0.08);
          backdrop-filter: blur(22px) saturate(145%);
          color: #15171a;
        }

        .menu-btn,
        .filter-btn,
        .icon-btn,
        .profile {
          border: 0;
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          text-decoration: none;
          cursor: pointer;
        }

        .menu-btn {
          background: linear-gradient(135deg, #1f7a4f, #2f915f);
          color: #fff;
          box-shadow: 0 10px 24px rgba(31, 122, 79, 0.22);
        }

        .location {
          border: 0;
          background: transparent;
          color: #6f7175;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-size: 16px;
          font-weight: 800;
          min-width: 0;
        }

        .location svg {
          color: #1f7a4f;
          flex: 0 0 auto;
        }

        .location b {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .icon-btn {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          color: #15171a;
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(21, 23, 26, 0.08);
          box-shadow: none;
        }

        .profile {
          width: 48px;
          height: 48px;
          border-radius: 999px;
          background: linear-gradient(135deg, #1f7a4f, #2f915f);
          color: #fff;
          overflow: hidden;
        }

        .fuse-mark {
          width: 31px;
          height: 28px;
          position: relative;
        }

        .fuse-mark span {
          position: absolute;
          display: block;
          background: linear-gradient(135deg, #ff8a00, #ff3d00);
        }

        .fuse-mark .top {
          width: 30px;
          height: 10px;
          top: 0;
          right: 0;
          border-radius: 18px 18px 14px 3px;
          transform: skewX(-18deg);
        }

        .fuse-mark .mid {
          width: 24px;
          height: 9px;
          top: 11px;
          right: 5px;
          border-radius: 16px 14px 14px 3px;
          transform: skewX(-18deg);
        }

        .fuse-mark .stem {
          width: 11px;
          height: 20px;
          top: 8px;
          right: 18px;
          border-radius: 14px 3px 14px 14px;
          transform: skewX(-18deg);
        }

        .search-row {
          display: grid;
          grid-template-columns: 1fr 52px;
          gap: 10px;
          margin: 0 0 14px;
          padding: 0;
          background: transparent;
        }

        .search-box {
          height: 52px;
          border-radius: 22px;
          background: rgba(255, 252, 247, 0.82);
          border: 1px solid rgba(21, 23, 26, 0.08);
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 15px;
          color: #8d847b;
          box-shadow: 0 10px 28px rgba(21, 23, 26, 0.06);
          backdrop-filter: blur(18px);
        }

        .search-box input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #0b1220;
          font-size: 15px;
          font-weight: 600;
        }

        .search-box input::placeholder {
          color: #9b938b;
        }

        .filter-btn {
          background: linear-gradient(135deg, #1f7a4f, #2f915f);
          color: #fff;
          border-radius: 18px;
          box-shadow: 0 12px 28px rgba(31, 122, 79, 0.22);
        }

        .categories {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: 68px;
          gap: 7px;
          overflow-x: auto;
          padding: 1px 0 14px;
          scrollbar-width: none;
          scroll-padding-inline: 16px;
        }

        .categories::-webkit-scrollbar {
          display: none;
        }

        .categories button {
          border: 0;
          background: transparent;
          display: grid;
          justify-items: center;
          gap: 6px;
          color: #0b1220;
          cursor: pointer;
        }

        .categories span {
          width: 54px;
          height: 54px;
          border-radius: 18px;
          background: #fffdf9;
          display: grid;
          place-items: center;
          color: #0b1220;
          box-shadow: 0 14px 28px rgba(11, 18, 32, 0.08);
        }

        .categories button.active span {
          color: #fff;
          background: linear-gradient(135deg, #1f7a4f, #2f915f);
          box-shadow: 0 12px 24px rgba(31, 122, 79, 0.2);
        }

        .categories b {
          font-size: 11px;
          font-weight: 700;
        }

        .hero {
          position: relative;
          overflow: hidden;
          min-height: 184px;
          border-radius: 28px;
          background:
            radial-gradient(circle at 18% 50%, rgba(255, 255, 255, 0.16), transparent 36%),
            linear-gradient(135deg, #1a2235 0%, #263759 100%);
          display: grid;
          grid-template-columns: 1fr 46%;
          margin-bottom: 13px;
          box-shadow: 0 16px 42px rgba(26, 34, 53, 0.18);
        }

        .hero::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 25% 50%, rgba(11, 18, 32, 0.12), transparent 32%),
            linear-gradient(90deg, rgba(0, 0, 0, 0.16), transparent 44%);
          pointer-events: none;
        }

        .hero-copy {
          padding: 19px 18px;
          color: #fff7ee;
          position: relative;
          z-index: 3;
        }

        .hero-copy span {
          display: inline-flex;
          border-radius: 999px;
          padding: 7px 12px;
          background: rgba(255, 255, 255, 0.18);
          font-size: 12px;
          font-weight: 700;
        }

        .hero-copy h1 {
          margin: 10px 0 0;
          font-family: var(--fuse-title-font);
          font-size: 32px;
          line-height: 0.98;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .hero-copy p {
          margin: 9px 0 13px;
          font-size: 13px;
          font-weight: 600;
        }

        .hero-copy a {
          height: 38px;
          min-width: 105px;
          border-radius: 999px;
          display: inline-grid;
          place-items: center;
          padding: 0 17px;
          background: linear-gradient(135deg, #1f7a4f, #2f915f);
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
        }

        .hero-food {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 49%;
          z-index: 2;
          overflow: hidden;
          border-top-left-radius: 25px;
          border-bottom-left-radius: 25px;
        }

        .hero-food::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, transparent 0%, rgba(23, 23, 23, 0.12) 55%, rgba(23, 23, 23, 0.92) 100%);
          pointer-events: none;
        }

        .hero-img {
          width: 100%;
          height: 100%;
          border: 0;
          border-radius: 0;
          object-fit: cover;
          object-position: center;
          display: block;
          transform: scale(1.04);
        }

        .benefits {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          padding: 10px;
          border-radius: 20px;
          background: #fffdf9;
          box-shadow: 0 16px 34px rgba(11, 18, 32, 0.08);
          margin-bottom: 19px;
        }

        .benefits div {
          display: grid;
          justify-items: center;
          text-align: center;
          gap: 4px;
          color: #0b1220;
        }

        .benefits svg {
          color: #ff5a00;
          width: 23px;
          height: 23px;
        }

        .benefits b {
          font-size: 12px;
          font-weight: 700;
        }

        .benefits small {
          font-size: 10px;
          color: #786f66;
          font-weight: 500;
        }

        .section-head {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 12px;
          margin-bottom: 13px;
        }

        .section-head.second {
          margin-top: 8px;
        }

        .section-head small {
          display: block;
          margin-bottom: 4px;
          color: #1f7a4f;
          font-size: 11px;
          font-weight: 700;
        }

        .section-head h2 {
          margin: 0;
          color: #0b1220;
          font-family: var(--fuse-title-font);
          font-size: 23px;
          line-height: 1.1;
          font-weight: 900;
        }

        .section-head button {
          border: 0;
          background: transparent;
          color: #1f7a4f;
          font-size: 13px;
          font-weight: 700;
        }

        .restaurants {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 11px;
          padding-bottom: 18px;
        }

        .rest-card {
          overflow: hidden;
          border-radius: 21px;
          background: #fffdf9;
          color: #0b1220;
          text-decoration: none;
          box-shadow: 0 18px 40px rgba(11, 18, 32, 0.09);
        }

        .rest-img-wrap {
          position: relative;
          height: 116px;
          background: #0b1220;
          overflow: hidden;
        }

        .rest-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        .heart {
          position: absolute;
          top: 9px;
          right: 9px;
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(255, 253, 249, 0.94);
          color: #0b1220;
          box-shadow: 0 10px 20px rgba(11, 18, 32, 0.12);
        }

        .heart svg {
          width: 18px;
          height: 18px;
        }

        .time {
          position: absolute;
          top: 9px;
          left: 9px;
          border-radius: 999px;
          background: rgba(11, 18, 32, 0.82);
          color: #fff7ee;
          padding: 6px 9px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .rest-body {
          padding: 11px;
        }

        .rest-rating {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #ff5a00;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .rest-rating svg {
          width: 14px;
          height: 14px;
        }

        .rest-body h3 {
          margin: 0;
          color: #0b1220;
          font-family: var(--fuse-title-font);
          font-size: 18px;
          line-height: 1.1;
          font-weight: 900;
        }

        .rest-body p {
          margin: 6px 0 11px;
          color: #786f66;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rest-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }

        .rest-footer strong {
          color: #0b1220;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .rest-footer span {
          height: 32px;
          min-width: 76px;
          border-radius: 999px;
          background: linear-gradient(135deg, #ff7a00, #ff3d00);
          color: #fff7ee;
          display: grid;
          place-items: center;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .products {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 13px;
          padding-bottom: 8px;
        }

        .product {
          overflow: hidden;
          border-radius: 24px;
          background: #fffdf9;
          color: #0b1220;
          text-decoration: none;
          box-shadow: 0 16px 34px rgba(11, 18, 32, 0.08);
        }

        .product-img {
          width: 100%;
          height: 112px;
          object-fit: cover;
          object-position: center;
          display: block;
          background: #0b1220;
        }

        .product-body {
          padding: 11px;
        }

        .product h3 {
          margin: 0;
          font-family: var(--fuse-title-font);
          font-size: 15px;
          line-height: 1.15;
          font-weight: 900;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .product p {
          margin: 5px 0 10px;
          color: #786f66;
          font-size: 11px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .product-body div {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .product strong {
          color: #ff5a00;
          font-size: 12px;
          font-weight: 700;
        }

        .product-body button {
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: #ff5a00;
          color: #fff7ee;
          font-size: 21px;
          font-weight: 900;
          line-height: 1;
          cursor: pointer;
        }

        .home-nav {
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 12px;
          height: 72px;
          border: 1px solid rgba(255, 255, 255, 0.62);
          border-radius: 24px;
          background: rgba(255, 250, 244, 0.96);
          backdrop-filter: blur(22px) saturate(145%);
          -webkit-backdrop-filter: blur(22px) saturate(145%);
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          padding: 5px 8px;
          box-shadow: 0 10px 28px rgba(11, 18, 32, 0.2);
        }

        .home-nav a {
          color: #0b1220;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          width: 100%;
          height: 58px;
          margin: auto;
          border-radius: 18px;
        }

        .home-nav a.active {
          color: #ff5a00;
          background: rgba(255, 90, 0, 0.10);
          box-shadow: none;
        }

        .home-nav b {
          display: block;
          font-size: 11px;
          line-height: 1.15;
          font-weight: 900;
          white-space: nowrap;
        }

        .home-nav svg {
          width: 22px;
          height: 22px;
          flex: 0 0 auto;
        }

        .image-fallback {
          position: relative;
          background:
            radial-gradient(circle at top right, rgba(255, 106, 0, 0.24), transparent 35%),
            linear-gradient(135deg, #0b1220, #162033);
          color: #fff7ee;
          display: grid;
          place-items: center;
          gap: 6px;
          text-align: center;
          padding: 10px;
        }

        .image-fallback b {
          font-size: 12px;
          color: rgba(255, 247, 238, 0.78);
        }

        .logout {
          position: fixed;
          top: 18px;
          left: 18px;
          z-index: 80;
          border: 0;
          border-radius: 999px;
          background: #0b1220;
          color: #fff7ee;
          padding: 12px 18px;
          font-family: inherit;
          font-weight: 900;
          box-shadow: 0 18px 34px rgba(11,18,32,0.24);
          cursor: pointer;
        }

        .toast {
          position: fixed;
          left: 50%;
          bottom: 98px;
          transform: translateX(-50%);
          z-index: 90;
          width: min(360px, calc(100% - 34px));
          border-radius: 20px;
          background: #0b1220;
          color: #fff7ee;
          padding: 14px 18px;
          text-align: center;
          font-weight: 900;
          box-shadow: 0 18px 45px rgba(11,18,32,0.28);
        }

        .filter-panel {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin: 0 0 14px;
        }

        .filter-panel button {
          border: 0;
          border-radius: 16px;
          background: #0b1220;
          color: #fff7ee;
          padding: 11px 8px;
          font-family: inherit;
          font-weight: 900;
          cursor: pointer;
        }

        @media (max-width: 520px) {
          .page {
            padding: 0;
            display: block;
            background: #fff7ee;
          }

          .phone {
            width: 100%;
            min-height: 100dvh;
            border-radius: 0;
            box-shadow: none;
            padding-top: max(18px, env(safe-area-inset-top));
            padding-left: max(12px, env(safe-area-inset-left));
            padding-right: max(12px, env(safe-area-inset-right));
            padding-bottom: calc(128px + env(safe-area-inset-bottom));
          }

          .categories {
            grid-auto-flow: row;
            grid-auto-columns: auto;
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 4px;
            overflow: visible;
            width: 100%;
          }

          .categories span {
            width: clamp(42px, 12vw, 50px);
            height: clamp(42px, 12vw, 50px);
            border-radius: 15px;
          }

          .categories b {
            font-size: clamp(9px, 2.6vw, 11px);
            white-space: nowrap;
          }

          .home-nav {
            position: fixed;
            left: 12px;
            right: 12px;
            bottom: max(5px, env(safe-area-inset-bottom));
            width: auto;
            max-width: none;
            margin: 0;
            transform: none;
            z-index: 9999;
          }
        }

        @media (max-width: 390px) {
          .phone {
            padding-left: 13px;
            padding-right: 13px;
          }

          .topbar {
            grid-template-columns: 50px 1fr auto;
          }

          .menu-btn,
          .filter-btn {
            width: 50px;
            height: 50px;
          }

          .hero { min-height: 180px; }

          .hero-copy h1 {
            font-size: 29px;
          }

          .hero-food {
            width: 48%;
          }

          .restaurants {
            gap: 12px;
          }

          .rest-img-wrap {
            height: 108px;
          }

          .products {
            gap: 12px;
          }

          .product-img {
            height: 104px;
          }
        }
      `}</style>
    </main>
  );
}
