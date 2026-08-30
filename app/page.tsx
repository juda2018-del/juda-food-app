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

    </main>
  );
}
