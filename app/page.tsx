"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "./firebase";
import { firebaseAuth } from "@/lib/firebase/client";
import { addFuseCartItem, FUSE_CART_EVENT, readFuseCart } from "@/lib/fuse-cart";
import { catalogIsLive, FUSE_RESTAURANT_IDS, isCatalogMenuItemId, restaurantHasLiveCatalog } from "@/lib/fuse-catalog";
import { performFuseLogout } from "@/lib/fuse-logout";
import FuseIcon, { type FuseIconName } from "@/components/FuseIcon";
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

const categories: Array<{ key: string; label: string; icon: FuseIconName }> = [
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

  const menuLive = useMemo(() => catalogIsLive(menu), [menu]);

  const liveCatalogMenu = useMemo(
    () =>
      menu.filter(
        (item) =>
          menuAvailable(item) &&
          isCatalogMenuItemId(item.documentId) &&
          FUSE_RESTAURANT_IDS.includes(String(item.restaurantId || "").trim().toLowerCase() as (typeof FUSE_RESTAURANT_IDS)[number])
      ),
    [menu]
  );

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
  const popularMenu = useMemo(
    () =>
      liveCatalogMenu
        .filter((item) =>
          availableRestaurants.some(
            (restaurant) =>
              menuBelongsToRestaurant(item, restaurant) &&
              restaurantHasLiveCatalog(menu, restaurant.documentId)
          )
        )
        .slice(0, 6),
    [liveCatalogMenu, menu, availableRestaurants]
  );

  function canQuickAdd(item: MenuDoc) {
    if (!menuLive || !isCatalogMenuItemId(item.documentId)) return false;
    const restaurantId = String(item.restaurantId || "").trim().toLowerCase();
    return restaurantHasLiveCatalog(menu, restaurantId);
  }

  function showNotice(text: string) {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function addPopularToCart(item: MenuDoc) {
    if (!canQuickAdd(item)) {
      showNotice("المنيو غير متصل بقاعدة البيانات. افتح المطعم بعد تفعيل المنيو.");
      return;
    }

    const restaurantName = item.restaurantName || item.restaurant || "FUSE";
    const canonicalRestaurantId = String(item.restaurantId || "").trim().toLowerCase();

    const next = addFuseCartItem({
      id: item.documentId,
      name: item.name || item.title || "صنف",
      restaurant: restaurantName,
      restaurantId: canonicalRestaurantId,
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
            <FuseIcon name="menu" />
          </Link>

          <div className="brand-location">
            <strong>FUSE Iraq</strong>
            <button className="location" type="button" onClick={() => {
              setLocationNotice((current) => current === "بغداد - المنصور" ? "بغداد - زيونة" : "بغداد - المنصور");
              showNotice("تم تحديث منطقة التوصيل");
            }}>
              <FuseIcon name="pin" />
              <b>{locationNotice}</b>
            </button>
          </div>

          <div className="top-actions">
            <Link href="/notification-center" className="icon-btn">
              <FuseIcon name="bell" />
            </Link>

            <Link href={session && role ? roleHomeSafe(role) : "/login"} className="profile">
              <FuseMark />
            </Link>
          </div>
        </header>

        <section className="search-row">
          <div className="search-box">
            <FuseIcon name="search" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="إبحث عن مطعم أو وجبة..."
            />
          </div>

          <button className="filter-btn" type="button" onClick={() => showNotice("استخدم التصنيفات للتصفية")}>
            <FuseIcon name="sliders" />
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
                <FuseIcon name={item.icon} />
              </span>
              <b>{item.label}</b>
            </button>
          ))}
        </section>

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
            <FuseIcon name="clock" />
            <b>توصيل سريع</b>
            <small>30-45 دقيقة</small>
          </div>

          <div>
            <FuseIcon name="star" />
            <b>جودة مضمونة</b>
            <small>أفضل المطاعم</small>
          </div>

          <div>
            <FuseIcon name="pin" />
            <b>قريب منك</b>
            <small>داخل بغداد</small>
          </div>
        </section>

        <section className="section-head">
          <div>
            <small>مختارات لك</small>
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
                    <FuseIcon name="heart" />
                  </button>

                  <span className="time">{restaurant.deliveryTime || "25-35 د"}</span>
                </div>

                <div className="rest-body">
                  <div className="rest-rating">
                    <FuseIcon name="star" />
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
                    <button type="button" disabled={!canQuickAdd(item)} onClick={() => addPopularToCart(item)} aria-label="إضافة للسلة">+</button>
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
          padding: 0;
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
          color: var(--ref-green);
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
          color: var(--ref-green);
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
          color: var(--ref-green);
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
          background: linear-gradient(135deg, var(--ref-green), var(--ref-green-2));
          color: #fff7ee;
          font-size: 21px;
          font-weight: 900;
          line-height: 1;
          cursor: pointer;
        }

        .toast {
          position: fixed;
          left: 50%;
          bottom: var(--fuse-toast-bottom, 96px);
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

        @media (max-width: 520px) {
          .page {
            display: block;
            background: transparent;
          }

          .phone {
            width: 100%;
            min-height: 0;
            border-radius: 0;
            box-shadow: none;
            padding: 0;
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
