"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "./firebase";
import {
  FUSE_COOKIE_EMAIL,
  FUSE_COOKIE_NAME,
  FUSE_COOKIE_PHONE,
  FUSE_COOKIE_RESTAURANT,
  FUSE_COOKIE_ROLE,
  FUSE_LOCAL_SESSION,
  parseFuseRole,
  roleHome,
  roleTitle,
  type FuseRole,
  type FuseSession,
} from "@/lib/fuse-auth";

type RestaurantDoc = {
  documentId: string;
  name?: string;
  title?: string;
  restaurant?: string;
  description?: string;
  cuisine?: string;
  area?: string;
  address?: string;
  status?: string;
  open?: boolean;
  isOpen?: boolean;
  distanceKm?: number;
  km?: number;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
};

type MenuDoc = {
  documentId: string;
  name?: string;
  title?: string;
  restaurant?: string;
  restaurantName?: string;
  category?: string;
  price?: number;
  available?: boolean;
  isAvailable?: boolean;
};

type QuickLink = {
  title: string;
  desc: string;
  href: string;
  icon: string;
  adminOnly?: boolean;
};

const fallbackRestaurants: RestaurantDoc[] = [
  {
    documentId: "fallback-fayrouz",
    name: "فيروز",
    description: "فطور عراقي، كاهي، بورك، وأكلات صباحية.",
    cuisine: "فطور عراقي",
    area: "زيونة",
    distanceKm: 2.4,
    open: true,
  },
  {
    documentId: "fallback-shalteta",
    name: "شلتتة",
    description: "مشلتت وفطائر حلوة ومالحة.",
    cuisine: "فطائر ومشلتت",
    area: "بغداد",
    distanceKm: 3.1,
    open: true,
  },
  {
    documentId: "fallback-khan",
    name: "خان قدوري",
    description: "أكلات عراقية شعبية ووجبات يومية.",
    cuisine: "أكل عراقي",
    area: "بغداد",
    distanceKm: 5.8,
    open: true,
  },
  {
    documentId: "fallback-alforn",
    name: "الفرن",
    description: "مناقيش، معجنات، كريب ووافل.",
    cuisine: "معجنات",
    area: "بغداد",
    distanceKm: 6.6,
    open: true,
  },
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

function getRestaurantName(item: RestaurantDoc) {
  const safe = item as RestaurantDoc & { name?: string; title?: string; restaurantName?: string };
  return safe.name || safe.title || safe.restaurantName || "مطعم";
}

function getDescription(item: RestaurantDoc) {
  return item.description || item.cuisine || "مطعم قريب منك ضمن شبكة FUSE.";
}

function isOpen(item: RestaurantDoc) {
  return item.open !== false && item.isOpen !== false && item.status !== "مغلق";
}

function menuAvailable(item: MenuDoc) {
  return item.available !== false && item.isAvailable !== false;
}

function getLat(item: RestaurantDoc) {
  return Number(item.lat ?? item.latitude ?? 0);
}

function getLng(item: RestaurantDoc) {
  return Number(item.lng ?? item.longitude ?? 0);
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return r * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function restaurantDistance(item: RestaurantDoc, userLocation: { lat: number; lng: number } | null) {
  const itemLat = getLat(item);
  const itemLng = getLng(item);

  if (userLocation && itemLat && itemLng) {
    return haversineKm(userLocation.lat, userLocation.lng, itemLat, itemLng);
  }

  return Number(item.distanceKm ?? item.km ?? 3.5);
}

function restaurantSlug(name: string) {
  if (name.includes("فيروز")) return "fayrouz";
  if (name.includes("شلتتة")) return "shalteta";
  if (name.includes("خان")) return "khan";
  if (name.includes("الفرن")) return "alforn";
  return "fayrouz";
}

function roleLinks(role: FuseRole | null): QuickLink[] {
  if (role === "admin") {
    return [
      { title: "الطلبات المباشرة", desc: "متابعة كل الطلبات", href: "/live-orders", icon: "📡" },
      { title: "لوحة المطعم", desc: "طلبات ومنيو المطاعم", href: "/restaurant-admin", icon: "🍽️" },
      { title: "تطبيق السائق", desc: "طلبات السائق والحالة", href: "/driver-app", icon: "🛵" },
      { title: "تقييم الطلب", desc: "تقييم المطعم والسائق", href: "/ratings", icon: "⭐" },
      { title: "حالة الطلب", desc: "بحث وتتبع حالة الطلب", href: "/order-status", icon: "📦" },
      { title: "لوحة الإدارة", desc: "مركز قيادة FUSE", href: "/fuse-admin", icon: "👑" },
      { title: "التوزيع التلقائي", desc: "ربط الطلب بالسائق", href: "/auto-dispatch", icon: "⚡" },
      { title: "أدوات النظام", desc: "تنظيف وفحص البيانات", href: "/system-tools", icon: "🧰" },
    ];
  }

  if (role === "restaurant") {
    return [
      { title: "لوحة المطعم", desc: "طلبات ومنيو المطعم", href: "/restaurant-admin", icon: "🍽️" },
      { title: "الطلبات المباشرة", desc: "طلبات مطعمك مباشرة", href: "/live-orders", icon: "📡" },
      { title: "الإشعارات", desc: "تنبيهات الطلبات", href: "/notification-center", icon: "🔔" },
      { title: "التقارير", desc: "مبيعات وأداء المطعم", href: "/reports", icon: "📊" },
    ];
  }

  if (role === "driver") {
    return [
      { title: "تطبيق السائق", desc: "طلباتي وحالتي", href: "/driver-app", icon: "🛵" },
      { title: "الطلبات المباشرة", desc: "طلبات قيد التوصيل", href: "/live-orders", icon: "📡" },
    ];
  }

  return [
    { title: "الطلبات المباشرة", desc: "متابعة الطلبات والتحديثات", href: "/live-orders", icon: "📡" },
    { title: "حالة الطلب", desc: "بحث وتتبع حالة الطلب", href: "/order-status", icon: "📦" },
    { title: "تقييم الطلب", desc: "قيّم تجربتك بعد الطلب", href: "/ratings", icon: "⭐" },
  ];
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top right, rgba(255,122,0,0.18), transparent 34%), #050505",
    color: "white",
    padding: "26px 16px",
    fontFamily: "Arial, sans-serif",
  },
  shell: {
    width: "100%",
    maxWidth: 1180,
    margin: "0 auto",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 18,
    background: "#FF7A00",
    color: "#050505",
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    fontSize: 24,
  },
  pill: {
    border: "1px solid rgba(255,255,255,0.13)",
    borderRadius: 999,
    background: "rgba(255,255,255,0.05)",
    padding: "11px 16px",
    color: "rgba(255,255,255,0.82)",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 900,
  },
  activePill: {
    border: "1px solid rgba(255,122,0,0.35)",
    borderRadius: 999,
    background: "#FF7A00",
    padding: "11px 16px",
    color: "#000",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 950,
  },
  logout: {
    border: "1px solid rgba(239,68,68,0.32)",
    borderRadius: 999,
    background: "rgba(239,68,68,0.10)",
    color: "#FECACA",
    padding: "11px 16px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 950,
  },
  hero: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 34,
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.075), rgba(255,122,0,0.12))",
    boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
    padding: 22,
    marginBottom: 16,
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(280px, 0.45fr) minmax(0, 1fr)",
    gap: 14,
    alignItems: "stretch",
  },
  card: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 28,
    background: "rgba(0,0,0,0.36)",
    padding: 20,
  },
  eyebrow: {
    margin: 0,
    color: "#FF7A00",
    fontSize: 13,
    fontWeight: 950,
  },
  title: {
    margin: "8px 0 0",
    fontSize: "clamp(38px, 6vw, 70px)",
    lineHeight: 1.06,
    fontWeight: 950,
  },
  orange: {
    color: "#FF7A00",
  },
  muted: {
    color: "rgba(255,255,255,0.60)",
    lineHeight: 1.85,
    fontSize: 14,
  },
  heroStats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
    marginTop: 18,
  },
  stat: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 22,
    background: "rgba(0,0,0,0.28)",
    padding: 14,
  },
  statLabel: {
    margin: 0,
    color: "rgba(255,255,255,0.54)",
    fontSize: 13,
    fontWeight: 850,
  },
  statValue: {
    margin: "9px 0 0",
    fontSize: 28,
    fontWeight: 950,
  },
  roleTag: {
    display: "inline-flex",
    border: "1px solid rgba(255,122,0,0.30)",
    borderRadius: 999,
    background: "rgba(255,122,0,0.10)",
    color: "#FFB56B",
    padding: "7px 11px",
    fontSize: 12,
    fontWeight: 950,
    marginTop: 12,
  },
  mainButton: {
    width: "100%",
    border: 0,
    borderRadius: 18,
    background: "#FF7A00",
    color: "#000",
    padding: "15px 16px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 950,
    marginTop: 14,
    textDecoration: "none",
    display: "block",
    textAlign: "center",
  },
  infoBox: {
    border: "1px solid rgba(255,122,0,0.22)",
    borderRadius: 22,
    background: "rgba(255,122,0,0.08)",
    padding: 14,
    marginTop: 14,
  },
  section: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 30,
    background: "rgba(255,255,255,0.045)",
    padding: 18,
    marginBottom: 16,
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 950,
  },
  quickGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  quickCard: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 24,
    background: "rgba(0,0,0,0.28)",
    color: "white",
    textDecoration: "none",
    padding: 16,
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(260px, 1fr) minmax(180px, 0.36fr) minmax(180px, 0.36fr)",
    gap: 12,
    marginBottom: 14,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 18,
    background: "#070707",
    color: "white",
    padding: "14px 15px",
    outline: "none",
    fontSize: 14,
  },
  select: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 18,
    background: "#070707",
    color: "white",
    padding: "14px 15px",
    outline: "none",
    fontSize: 14,
  },
  secondaryButton: {
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 18,
    background: "rgba(255,255,255,0.06)",
    color: "white",
    padding: "13px 15px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 900,
  },
  restaurantsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 12,
  },
  restaurantCard: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 28,
    background:
      "linear-gradient(135deg, rgba(0,0,0,0.35), rgba(255,122,0,0.06))",
    padding: 16,
  },
  restaurantTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-start",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid",
    borderRadius: 999,
    padding: "7px 11px",
    fontSize: 12,
    fontWeight: 950,
  },
  badgeGreen: {
    borderColor: "rgba(34,197,94,0.42)",
    background: "rgba(34,197,94,0.12)",
    color: "#86EFAC",
  },
  badgeRed: {
    borderColor: "rgba(239,68,68,0.42)",
    background: "rgba(239,68,68,0.12)",
    color: "#FCA5A5",
  },
  badgeOrange: {
    borderColor: "rgba(255,122,0,0.42)",
    background: "rgba(255,122,0,0.12)",
    color: "#FFB56B",
  },
  miniGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
    marginTop: 14,
  },
  miniBox: {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    background: "rgba(255,255,255,0.04)",
    padding: 10,
  },
  menuPreview: {
    borderTop: "1px solid rgba(255,255,255,0.08)",
    marginTop: 14,
    paddingTop: 12,
    display: "grid",
    gap: 8,
  },
  menuRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "center",
    color: "rgba(255,255,255,0.76)",
    fontSize: 13,
  },
  empty: {
    border: "1px dashed rgba(255,255,255,0.16)",
    borderRadius: 24,
    background: "rgba(255,255,255,0.035)",
    padding: 24,
    textAlign: "center",
  },
};

