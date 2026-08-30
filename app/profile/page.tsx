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

      <style jsx>{`
        :global(*){box-sizing:border-box}:global(body){margin:0;background:#f4efe6;font-family:var(--fuse-body-font);color:#15171a}.loading{min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:#fdf6ec;padding:24px;text-align:center}.loading small{color:#8d837a;font-weight:700}.spinner{width:36px;height:36px;border:4px solid rgba(31,122,79,.15);border-top-color:#1f7a4f;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.profile-shell{width:100%;max-width:430px;min-height:100dvh;margin:auto;background:transparent;padding:0}.top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.brand{font-size:22px;font-weight:950;color:#15171a;background:transparent;border:0;padding:0}.top-actions{display:flex;gap:8px}.icon-btn{width:46px;height:46px;border-radius:16px;background:rgba(255,252,247,.82);border:1px solid rgba(21,23,26,.08);display:grid;place-items:center;text-decoration:none;color:#15171a;box-shadow:0 8px 22px rgba(21,23,26,.06);font-size:20px}.profile-card{background:rgba(255,252,247,.86);border-radius:28px;padding:18px;display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid rgba(255,255,255,.92);box-shadow:0 10px 28px rgba(21,23,26,.07);backdrop-filter:blur(18px)}.load-warning{margin:10px 0 0;padding:10px 12px;border-radius:14px;background:rgba(255,252,247,.88);color:#7b5700;font-size:11px;font-weight:800;border:1px solid rgba(21,23,26,.06)}.session-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.session-actions a,.session-actions button{height:46px;border:0;border-radius:15px;display:grid;place-items:center;font-family:inherit;font-size:12px;font-weight:900;text-decoration:none}.session-actions a{background:linear-gradient(135deg,#1f7a4f,#2f915f);color:#fff}.session-actions button{background:rgba(255,252,247,.86);color:#222;border:1px solid rgba(21,23,26,.06)}.user{display:flex;align-items:center;gap:13px;min-width:0}.avatar{width:64px;height:64px;flex:0 0 64px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:25px;font-weight:900;background:linear-gradient(135deg,#1f7a4f,#54b9ff);box-shadow:0 10px 24px rgba(31,122,79,.22)}.user div:last-child{min-width:0}.user h1{font-size:19px;margin:0 0 5px;font-weight:900}.user p{margin:2px 0;color:#777;font-size:11px;font-weight:700;overflow-wrap:anywhere}.edit{padding:10px 12px;background:rgba(31,122,79,.12);border-radius:14px;text-decoration:none;color:#1f7a4f;font-size:12px;font-weight:900}.notice{margin-top:16px;border-radius:24px;padding:17px;background:linear-gradient(135deg,#1a2235,#263759);color:#fff;box-shadow:0 16px 34px rgba(26,34,53,.16)}.notice h2{margin:0 0 7px;font-size:18px}.notice p,.notice small{display:block;margin:0;color:rgba(255,255,255,.72);font-size:12px;line-height:1.7}.notice small{margin-top:6px}.notice a{display:inline-flex;margin-top:12px;padding:10px 14px;border-radius:13px;background:linear-gradient(135deg,#1f7a4f,#2f915f);color:#fff;text-decoration:none;font-size:12px;font-weight:900}.section-title{font-size:15px;font-weight:900;margin:22px 3px 10px}.menu{background:rgba(255,252,247,.86);border-radius:26px;padding:5px;border:1px solid rgba(255,255,255,.92);box-shadow:0 10px 28px rgba(21,23,26,.06);backdrop-filter:blur(18px)}.item{min-height:66px;display:flex;align-items:center;justify-content:space-between;padding:9px 10px;text-decoration:none;color:#15171a;border-bottom:1px solid rgba(21,23,26,.06)}.item:last-child{border-bottom:0}.item-main{display:flex;align-items:center;gap:12px}.emoji{width:44px;height:44px;border-radius:16px;background:rgba(31,122,79,.08);display:grid;place-items:center;font-size:20px}.item h3{margin:0 0 3px;font-size:13px;font-weight:900}.item p{margin:0;color:#999;font-size:10px;font-weight:700}.arrow{font-size:24px;color:#bbb}.danger{margin-top:16px;background:rgba(255,252,247,.86);border-radius:24px;padding:8px;border:1px solid rgba(255,255,255,.92);box-shadow:0 10px 28px rgba(21,23,26,.06)}.logout,.delete{width:100%;height:52px;border:0;border-radius:16px;font-family:inherit;font-weight:900;font-size:13px;cursor:pointer}.logout{background:rgba(31,122,79,.1);color:#1f7a4f}.delete{margin-top:8px;background:#fff1f2;color:#dc2626;text-decoration:none;display:grid;place-items:center}
      `}</style>
    </main>
  );
}
