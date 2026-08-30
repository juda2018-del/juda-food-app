"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { firebaseAuth } from "@/lib/firebase/client";
import { db } from "../firebase";
import { performFuseLogout } from "@/lib/fuse-logout";
import FuseIcon, { type FuseIconName } from "@/components/FuseIcon";
import { parseFuseRole, roleHome, type FuseRole } from "@/lib/fuse-auth";

type Profile = {
  name?: string;
  displayName?: string;
  phone?: string;
  address?: string;
  photoURL?: string;
  role?: string;
  fuseRole?: string;
};
const LOAD_TIMEOUT_MS = 3500;

async function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => window.setTimeout(() => resolve(fallback), LOAD_TIMEOUT_MS)),
  ]);
}

const menu: Array<[FuseIconName, string, string, string]> = [
  ["orders", "طلباتي", "تابع الطلبات الحالية والسابقة", "/order-status"],
  ["heart", "المفضلة", "مطاعمك ووجباتك المحفوظة", "/favorites"],
  ["map-pin", "عناوين التوصيل", "إدارة عناوينك المحفوظة", "/addresses"],
  ["gift", "العروض", "الخصومات المتاحة داخل FUSE", "/offers"],
  ["truck", "انضم كسائق", "قدّم طلب انضمام لفريق التوصيل", "/driver-register"],
  ["store", "سجّل مطعمك", "أضف مطعمك إلى منصة FUSE", "/restaurant-register"],
  ["help", "المساعدة والدعم", "تواصل ويا فريق FUSE", "/support"],
  ["info", "حول FUSE", "تعرف على التطبيق والخدمات", "/about"],
];

async function readProfile(uid: string) {
  for (const name of ["users", "profiles", "accounts"]) {
    try {
      const snap = await getDoc(doc(db, name, uid));
      if (snap.exists()) return snap.data() as Profile;
    } catch {
      // Try the next compatible profile collection.
    }
  }
  return null;
}

function roleFrom(user: User, profile: Profile | null, claimRole: unknown): FuseRole | null {
  return parseFuseRole(claimRole || profile?.role || profile?.fuseRole);
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let disposed = false;
    let receivedAuthState = false;
    const watchdog = window.setTimeout(() => {
      if (disposed || receivedAuthState) return;
      setLoadError("تعذر تحميل جلسة الحساب. تقدر تدخل من جديد أو تعيد المحاولة.");
      setLoading(false);
    }, LOAD_TIMEOUT_MS);

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      receivedAuthState = true;
      window.clearTimeout(watchdog);
      if (!currentUser) {
        if (disposed) return;
        setUser(null);
        setProfile(null);
        setLoadError("سجّل الدخول حتى تظهر معلومات حسابك وطلباتك.");
        setLoading(false);
        return;
      }

      try {
        const [savedProfile, token] = await withTimeout(Promise.all([
          readProfile(currentUser.uid),
          currentUser.getIdTokenResult(),
        ]), [
          null,
          null,
        ]);
        if (!token) setLoadError("الاتصال بطيء؛ عرضنا معلومات الحساب الأساسية.");
        const role = roleFrom(currentUser, savedProfile, token?.claims.role || token?.claims.fuseRole);
        if (role && role !== "customer") {
          window.location.replace(roleHome[role]);
          return;
        }
        if (disposed) return;
        setUser(currentUser);
        setProfile(savedProfile);
      } catch {
        if (disposed) return;
        setUser(currentUser);
        setLoadError("تعذر تحميل بعض معلومات الحساب؛ عرضنا المعلومات الأساسية.");
      } finally {
        if (!disposed) setLoading(false);
      }
    });
    return () => {
      disposed = true;
      window.clearTimeout(watchdog);
      unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await performFuseLogout("/");
  }

  const name = profile?.name || profile?.displayName || user?.displayName || "زبون FUSE";
  const email = user?.email || "";
  const phone = profile?.phone || user?.phoneNumber || "رقم الهاتف غير مضاف";
  const address = profile?.address || "العنوان غير مضاف";
  const initial = name.trim().slice(0, 1).toUpperCase() || "F";

  return (
    <main className="profile-shell" dir="rtl">
      <header className="top customer-header profile-header">
        <Link className="icon-btn" href="/notification-center" aria-label="الإشعارات"><FuseIcon name="bell" /></Link>
        <span className="brand">حسابي</span>
        <Link className="icon-btn" href="/settings" aria-label="الإعدادات"><FuseIcon name="settings" /></Link>
      </header>

      <section className="profile-card">
        <div className="user">
          <div className="avatar">{initial}</div>
          <div>
            <h1>{name}</h1>
            <p dir="ltr">{email}</p>
            <p>{phone}</p>
          </div>
        </div>
        <Link className="edit" href="/settings">تعديل</Link>
      </section>
      {loading ? <p className="load-warning loading-inline"><span className="spinner" />جاري تحديث معلومات حسابك…</p> : null}
      {loadError ? <p className="load-warning">{loadError}</p> : null}
      {!user ? (
        <section className="session-actions">
          <Link href="/login?next=/profile">تسجيل الدخول</Link>
          <button type="button" onClick={() => window.location.reload()}>إعادة المحاولة</button>
        </section>
      ) : null}

      <section className="notice">
        <h2>متابعة الطلبات بحسابك</h2>
        <p>طلباتك تظهر تلقائياً بعد تسجيل الدخول، وما تحتاج تبحث برقم الهاتف.</p>
        <small className="notice-pin"><FuseIcon name="map-pin" size="sm" /> {address}</small>
        <Link href="/order-status">عرض الطلبات</Link>
      </section>

      <h2 className="section-title">الخدمات</h2>
      <section className="menu">
        {menu.map(([icon, title, desc, href]) => (
          <Link key={title} href={href} className="item">
            <div className="item-main"><div className="emoji"><FuseIcon name={icon} /></div><div><h3>{title}</h3><p>{desc}</p></div></div>
            <span className="arrow"><FuseIcon name="chevron-forward" size="sm" /></span>
          </Link>
        ))}
      </section>

      {user ? <section className="danger">
        <button className="logout" type="button" onClick={handleLogout}>تسجيل الخروج</button>
        <Link className="delete" href="/data-deletion">طلب حذف الحساب والبيانات</Link>
      </section> : null}

    </main>
  );
}
