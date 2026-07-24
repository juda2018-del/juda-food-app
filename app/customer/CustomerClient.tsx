 "use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { firebaseAuth } from "@/lib/firebase/client";
import { performFuseLogout } from "@/lib/fuse-logout";
import {
  FUSE_COOKIE_EMAIL,
  FUSE_COOKIE_NAME,
  FUSE_COOKIE_PHONE,
  FUSE_COOKIE_RESTAURANT,
  FUSE_COOKIE_ROLE,
  FUSE_LOCAL_SESSION,
  type FuseSession,
} from "@/lib/fuse-auth";

type CustomerStatus = "checking" | "allowed" | "blocked";

type RestaurantCard = {
  name: string;
  slug: string;
  category: string;
  image: string;
  rating: string;
  time: string;
  delivery: string;
  offer: string;
};

function clean(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function roleFromEmail(email: string) {
  const e = clean(email);

  if (e === "admin@fuse.iq") return "admin";
  if (e === "restaurant@fuse.iq") return "restaurant";
  if (e === "driver@fuse.iq") return "driver";
  if (e === "customer@fuse.iq") return "customer";

  return "unknown";
}

function targetForRole(role: string) {
  if (role === "admin") return "/fuse-admin";
  if (role === "restaurant") return "/restaurant-admin";
  if (role === "driver") return "/driver?fuseRole=driver&fuseEmail=driver%40fuse.iq";
  if (role === "customer") return "/customer?fuseRole=customer&fuseEmail=customer%40fuse.iq";

  return "/login?next=/customer";
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=2592000; SameSite=Lax`;
}

function clearCustomerCookies() {
  const cookies = [
    FUSE_COOKIE_ROLE,
    FUSE_COOKIE_EMAIL,
    FUSE_COOKIE_NAME,
    FUSE_COOKIE_PHONE,
    FUSE_COOKIE_RESTAURANT,
  ];

  for (const name of cookies) {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  }
}

function writeCustomerSession(email: string) {
  const session: FuseSession & Record<string, unknown> = {
    role: "customer",
    fuseRole: "customer",
    email,
    fuseEmail: email,
    uid: "fuse-customer",
    name: "FUSE Customer",
    displayName: "FUSE Customer",
    customerId: "customer-demo",
    restaurant: "",
    restaurantId: "",
    restaurantName: "",
    createdAt: Date.now(),
    source: "customer-page",
  };

  try {
    const serialized = JSON.stringify(session);

    localStorage.setItem(FUSE_LOCAL_SESSION, serialized);
    localStorage.setItem("FUSE_LOCAL_SESSION", serialized);
    localStorage.setItem("fuseRole", "customer");
    localStorage.setItem("fuseEmail", email);
    localStorage.setItem("fuseUser", serialized);

    setCookie(FUSE_COOKIE_ROLE, "customer");
    setCookie(FUSE_COOKIE_EMAIL, email);
    setCookie(FUSE_COOKIE_NAME, "FUSE Customer");
    setCookie(FUSE_COOKIE_PHONE, "");
    setCookie(FUSE_COOKIE_RESTAURANT, "");
  } catch (error) {
    console.error("Customer session write failed", error);
  }
}

const restaurants: RestaurantCard[] = [
  {
    name: "فيروز",
    slug: "fayrouz",
    category: "فطور عراقي",
    image: "/images/fayrouz.jpg",
    rating: "4.8",
    time: "25-35 د",
    delivery: "1,500 د.ع",
    offer: "خصم 20%",
  },
  {
    name: "شلتتة",
    slug: "shalteta",
    category: "مشلتت وفطائر",
    image: "/images/shalteta.jpg",
    rating: "4.7",
    time: "30-40 د",
    delivery: "2,000 د.ع",
    offer: "توصيل سريع",
  },
  {
    name: "خان قدوري",
    slug: "khan",
    category: "أكلات عراقية",
    image: "/images/khan.jpg",
    rating: "4.6",
    time: "35-45 د",
    delivery: "2,500 د.ع",
    offer: "وجبات يومية",
  },
];

const categories = ["الكل", "فطور", "مشاوي", "بركر", "بيتزا", "مشروبات"];

function Icon({ name }: { name: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-4-4" />
      </svg>
    );
  }

  if (name === "pin") {
    return (
      <svg {...common}>
        <path d="M12 21s7-5.4 7-12a7 7 0 10-14 0c0 6.6 7 12 7 12z" />
        <circle cx="12" cy="9" r="2.4" />
      </svg>
    );
  }

  if (name === "bell") {
    return (
      <svg {...common}>
        <path d="M18 9a6 6 0 10-12 0c0 7-2 7-2 9h16c0-2-2-2-2-9z" />
        <path d="M10 21h4" />
      </svg>
    );
  }

  if (name === "star") {
    return (
      <svg {...common}>
        <path d="M12 3l2.7 5.4 6 .9-4.4 4.3 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.3 6-.9L12 3z" />
      </svg>
    );
  }

  if (name === "clock") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </svg>
    );
  }

  if (name === "home") {
    return (
      <svg {...common}>
        <path d="M4 11.5L12 5l8 6.5" />
        <path d="M6.5 10.5V19h11v-8.5" />
      </svg>
    );
  }


  if (name === "reels") {
    return (
      <svg {...common}>
        <rect x="5" y="4" width="14" height="16" rx="3" />
        <path d="M9 4l2 5" />
        <path d="M14 4l2 5" />
        <path d="M5 9h14" />
        <path d="M10 13l5 3-5 3v-6z" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (name === "cart") {
    return (
      <svg {...common}>
        <path d="M4 6h2l1.5 8h8l2-6H8" />
        <circle cx="10" cy="18" r="1.4" />
        <circle cx="16" cy="18" r="1.4" />
      </svg>
    );
  }

  if (name === "orders") {
    return (
      <svg {...common}>
        <rect x="6" y="4" width="12" height="16" rx="2" />
        <path d="M9 9h6" />
        <path d="M9 13h6" />
      </svg>
    );
  }

  if (name === "user") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 19c2-3 4-4.5 7-4.5s5 1.5 7 4.5" />
      </svg>
    );
  }

  if (name === "logout") {
    return (
      <svg {...common}>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 5v14" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

function FuseLogo() {
  return (
    <div className="fuse-logo" aria-label="FUSE">
      <span />
      <span />
      <span />
    </div>
  );
}

function GuardScreen({
  title,
  message,
  blocked,
  onBack,
  onLogout,
}: {
  title: string;
  message: string;
  blocked?: boolean;
  onBack?: () => void;
  onLogout?: () => Promise<void>;
}) {
  return (
    <main dir="rtl" className="guard-page">
      <section className="guard-card">
        <div className="guard-logo">
          <FuseLogo />
        </div>

        <p>FUSE Customer Guard</p>
        <h1>{title}</h1>
        <small>{message}</small>

        {blocked ? (
          <div className="guard-actions">
            <button type="button" onClick={onBack}>
              رجوع للوحة الحساب الحالي
            </button>
            <button type="button" className="danger" onClick={onLogout}>
              تسجيل خروج والدخول بحساب الزبون
            </button>
          </div>
        ) : (
          <div className="loader">
            <span />
          </div>
        )}
      </section>

      <style jsx>{`
        .guard-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle at top right, rgba(255, 122, 0, 0.22), transparent 36%),
            radial-gradient(circle at bottom left, rgba(255, 61, 0, 0.12), transparent 35%),
            #050505;
          color: #fff;
          padding: 24px;
          font-family: Cairo, system-ui, sans-serif;
        }

        .guard-card {
          width: min(560px, 100%);
          border: 1px solid rgba(255, 122, 0, 0.28);
          background: linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
          border-radius: 32px;
          padding: 34px;
          text-align: center;
          box-shadow: 0 34px 90px rgba(0,0,0,0.45);
        }

        .guard-logo {
          width: 76px;
          height: 76px;
          margin: 0 auto 18px;
          border-radius: 26px;
          display: grid;
          place-items: center;
          background: #101010;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12);
        }

        .guard-card p {
          margin: 0;
          color: #ff7a00;
          font-weight: 950;
        }

        .guard-card h1 {
          margin: 12px 0 10px;
          font-size: clamp(28px, 5vw, 42px);
          line-height: 1.15;
          font-weight: 950;
        }

        .guard-card small {
          display: block;
          color: rgba(255,255,255,0.68);
          line-height: 1.9;
          font-size: 15px;
        }

        .guard-actions {
          display: grid;
          gap: 12px;
          margin-top: 24px;
        }

        .guard-actions button {
          border: 0;
          border-radius: 18px;
          padding: 15px 18px;
          background: linear-gradient(135deg, #ff8a00, #ff3d00);
          color: #101010;
          font-weight: 950;
          cursor: pointer;
        }

        .guard-actions button.danger {
          border: 1px solid rgba(255, 120, 120, 0.34);
          background: rgba(255, 0, 0, 0.12);
          color: #ffb6b6;
        }

        .loader {
          width: 100%;
          height: 9px;
          overflow: hidden;
          border-radius: 999px;
          margin-top: 24px;
          background: rgba(255,255,255,0.08);
        }

        .loader span {
          display: block;
          width: 38%;
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #ff8a00, #ff3d00);
          animation: move 1.15s infinite ease-in-out;
        }

        @keyframes move {
          0% { transform: translateX(180%); }
          100% { transform: translateX(-270%); }
        }

        .fuse-logo {
          width: 36px;
          height: 32px;
          position: relative;
        }

        .fuse-logo span {
          position: absolute;
          display: block;
          background: linear-gradient(135deg, #ff8a00, #ff3d00);
        }

        .fuse-logo span:nth-child(1) {
          width: 35px;
          height: 11px;
          top: 0;
          right: 0;
          border-radius: 20px 20px 16px 4px;
          transform: skewX(-18deg);
        }

        .fuse-logo span:nth-child(2) {
          width: 28px;
          height: 10px;
          top: 13px;
          right: 6px;
          border-radius: 18px 16px 16px 4px;
          transform: skewX(-18deg);
        }

        .fuse-logo span:nth-child(3) {
          width: 12px;
          height: 22px;
          top: 9px;
          right: 21px;
          border-radius: 16px 4px 16px 16px;
          transform: skewX(-18deg);
        }
      `}</style>
    </main>
  );
}

export default function CustomerClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<CustomerStatus>("checking");
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("جاري فحص حساب الزبون...");
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [queryText, setQueryText] = useState("");

  const urlEmail = useMemo(() => clean(searchParams.get("fuseEmail")), [searchParams]);

  const visibleRestaurants = useMemo(() => {
    const q = clean(queryText);

    return restaurants.filter((restaurant) => {
      const matchesCategory =
        activeCategory === "الكل" || restaurant.category.includes(activeCategory);

      const matchesSearch =
        !q ||
        clean(restaurant.name).includes(q) ||
        clean(restaurant.category).includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, queryText]);

  async function handleSignOut() {
    clearCustomerCookies();
    await performFuseLogout("/customer");
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      const email = clean(nextUser?.email || urlEmail);
      const role = roleFromEmail(email);

      setUser(nextUser);

      if (!nextUser?.email) {
        setStatus("checking");
        setMessage("ماكو حساب داخل. جاري تحويلك إلى دخول الزبون...");
        router.replace("/login?next=/customer");
        return;
      }

      if (role !== "customer") {
        setStatus("blocked");
        setMessage(`الحساب الحالي ${email} مو حساب زبون.`);
        return;
      }

      writeCustomerSession(email);
      setStatus("allowed");
      setMessage("تم تثبيت جلسة الزبون بنجاح.");
    });

    return () => unsubscribe();
  }, [router, urlEmail]);

  if (status === "checking") {
    return <GuardScreen title="جاري فتح صفحة الزبون..." message={message} />;
  }

  if (status === "blocked") {
    const currentEmail = clean(user?.email);
    const currentRole = roleFromEmail(currentEmail);

    return (
      <GuardScreen
        title="هذا الحساب مو زبون"
        message={`الحساب الحالي: ${currentEmail || "غير معروف"}`}
        blocked
        onBack={() => router.replace(targetForRole(currentRole))}
        onLogout={handleSignOut}
      />
    );
  }

  return (
    <main dir="rtl" className="customer-shell">
      <section className="app-frame">
        <header className="customer-header">
          <div className="brand">
            <div className="brand-mark">
              <FuseLogo />
            </div>
            <div>
              <b>FUSE</b>
              <span>Delivery App</span>
            </div>
          </div>

          <div className="header-actions">
            <button type="button" className="circle-btn" aria-label="الإشعارات">
              <Icon name="bell" />
            </button>

            <button type="button" onClick={handleSignOut} className="logout-btn">
              <Icon name="logout" />
              <span>خروج</span>
            </button>
          </div>
        </header>

        <section className="location-row">
          <div>
            <span>التوصيل إلى</span>
            <b>
              <Icon name="pin" />
              بغداد - زيونة
            </b>
          </div>

          <button type="button">تغيير</button>
        </section>

        <section className="hero-card">
          <div className="hero-copy">
            <span>أسرع طلب داخل FUSE</span>
            <h1>
              اطلب أكلك
              <br />
              <em>بدون زحمة</em>
            </h1>
            <p>
              مطاعم قريبة، تتبع مباشر، وعروض يومية بتجربة حديثة تنافس تطبيقات
              التوصيل العالمية.
            </p>

            <div className="hero-actions">
              <Link href="/restaurants/fayrouz">ابدأ الطلب</Link>
              <Link href="/order-status" className="ghost">
                تتبع طلب
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="plate one">
              <img src="/images/fayrouz.jpg" alt="فيروز" />
            </div>
            <div className="plate two">
              <img src="/images/shalteta.jpg" alt="شلتتة" />
            </div>
            <div className="delivery-chip">
              <Icon name="clock" />
              <b>30 د</b>
            </div>
          </div>
        </section>

        <section className="search-card">
          <Icon name="search" />
          <input
            value={queryText}
            onChange={(event) => setQueryText(event.target.value)}
            placeholder="دور على مطعم، فطور، مشاوي..."
          />
        </section>

        <section className="category-strip">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setActiveCategory(item)}
              className={activeCategory === item ? "active" : ""}
            >
              {item}
            </button>
          ))}
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <span>مطاعم متاحة</span>
            <b>24</b>
            <small>داخل نطاقك</small>
          </article>

          <article className="stat-card">
            <span>طلبات نشطة</span>
            <b>0</b>
            <small>جاهز لأول طلب</small>
          </article>

          <article className="stat-card">
            <span>خصومات</span>
            <b>50%</b>
            <small>على أول طلب</small>
          </article>

          <article className="stat-card">
            <span>نقاط الولاء</span>
            <b>0</b>
            <small>تبدأ من اليوم</small>
          </article>
        </section>

        <section className="promo-row">
          <article className="promo-card orange">
            <span>كود اليوم</span>
            <b>FUSE50</b>
            <small>خصم أول طلب للزبائن الجدد</small>
          </article>

          <article className="promo-card dark">
            <span>Fast Lane</span>
            <b>أولوية التوصيل</b>
            <small>قريباً للطلبات السريعة</small>
          </article>
        </section>

        <section className="section-title">
          <div>
            <span>قريبة منك</span>
            <h2>مطاعم مختارة</h2>
          </div>

          <Link href="/">عرض الكل</Link>
        </section>

        <section className="restaurant-grid">
          {visibleRestaurants.map((restaurant) => (
            <Link
              key={restaurant.slug}
              href={`/restaurants/${restaurant.slug}`}
              className="restaurant-card"
            >
              <div className="restaurant-image">
                <img src={restaurant.image} alt={restaurant.name} />
                <span>{restaurant.offer}</span>
              </div>

              <div className="restaurant-info">
                <div className="restaurant-top">
                  <h3>{restaurant.name}</h3>
                  <b>
                    <Icon name="star" />
                    {restaurant.rating}
                  </b>
                </div>

                <p>{restaurant.category}</p>

                <div className="restaurant-meta">
                  <span>
                    <Icon name="clock" />
                    {restaurant.time}
                  </span>
                  <span>{restaurant.delivery}</span>
                </div>
              </div>
            </Link>
          ))}
        </section>

        <section className="tracking-panel">
          <div className="tracking-head">
            <div>
              <span>آخر حالة</span>
              <h2>لا يوجد طلب نشط</h2>
            </div>

            <Link href="/order-status">طلباتي</Link>
          </div>

          <div className="timeline">
            <div className="step active">
              <span />
              <b>اختيار المطعم</b>
              <small>ابدأ من القائمة</small>
            </div>

            <div className="step">
              <span />
              <b>تأكيد الطلب</b>
              <small>السلة والدفع</small>
            </div>

            <div className="step">
              <span />
              <b>التوصيل</b>
              <small>تتبع مباشر</small>
            </div>
          </div>
        </section>

        <section className="account-card">
          <div>
            <span>الحساب الحالي</span>
            <b dir="ltr">{user?.email}</b>
          </div>

          <Link href="/profile">الملف الشخصي</Link>
        </section>

        <nav className="bottom-nav">
          <Link href="/customer" className="active">
            <Icon name="home" />
            <b>الرئيسية</b>
          </Link>

          <Link href="/">
            <Icon name="search" />
            <b>استكشف</b>
          </Link>

          <Link href="/reels">
            <Icon name="reels" />
            <b>ريلز</b>
          </Link>

          <Link href="/cart">
            <Icon name="cart" />
            <b>السلة</b>
          </Link>

          <Link href="/order-status">
            <Icon name="orders" />
            <b>طلباتي</b>
          </Link>

        </nav>
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

        .customer-shell {
          min-height: 100vh;
          padding: 28px;
          color: #ffffff;
          font-family: Cairo, system-ui, sans-serif;
          background:
            radial-gradient(circle at top right, rgba(255, 122, 0, 0.22), transparent 36%),
            radial-gradient(circle at bottom left, rgba(255, 61, 0, 0.12), transparent 34%),
            linear-gradient(180deg, #050505 0%, #0b0b0c 100%);
        }

        .app-frame {
          width: min(1180px, 100%);
          margin: 0 auto;
          padding-bottom: 96px;
        }

        .customer-header,
        .location-row,
        .hero-card,
        .search-card,
        .stat-card,
        .promo-card,
        .restaurant-card,
        .tracking-panel,
        .account-card,
        .bottom-nav {
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.055);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.24);
          backdrop-filter: blur(20px);
        }

        .customer-header {
          position: sticky;
          top: 16px;
          z-index: 20;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          border-radius: 28px;
          padding: 14px;
          margin-bottom: 16px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-mark {
          width: 54px;
          height: 54px;
          border-radius: 19px;
          display: grid;
          place-items: center;
          background: #111;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1);
        }

        .brand b {
          display: block;
          font-size: 24px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: 0.5px;
        }

        .brand span {
          display: block;
          margin-top: 4px;
          color: rgba(255,255,255,0.58);
          font-size: 12px;
          font-weight: 800;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .circle-btn,
        .logout-btn {
          border: 0;
          color: #fff;
          cursor: pointer;
          font-family: inherit;
        }

        .circle-btn {
          width: 50px;
          height: 50px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          background: rgba(255,255,255,0.08);
        }

        .logout-btn {
          min-height: 50px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 18px;
          padding: 0 16px;
          background: rgba(255, 122, 0, 0.14);
          color: #ff9a31;
          font-weight: 950;
        }

        .location-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          border-radius: 24px;
          padding: 16px 18px;
          margin-bottom: 18px;
        }

        .location-row span {
          display: block;
          color: rgba(255,255,255,0.54);
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .location-row b {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 18px;
          font-weight: 950;
        }

        .location-row b svg {
          color: #ff7a00;
        }

        .location-row button {
          border: 0;
          border-radius: 999px;
          padding: 10px 16px;
          background: #ff7a00;
          color: #101010;
          font-weight: 950;
          cursor: pointer;
        }

        .hero-card {
          position: relative;
          overflow: hidden;
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
          gap: 24px;
          min-height: 360px;
          border-radius: 38px;
          padding: 34px;
          background:
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.16), transparent 22%),
            linear-gradient(135deg, rgba(255, 122, 0, 0.28), rgba(255,255,255,0.055));
          margin-bottom: 18px;
        }

        .hero-copy {
          position: relative;
          z-index: 2;
          align-self: center;
        }

        .hero-copy > span {
          display: inline-flex;
          border-radius: 999px;
          padding: 9px 14px;
          background: rgba(255, 122, 0, 0.16);
          color: #ff9a31;
          font-weight: 950;
          font-size: 13px;
        }

        .hero-copy h1 {
          margin: 18px 0 14px;
          font-size: clamp(48px, 7vw, 92px);
          line-height: 0.96;
          letter-spacing: -2px;
          font-weight: 950;
        }

        .hero-copy h1 em {
          color: #ff7a00;
          font-style: normal;
        }

        .hero-copy p {
          max-width: 620px;
          margin: 0 0 24px;
          color: rgba(255,255,255,0.68);
          line-height: 1.9;
          font-size: 17px;
          font-weight: 700;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .hero-actions a {
          min-height: 54px;
          border-radius: 999px;
          display: inline-grid;
          place-items: center;
          padding: 0 24px;
          background: linear-gradient(135deg, #ff8a00, #ff3d00);
          color: #101010;
          text-decoration: none;
          font-weight: 950;
        }

        .hero-actions a.ghost {
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.07);
          color: #fff;
        }

        .hero-visual {
          position: relative;
          min-height: 290px;
        }

        .plate {
          position: absolute;
          overflow: hidden;
          border-radius: 50%;
          border: 7px solid rgba(255,255,255,0.16);
          box-shadow: 0 30px 90px rgba(0,0,0,0.35);
        }

        .plate img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .plate.one {
          width: 255px;
          height: 255px;
          top: 8px;
          left: 40px;
        }

        .plate.two {
          width: 170px;
          height: 170px;
          right: 0;
          bottom: 8px;
        }

        .delivery-chip {
          position: absolute;
          right: 22px;
          top: 28px;
          min-width: 114px;
          border-radius: 20px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: rgba(5,5,5,0.76);
          color: #ff9a31;
          border: 1px solid rgba(255,255,255,0.12);
          font-weight: 950;
        }

        .search-card {
          min-height: 66px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-radius: 24px;
          padding: 0 18px;
          margin-bottom: 14px;
        }

        .search-card svg {
          color: #ff7a00;
          flex: 0 0 auto;
        }

        .search-card input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #fff;
          font-family: inherit;
          font-size: 16px;
          font-weight: 800;
        }

        .search-card input::placeholder {
          color: rgba(255,255,255,0.38);
        }

        .category-strip {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 2px 0 20px;
          scrollbar-width: none;
        }

        .category-strip::-webkit-scrollbar {
          display: none;
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
          border-color: transparent;
          background: #ff7a00;
          color: #101010;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .stat-card {
          border-radius: 26px;
          padding: 22px;
          min-height: 142px;
        }

        .stat-card span {
          display: block;
          color: rgba(255,255,255,0.56);
          font-size: 13px;
          font-weight: 950;
        }

        .stat-card b {
          display: block;
          margin: 10px 0 6px;
          color: #ff7a00;
          font-size: 38px;
          line-height: 1;
          font-weight: 950;
        }

        .stat-card small {
          color: rgba(255,255,255,0.5);
          font-size: 12px;
          font-weight: 700;
        }

        .promo-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 22px;
        }

        .promo-card {
          border-radius: 28px;
          padding: 24px;
          min-height: 145px;
        }

        .promo-card span {
          display: block;
          color: rgba(255,255,255,0.64);
          font-weight: 950;
          margin-bottom: 10px;
        }

        .promo-card b {
          display: block;
          font-size: 34px;
          line-height: 1.05;
          font-weight: 950;
        }

        .promo-card small {
          display: block;
          margin-top: 10px;
          color: rgba(255,255,255,0.64);
          line-height: 1.6;
          font-weight: 700;
        }

        .promo-card.orange {
          background: linear-gradient(135deg, #ff8a00, #ff3d00);
          color: #101010;
        }

        .promo-card.orange span,
        .promo-card.orange small {
          color: rgba(16,16,16,0.7);
        }

        .promo-card.dark {
          background:
            radial-gradient(circle at top right, rgba(255,122,0,0.16), transparent 34%),
            rgba(255,255,255,0.055);
        }

        .section-title {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 14px;
          margin: 10px 0 14px;
        }

        .section-title span {
          display: block;
          color: #ff7a00;
          font-size: 12px;
          font-weight: 950;
          margin-bottom: 4px;
        }

        .section-title h2 {
          margin: 0;
          font-size: 34px;
          line-height: 1.1;
          font-weight: 950;
        }

        .section-title a {
          color: #ff9a31;
          text-decoration: none;
          font-weight: 950;
        }

        .restaurant-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .restaurant-card {
          overflow: hidden;
          border-radius: 30px;
          color: #fff;
          text-decoration: none;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .restaurant-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255,122,0,0.42);
        }

        .restaurant-image {
          position: relative;
          height: 190px;
          background: #111;
        }

        .restaurant-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .restaurant-image::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 35%, rgba(0,0,0,0.64));
        }

        .restaurant-image span {
          position: absolute;
          z-index: 2;
          top: 14px;
          right: 14px;
          border-radius: 999px;
          padding: 8px 11px;
          background: rgba(5,5,5,0.76);
          color: #ff9a31;
          font-size: 12px;
          font-weight: 950;
        }

        .restaurant-info {
          padding: 18px;
        }

        .restaurant-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
        }

        .restaurant-top h3 {
          margin: 0;
          font-size: 25px;
          line-height: 1.1;
          font-weight: 950;
        }

        .restaurant-top b {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #ff9a31;
          font-size: 14px;
          font-weight: 950;
        }

        .restaurant-top b svg {
          width: 16px;
          height: 16px;
        }

        .restaurant-info p {
          margin: 8px 0 16px;
          color: rgba(255,255,255,0.58);
          font-weight: 800;
        }

        .restaurant-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .restaurant-meta span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 8px 10px;
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.76);
          font-size: 12px;
          font-weight: 950;
        }

        .restaurant-meta svg {
          width: 15px;
          height: 15px;
          color: #ff7a00;
        }

        .tracking-panel {
          border-radius: 30px;
          padding: 24px;
          margin-bottom: 16px;
        }

        .tracking-head {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 12px;
          margin-bottom: 20px;
        }

        .tracking-head span {
          color: #ff7a00;
          font-weight: 950;
          font-size: 12px;
        }

        .tracking-head h2 {
          margin: 4px 0 0;
          font-size: 28px;
          font-weight: 950;
        }

        .tracking-head a {
          color: #ff9a31;
          text-decoration: none;
          font-weight: 950;
        }

        .timeline {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .step {
          position: relative;
          border-radius: 22px;
          padding: 18px;
          background: rgba(0,0,0,0.28);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .step > span {
          width: 13px;
          height: 13px;
          border-radius: 999px;
          display: block;
          background: rgba(255,255,255,0.22);
          margin-bottom: 14px;
        }

        .step.active > span {
          background: #ff7a00;
          box-shadow: 0 0 0 8px rgba(255,122,0,0.12);
        }

        .step b {
          display: block;
          font-weight: 950;
          margin-bottom: 6px;
        }

        .step small {
          color: rgba(255,255,255,0.5);
          font-weight: 700;
        }

        .account-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          border-radius: 26px;
          padding: 20px;
        }

        .account-card span {
          display: block;
          color: rgba(255,255,255,0.52);
          font-size: 12px;
          font-weight: 950;
          margin-bottom: 6px;
        }

        .account-card b {
          display: block;
          font-size: 15px;
        }

        .account-card a {
          border-radius: 999px;
          padding: 12px 16px;
          background: rgba(255,122,0,0.14);
          color: #ff9a31;
          text-decoration: none;
          font-weight: 950;
          white-space: nowrap;
        }

        .bottom-nav {
          position: fixed;
          z-index: 30;
          left: 50%;
          bottom: 18px;
          width: min(430px, calc(100% - 28px));
          transform: translateX(-50%);
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 4px;
          border: 1px solid rgba(255,255,255,0.24);
          border-radius: 999px;
          padding: 6px 10px;
          background: rgba(255,248,237,0.76);
          backdrop-filter: blur(22px) saturate(145%);
          -webkit-backdrop-filter: blur(22px) saturate(145%);
          box-shadow: 0 14px 40px rgba(0,0,0,0.24);
        }

        .bottom-nav a {
          width: 52px;
          height: 52px;
          min-height: 52px;
          margin: auto;
          border-radius: 50%;
          display: grid;
          justify-items: center;
          align-content: center;
          color: #0b1220;
          text-decoration: none;
        }

        .bottom-nav a.active {
          background: rgba(255,255,255,0.78);
          color: #0b1220;
          box-shadow: 0 8px 22px rgba(0,0,0,0.14);
        }

        .bottom-nav b {
          display: none;
        }

        .bottom-nav svg {
          width: 27px;
          height: 27px;
        }

        .fuse-logo {
          width: 32px;
          height: 29px;
          position: relative;
        }

        .fuse-logo span {
          position: absolute;
          display: block;
          background: linear-gradient(135deg, #ff8a00, #ff3d00);
        }

        .fuse-logo span:nth-child(1) {
          width: 31px;
          height: 10px;
          top: 0;
          right: 0;
          border-radius: 18px 18px 14px 4px;
          transform: skewX(-18deg);
        }

        .fuse-logo span:nth-child(2) {
          width: 25px;
          height: 9px;
          top: 12px;
          right: 5px;
          border-radius: 16px 14px 14px 4px;
          transform: skewX(-18deg);
        }

        .fuse-logo span:nth-child(3) {
          width: 11px;
          height: 20px;
          top: 8px;
          right: 18px;
          border-radius: 14px 4px 14px 14px;
          transform: skewX(-18deg);
        }

        @media (max-width: 980px) {
          .stats-grid,
          .restaurant-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .hero-card {
            grid-template-columns: 1fr;
          }

          .hero-visual {
            min-height: 250px;
          }
        }

        @media (max-width: 640px) {
          .customer-shell {
            padding: 0;
          }

          .app-frame {
            width: 100%;
            padding: 14px 14px 96px;
          }

          .customer-header {
            top: 8px;
            border-radius: 24px;
          }

          .logout-btn span {
            display: none;
          }

          .hero-card {
            min-height: auto;
            border-radius: 32px;
            padding: 24px;
          }

          .hero-copy h1 {
            letter-spacing: -1px;
          }

          .hero-visual {
            display: none;
          }

          .stats-grid,
          .promo-row,
          .restaurant-grid,
          .timeline {
            grid-template-columns: 1fr;
          }

          .restaurant-image {
            height: 220px;
          }

          .account-card {
            align-items: start;
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}