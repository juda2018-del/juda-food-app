"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import FuseIcon from "@/components/FuseIcon";
import { db } from "../firebase";
import { FUSE_LOCAL_SESSION, parseFuseRole, roleHome, type FuseSession } from "@/lib/fuse-auth";

type NotificationDoc = {
  documentId: string;
  title?: string;
  message?: string;
  body?: string;
  type?: string;
  role?: string;
  restaurant?: string;
  restaurantName?: string;
  restaurantId?: string;
  orderId?: string;
  createdAt?: unknown;
  read?: boolean;
};

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

function restaurantKey(session: FuseSession | null) {
  return String(session?.restaurantId || session?.restaurant || session?.restaurantName || "").trim();
}

function formatDate(value: unknown) {
  try {
    const date = value && typeof value === "object" && "toDate" in value
      ? (value as { toDate: () => Date }).toDate()
      : new Date(value as string | number);
    if (Number.isNaN(date.getTime())) return "الآن";
    return date.toLocaleString("ar-IQ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "الآن";
  }
}

export default function NotificationCenterPage() {
  const [session, setSession] = useState<FuseSession | null>(null);
  const [items, setItems] = useState<NotificationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = readSession();
    if (!saved) {
      window.location.href = "/login?next=/notification-center";
      return;
    }
    setSession(saved);
  }, []);

  const staffMode = session?.role === "admin" || session?.role === "restaurant";
  const scopedRestaurantId = restaurantKey(session);

  useEffect(() => {
    if (!session) return;

    if (!staffMode) {
      setItems([]);
      setLoading(false);
      return;
    }

    if (session.role === "restaurant" && !scopedRestaurantId) {
      setItems([]);
      setLoading(false);
      setError("حساب المطعم غير مربوط بمطعم. راجع إدارة FUSE لربط الحساب.");
      return;
    }

    setLoading(true);
    setError("");

    const notificationsQuery = session.role === "admin"
      ? query(collection(db, "notifications"), orderBy("createdAt", "desc"))
      : query(
          collection(db, "notifications"),
          where("restaurantId", "==", scopedRestaurantId),
          orderBy("createdAt", "desc")
        );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const data = snapshot.docs
          .map((item) => ({
            ...(item.data() as Omit<NotificationDoc, "documentId">),
            documentId: item.id,
          }))
          .filter((item) => session.role === "admin" || !item.role || item.role === "restaurant")
          .slice(0, 60);

        setItems(data);
        setLoading(false);
        setError("");
      },
      (snapshotError) => {
        setItems([]);
        setLoading(false);
        const message = snapshotError.message || "تعذر تحميل الإشعارات";
        setError(message.includes("index") ? "الإشعارات تحتاج Firestore Index للاستعلام المقيد بالمطعم." : message);
      }
    );

    return unsubscribe;
  }, [scopedRestaurantId, session, staffMode]);

  const visibleItems = useMemo(() => items.slice(0, 60), [items]);

  if (session && !staffMode) {
    return (
      <main dir="rtl" className="app">
        <header className="top customer-header">
          <Link href="/" className="back fuse-back-btn" aria-label="الرئيسية">
            <FuseIcon name="chevron-back" />
          </Link>
          <div className="title">
            <h1>التحديثات</h1>
            <p>تابع طلباتك من مكان واحد</p>
          </div>
          <Link href="/profile" className="support" aria-label="حسابي">حسابي</Link>
        </header>

        <section className="hero">
          <span style={{ display: "inline-flex", padding: "6px 10px", borderRadius: 999, background: "rgba(255,255,255,0.15)", fontWeight: 900 }}>FUSE</span>
          <h2 style={{ fontSize: 28, margin: "16px 0 8px" }}>وين وصل طلبك؟</h2>
          <p>ادخل رقم الطلب الكامل أو رقم الهاتف داخل صفحة طلباتي وشوف آخر حالة مباشرة.</p>
          <Link href="/order-status" className="btn-primary" style={{ display: "block", marginTop: 18, textAlign: "center" }}>فتح طلباتي</Link>
        </section>

        <section className="support-grid">
          <Link href="/order-status" className="form-card support-tile" style={{ textDecoration: "none", color: "inherit" }}>
            <b style={{ fontSize: 18 }}>تتبع الطلب</b>
            <small style={{ color: "var(--ref-muted)", lineHeight: 1.6, fontWeight: 700 }}>الحالة، المطعم، المبلغ والمراحل</small>
          </Link>
          <Link href="/restaurants" className="form-card support-tile" style={{ textDecoration: "none", color: "inherit" }}>
            <b style={{ fontSize: 18 }}>اطلب من جديد</b>
            <small style={{ color: "var(--ref-muted)", lineHeight: 1.6, fontWeight: 700 }}>اختار مطعماً وأضف الوجبات للسلة</small>
          </Link>
          <Link href="/support" className="form-card support-tile" style={{ textDecoration: "none", color: "inherit" }}>
            <b style={{ fontSize: 18 }}>مشكلة بالطلب؟</b>
            <small style={{ color: "var(--ref-muted)", lineHeight: 1.6, fontWeight: 700 }}>تواصل مع دعم FUSE</small>
          </Link>
        </section>

        <section className="notice form-card" style={{ textAlign: "center" }}>
          <b style={{ fontSize: 18 }}>ما نعرض إشعارات وهمية</b>
          <p style={{ margin: "8px 0 0", color: "var(--ref-muted)", lineHeight: 1.7 }}>أي تحديث حقيقي للطلب يظهر داخل صفحة طلباتي حسب البيانات المحفوظة في النظام.</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main dir="rtl" className="page staff-page">
        <section className="empty-note"><b>جاري فحص الحساب...</b></section>
        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main dir="rtl" className="page staff-page">
      <header className="top customer-header">
        <Link href={roleHome[session.role] || "/"} className="back fuse-back-btn" aria-label="الرجوع">
          <FuseIcon name="chevron-back" />
        </Link>
        <div><h1>مركز الإشعارات</h1><p>طلبات وتنبيهات النظام</p></div>
        <span className="count">{visibleItems.filter((item) => !item.read).length}</span>
      </header>

      {loading ? <section className="empty-note"><b>جاري التحميل...</b></section> : null}
      {error ? <section className="empty-note error"><b>تعذر التحميل</b><p>{error}</p></section> : null}

      {!loading && !error && visibleItems.length === 0 ? (
        <section className="empty-note"><b>ماكو إشعارات حالياً</b><p>الطلبات والتنبيهات الجديدة تظهر هنا مباشرة.</p></section>
      ) : null}

      <section className="list">
        {visibleItems.map((item) => (
          <article className="notification" key={item.documentId}>
            <div className="notification-head">
              <span className={`badge ${item.type || "system"}`}>{item.type === "order" ? "طلب" : item.type === "warning" ? "تنبيه" : "إشعار"}</span>
              <small>{formatDate(item.createdAt)}</small>
            </div>
            <h2>{item.title || "إشعار جديد"}</h2>
            <p>{item.message || item.body || "بدون تفاصيل"}</p>
            {item.orderId ? <Link href={`/order-status?orderId=${encodeURIComponent(item.orderId)}`}>فتح الطلب #{item.orderId}</Link> : null}
          </article>
        ))}
      </section>

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
  :global(*){box-sizing:border-box}
  :global(html),:global(body){margin:0;background:#fff8ef}
  .page{width:100%;max-width:430px;min-height:100dvh;margin:0 auto;padding:18px 16px 112px;background:linear-gradient(180deg,#fff8ef,#fff);color:#171717;font-family:var(--fuse-body-font)}
  .staff-page{max-width:760px;background:#0b1220;color:#fff}
  .topbar{display:grid;grid-template-columns:52px 1fr 58px;align-items:center;gap:10px;margin-bottom:18px}
  .topbar>div{text-align:center}.topbar h1{margin:0;font-size:25px}.topbar p{margin:3px 0 0;color:#7d746c;font-size:12px;font-weight:700}.staff-page .topbar p{color:rgba(255,255,255,.6)}
  .back,.profile,.count{height:46px;border-radius:16px;display:grid;place-items:center;background:#fff;color:#171717;text-decoration:none;font-weight:900;box-shadow:0 10px 25px rgba(0,0,0,.08)}
  .back{font-size:32px}.profile{font-size:12px;color:#ff5a00}.count{background:#ff5a00;color:#fff;font-size:18px}
  .customer-hero{border-radius:30px;padding:25px;background:linear-gradient(135deg,#123fbd,#082d8f);color:#fff;box-shadow:0 22px 45px rgba(8,45,143,.22)}
  .customer-hero span{display:inline-flex;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.15);font-weight:900}.customer-hero h2{font-size:31px;margin:16px 0 8px}.customer-hero p{line-height:1.8;color:rgba(255,255,255,.82);font-weight:700}
  .primary{display:block;text-align:center;margin-top:18px;padding:15px;border-radius:18px;background:#ff5a00;color:#fff;text-decoration:none;font-weight:900}
  .cards{display:grid;gap:12px;margin-top:15px}.card{display:grid;gap:5px;padding:18px;border-radius:24px;background:#fff;color:#171717;text-decoration:none;box-shadow:0 14px 32px rgba(0,0,0,.07)}.card b{font-size:18px}.card small{color:#777;line-height:1.6;font-weight:700}
  .empty-note{margin-top:15px;padding:20px;border-radius:24px;background:#fff3e8;text-align:center}.staff-page .empty-note{background:rgba(255,255,255,.06)}.empty-note b{font-size:18px}.empty-note p{margin:8px 0 0;color:#746b63;line-height:1.7}.staff-page .empty-note p{color:rgba(255,255,255,.62)}.error{background:#fee2e2!important;color:#991b1b}.staff-page .error p{color:#991b1b}
  .list{display:grid;gap:12px}.notification{padding:18px;border-radius:24px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.09)}.notification-head{display:flex;justify-content:space-between;align-items:center;gap:10px}.notification-head small{color:rgba(255,255,255,.55)}.notification h2{margin:13px 0 7px;font-size:20px}.notification p{margin:0;color:rgba(255,255,255,.7);line-height:1.7}.notification a{display:inline-block;margin-top:12px;color:#ff9a55;font-weight:900;text-decoration:none}.badge{padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.12);font-size:11px;font-weight:900}.badge.order{background:rgba(255,90,0,.18);color:#ffb06f}.badge.warning{background:rgba(234,179,8,.18);color:#fde68a}
`;