export default function HomePage() {
  const [session, setSession] = useState<FuseSession | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantDoc[]>([]);
  const [menu, setMenu] = useState<MenuDoc[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("الكل");
  const [distanceFilter, setDistanceFilter] = useState("7");
  const [locationText, setLocationText] = useState("لم يتم تحديد موقعك");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    setSession(readSession());

    const unsubscribeRestaurants = onSnapshot(
      query(collection(db, "restaurants")),
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<RestaurantDoc, "documentId">),
          documentId: item.id,
        }));

        setRestaurants(data);
      },
      () => setRestaurants([])
    );

    const unsubscribeMenu = onSnapshot(
      query(collection(db, "menu")),
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<MenuDoc, "documentId">),
          documentId: item.id,
        }));

        setMenu(data);
      },
      () => setMenu([])
    );

    return () => {
      unsubscribeRestaurants();
      unsubscribeMenu();
    };
  }, []);

  const sourceRestaurants = restaurants.length ? restaurants : fallbackRestaurants;
  const role = session?.role || null;
  const links = roleLinks(role);

  const categories = useMemo(() => {
    const set = new Set<string>();

    sourceRestaurants.forEach((item) => {
      if (item.cuisine) set.add(item.cuisine);
    });

    return ["الكل", ...Array.from(set).slice(0, 8)];
  }, [sourceRestaurants]);

  const visibleRestaurants = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();
    const maxDistance = Number(distanceFilter);

    return sourceRestaurants
      .map((restaurant) => ({
        ...restaurant,
        computedDistance: restaurantDistance(restaurant, userLocation),
      }))
      .filter((restaurant) => {
        const name = getRestaurantName(restaurant);
        const haystack = [
          name,
          restaurant.description || "",
          restaurant.cuisine || "",
          restaurant.area || "",
          restaurant.address || "",
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch = !cleanSearch || haystack.includes(cleanSearch);
        const matchesCategory = category === "الكل" || restaurant.cuisine === category;
        const matchesDistance = restaurant.computedDistance <= maxDistance;

        return matchesSearch && matchesCategory && matchesDistance;
      })
      .sort((a, b) => a.computedDistance - b.computedDistance);
  }, [category, distanceFilter, search, sourceRestaurants, userLocation]);

  const openCount = visibleRestaurants.filter(isOpen).length;
  const menuCount = menu.filter(menuAvailable).length;

  function logout() {
    localStorage.removeItem(FUSE_LOCAL_SESSION);

    clearCookie(FUSE_COOKIE_ROLE);
    clearCookie(FUSE_COOKIE_EMAIL);
    clearCookie(FUSE_COOKIE_NAME);
    clearCookie(FUSE_COOKIE_PHONE);
    clearCookie(FUSE_COOKIE_RESTAURANT);

    window.location.href = "/login";
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setLocationText("المتصفح لا يدعم تحديد الموقع");
      return;
    }

    setLocationText("جاري تحديد موقعك...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });

        setLocationText("تم تحديد موقعك");
      },
      () => {
        setLocationText("تعذر تحديد الموقع، نستخدم المسافة التقريبية");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.topBar}>
          <div style={styles.brand}>
            <div style={styles.logo}>F</div>

            <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 950 }}>FUSE Iraq</h1>
              <p style={{ ...styles.muted, margin: "4px 0 0" }}>
                نظام توصيل وتشغيل المطاعم
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {session ? (
              <>
                <button onClick={logout} style={styles.logout}>
                  خروج
                </button>

                <Link href={role ? roleHome[role] : "/login"} style={styles.activePill}>
                  لوحتي
                </Link>
              </>
            ) : (
              <Link href="/login" style={styles.activePill}>
                دخول
              </Link>
            )}
          </div>
        </header>

        <section style={styles.hero}>
          <div style={styles.heroGrid}>
            <aside style={styles.card}>
              <p style={styles.eyebrow}>حسابك</p>

              <h2 style={{ margin: "8px 0 0", fontSize: 32, fontWeight: 950 }}>
                {session ? `FUSE ${role ? roleTitle[role] : ""}` : "زائر FUSE"}
              </h2>

              <p style={styles.muted}>
                {session?.email || "سجل دخولك حتى تشوف قائمتك وتتابع طلباتك بسهولة."}
              </p>

              {role ? <span style={styles.roleTag}>{roleTitle[role]}</span> : null}

              <Link href={session && role ? roleHome[role] : "/login"} style={styles.mainButton}>
                {session ? "دخول لوحتي" : "تسجيل الدخول"}
              </Link>

              <div style={styles.infoBox}>
                <p style={{ margin: 0, color: "#FFB56B", fontWeight: 950 }}>
                  تتبع طلبك بسهولة
                </p>
                <p style={{ ...styles.muted, margin: "8px 0 0" }}>
                  تابع حالة طلبك مباشرة من لحظة الاستلام إلى التوصيل.
                </p>
              </div>
            </aside>

            <section style={styles.card}>
              <p style={styles.eyebrow}>فيوز مباشر</p>

              <h1 style={styles.title}>
                اطلب أسرع
                <br />
                <span style={styles.orange}>من مطاعم قريبة</span>
              </h1>

              <p style={styles.muted}>
                اختر مطعمك، شوف المنيو، اطلب، وتابع التحديثات مباشرة. المطاعم تظهر ضمن نطاق 7 كم.
              </p>

              <div style={styles.heroStats}>
                <div style={styles.stat}>
                  <p style={styles.statLabel}>نطاق التوصيل</p>
                  <p style={styles.statValue}>7 كم</p>
                </div>

                <div style={styles.stat}>
                  <p style={styles.statLabel}>مطاعم ظاهرة</p>
                  <p style={{ ...styles.statValue, color: "#86EFAC" }}>{visibleRestaurants.length}</p>
                </div>

                <div style={styles.stat}>
                  <p style={styles.statLabel}>القائمة</p>
                  <p style={{ ...styles.statValue, color: "#FFB56B" }}>حسب دورك</p>
                </div>
              </div>
            </section>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHead}>
            <div>
              <p style={styles.eyebrow}>القائمة</p>
              <h2 style={styles.sectionTitle}>قائمتي</h2>
            </div>
          </div>

          <div style={styles.quickGrid}>
            {links.map((item) => (
              <Link key={item.href} href={item.href} style={styles.quickCard}>
                <p style={styles.eyebrow}>{item.icon}</p>
                <h3 style={{ margin: "8px 0 0", fontSize: 19, fontWeight: 950 }}>
                  {item.title}
                </h3>
                <p style={{ ...styles.muted, margin: "6px 0 0" }}>{item.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHead}>
            <div>
              <p style={styles.eyebrow}>Restaurants</p>
              <h2 style={styles.sectionTitle}>المطاعم القريبة</h2>
              <p style={{ ...styles.muted, margin: "6px 0 0" }}>
                المفتوحة: {openCount} — أصناف المنيو: {menuCount || "تظهر بعد تحميل البيانات"}
              </p>
            </div>

            <button onClick={detectLocation} style={styles.secondaryButton}>
              تحديد موقعي
            </button>
          </div>

          <div style={styles.filterGrid}>
            <label style={{ display: "grid", gap: 8 }}>
              <span style={styles.statLabel}>بحث سريع</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                style={styles.input}
                placeholder="اسم مطعم، فطور، معجنات، منطقة..."
              />
            </label>

            <label style={{ display: "grid", gap: 8 }}>
              <span style={styles.statLabel}>القسم</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                style={styles.select}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: 8 }}>
              <span style={styles.statLabel}>المسافة</span>
              <select
                value={distanceFilter}
                onChange={(event) => setDistanceFilter(event.target.value)}
                style={styles.select}
              >
                <option value="7">ضمن 7 كم</option>
                <option value="5">ضمن 5 كم</option>
                <option value="3">ضمن 3 كم</option>
              </select>
            </label>
          </div>

          <p style={{ ...styles.muted, marginTop: 0 }}>{locationText}</p>

          {visibleRestaurants.length === 0 ? (
            <div style={styles.empty}>
              <h3 style={{ margin: 0 }}>ماكو مطاعم ضمن الفلتر الحالي</h3>
              <p style={styles.muted}>وسع المسافة أو امسح البحث حتى تظهر المطاعم.</p>
            </div>
          ) : (
            <div style={styles.restaurantsGrid}>
              {visibleRestaurants.map((restaurant) => {
                const restaurantName = getRestaurantName(restaurant);
                const previewMenu = menu
                  .filter((item) => getRestaurantName(item) === restaurantName)
                  .filter(menuAvailable)
                  .slice(0, 3);

                return (
                  <article key={restaurant.documentId} style={styles.restaurantCard}>
                    <div style={styles.restaurantTop}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 24, fontWeight: 950 }}>
                          {restaurantName}
                        </h3>

                        <p style={{ ...styles.muted, margin: "8px 0 0" }}>
                          {getDescription(restaurant)}
                        </p>
                      </div>

                      <span
                        style={{
                          ...styles.badge,
                          ...(isOpen(restaurant) ? styles.badgeGreen : styles.badgeRed),
                        }}
                      >
                        {isOpen(restaurant) ? "مفتوح" : "مغلق"}
                      </span>
                    </div>

                    <div style={styles.miniGrid}>
                      <div style={styles.miniBox}>
                        <p style={styles.statLabel}>المسافة</p>
                        <p style={{ margin: "8px 0 0", fontWeight: 950 }}>
                          {restaurantDistance(restaurant, userLocation).toFixed(1)} كم
                        </p>
                      </div>

                      <div style={styles.miniBox}>
                        <p style={styles.statLabel}>المنطقة</p>
                        <p style={{ margin: "8px 0 0", fontWeight: 950 }}>
                          {restaurant.area || "قريب"}
                        </p>
                      </div>

                      <div style={styles.miniBox}>
                        <p style={styles.statLabel}>النوع</p>
                        <p style={{ margin: "8px 0 0", fontWeight: 950 }}>
                          {restaurant.cuisine || "مطعم"}
                        </p>
                      </div>
                    </div>

                    <div style={styles.menuPreview}>
                      {previewMenu.length === 0 ? (
                        <p style={{ ...styles.muted, margin: 0 }}>
                          المنيو يظهر بالخطوة الجاية داخل صفحة المطعم.
                        </p>
                      ) : (
                        previewMenu.map((item) => (
                          <div key={item.documentId} style={styles.menuRow}>
                            <span>{item.name || item.title || "صنف"}</span>
                            <strong>{Number(item.price || 0).toLocaleString()} د.ع</strong>
                          </div>
                        ))
                      )}
                    </div>

                    <Link
                      href={`/restaurants/${restaurantSlug(restaurantName)}`}
                      style={styles.mainButton}
                    >
                      افتح المنيو واطلب من {restaurantName}
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
