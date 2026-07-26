"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FUSE_LOCAL_SESSION, parseFuseRole, roleHome, type FuseSession } from "@/lib/fuse-auth";

type RequestKind = "driver" | "restaurant" | "deletion";
type RequestItem = {
  id: string;
  kind: RequestKind;
  status?: string;
  applicantName?: string;
  restaurantName?: string;
  phone?: string;
  city?: string;
  vehicleType?: string;
  restaurantAddress?: string;
  details?: string;
  reason?: string;
  email?: string;
  applicantEmail?: string;
  userUid?: string;
  applicantUid?: string;
  requestedAt?: unknown;
  createdAt?: unknown;
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

function isPending(item: RequestItem) {
  return !item.status || item.status === "pending";
}

function toMillis(value: unknown) {
  try {
    if (value && typeof value === "object" && "toDate" in value) {
      const fn = (value as { toDate?: unknown }).toDate;
      if (typeof fn === "function") return (fn as () => Date)().getTime();
    }
    const date = value instanceof Date ? value : new Date(value as string | number);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  } catch {
    return 0;
  }
}

function title(item: RequestItem) {
  if (item.kind === "driver") return item.applicantName || "طلب سائق";
  if (item.kind === "restaurant") return item.restaurantName || item.applicantName || "طلب مطعم";
  return item.email || item.userUid || "طلب حذف حساب";
}

function subtitle(item: RequestItem) {
  if (item.kind === "driver") return [item.city, item.vehicleType].filter(Boolean).join(" · ");
  if (item.kind === "restaurant") return [item.city, item.restaurantAddress].filter(Boolean).join(" · ");
  return item.reason || "بدون سبب إضافي";
}

function collectionName(kind: RequestKind) {
  if (kind === "driver") return "driverApplications";
  if (kind === "restaurant") return "restaurantApplications";
  return "accountDeletionRequests";
}

function statusLabel(value?: string) {
  if (value === "approved") return "مقبول";
  if (value === "rejected") return "مرفوض";
  if (value === "completed") return "تمت المعالجة";
  return "قيد المراجعة";
}

export default function AdminRequestsPage() {
  const [session, setSession] = useState<FuseSession | null>(null);
  const [items, setItems] = useState<RequestItem[]>([]);
  const [filter, setFilter] = useState<"all" | RequestKind>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    const saved = readSession();
    if (!saved) {
      window.location.href = "/login?next=/admin-requests";
      return;
    }
    if (saved.role !== "admin") {
      window.location.href = roleHome[saved.role] || "/login";
      return;
    }
    setSession(saved);
  }, []);

  useEffect(() => {
    if (!session || session.role !== "admin") return;
    const groups: Record<RequestKind, RequestItem[]> = { driver: [], restaurant: [], deletion: [] };
    const publish = () => {
      const combined = [...groups.driver, ...groups.restaurant, ...groups.deletion].sort((a, b) => {
        const pendingDifference = Number(isPending(b)) - Number(isPending(a));
        if (pendingDifference) return pendingDifference;
        return toMillis(b.createdAt || b.requestedAt) - toMillis(a.createdAt || a.requestedAt);
      });
      setItems(combined);
      setLoading(false);
    };
    const unsubs = [
      onSnapshot(collection(db, "driverApplications"), (snap) => {
        groups.driver = snap.docs.map((d) => ({ id: d.id, kind: "driver", ...(d.data() as Omit<RequestItem, "id" | "kind">) }));
        publish();
      }, (e) => { setError(e.message || "تعذر تحميل طلبات السائقين"); setLoading(false); }),
      onSnapshot(collection(db, "restaurantApplications"), (snap) => {
        groups.restaurant = snap.docs.map((d) => ({ id: d.id, kind: "restaurant", ...(d.data() as Omit<RequestItem, "id" | "kind">) }));
        publish();
      }, (e) => { setError(e.message || "تعذر تحميل طلبات المطاعم"); setLoading(false); }),
      onSnapshot(collection(db, "accountDeletionRequests"), (snap) => {
        groups.deletion = snap.docs.map((d) => ({ id: d.id, kind: "deletion", ...(d.data() as Omit<RequestItem, "id" | "kind">) }));
        publish();
      }, (e) => { setError(e.message || "تعذر تحميل طلبات حذف الحساب"); setLoading(false); }),
    ];
    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, [session]);

  const visible = useMemo(() => filter === "all" ? items : items.filter((item) => item.kind === filter), [items, filter]);
  const pending = items.filter(isPending).length;

  async function changeStatus(item: RequestItem, status: "approved" | "rejected" | "completed") {
    if (!isPending(item)) return setError("هذا الطلب تمت معالجته مسبقاً.");
    const key = `${item.kind}:${item.id}:${status}`;
    if (busy) return;
    setBusy(key);
    setError("");
    try {
      await updateDoc(doc(db, collectionName(item.kind), item.id), {
        status,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        reviewedBy: session?.email || "admin",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تحديث حالة الطلب");
    } finally {
      setBusy("");
    }
  }

  return (
    <main dir="rtl" className="page">
      <section className="shell">
        <header className="top">
          <div><small>FUSE Iraq</small><h1>مراجعة الطلبات</h1><p>{pending} طلب بانتظار القرار</p></div>
          <nav><Link href="/fuse-admin">لوحة الإدارة</Link><Link href="/live-orders">الطلبات</Link></nav>
        </header>

        <section className="filters">
          {([['all','الكل'],['driver','السائقون'],['restaurant','المطاعم'],['deletion','حذف الحسابات']] as const).map(([value,label]) => (
            <button key={value} type="button" className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{label}</button>
          ))}
        </section>

        {error ? <div className="alert">{error}</div> : null}
        {loading ? <div className="empty">جاري تحميل الطلبات...</div> : null}
        {!loading && !visible.length ? <div className="empty">ماكو طلبات ضمن هذا القسم.</div> : null}

        <section className="grid">
          {visible.map((item) => {
            const pendingItem = isPending(item);
            const email = item.email || item.applicantEmail || "";
            return (
              <article className={`card ${pendingItem ? "pending" : "resolved"}`} key={`${item.kind}:${item.id}`}>
                <div className="cardHead"><span>{item.kind === "driver" ? "سائق" : item.kind === "restaurant" ? "مطعم" : "حذف حساب"}</span><em>{statusLabel(item.status)}</em></div>
                <h2>{title(item)}</h2>
                <p>{subtitle(item)}</p>
                <div className="contact">
                  {item.phone ? <a href={`tel:${item.phone}`}>اتصال: {item.phone}</a> : null}
                  {email ? <a href={`mailto:${email}`}>{email}</a> : null}
                </div>
                {item.details ? <div className="details">{item.details}</div> : null}
                {pendingItem ? (
                  <div className="actions">
                    {item.kind === "deletion" ? (
                      <button type="button" disabled={Boolean(busy)} onClick={() => changeStatus(item, "completed")}>{busy === `${item.kind}:${item.id}:completed` ? "جاري..." : "تأكيد معالجة الطلب"}</button>
                    ) : (
                      <button type="button" disabled={Boolean(busy)} onClick={() => changeStatus(item, "approved")}>{busy === `${item.kind}:${item.id}:approved` ? "جاري..." : "قبول"}</button>
                    )}
                    <button className="reject" type="button" disabled={Boolean(busy)} onClick={() => changeStatus(item, "rejected")}>{busy === `${item.kind}:${item.id}:rejected` ? "جاري..." : "رفض"}</button>
                  </div>
                ) : <div className="locked">تم تثبيت القرار على هذا الطلب.</div>}
                {item.kind === "deletion" ? <small className="warning">تنفيذ حذف Firebase Authentication وبيانات المستخدم يتم يدوياً أو عبر وظيفة خادم آمنة، وليس من المتصفح.</small> : null}
              </article>
            );
          })}
        </section>
      </section>

      <style jsx>{`
        *{box-sizing:border-box}.page{min-height:100vh;background:#050505;color:#fff;padding:22px 14px;font-family:Arial,sans-serif}.shell{max-width:1180px;margin:auto}.top{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:18px}.top small{color:#ff7a00;font-weight:900}.top h1{margin:4px 0;font-size:34px}.top p{margin:0;color:#aaa}.top nav{display:flex;gap:8px;flex-wrap:wrap}.top a{color:#fff;text-decoration:none;background:#171717;border:1px solid #333;padding:10px 13px;border-radius:14px;font-weight:900}.filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}.filters button{border:1px solid #333;background:#111;color:#bbb;padding:11px 16px;border-radius:14px;font-weight:900;cursor:pointer}.filters button.active{background:#ff7a00;color:#111;border-color:#ff7a00}.alert{background:#401313;color:#ffb4b4;padding:14px;border-radius:16px;margin-bottom:14px}.empty{background:#111;border:1px solid #252525;border-radius:20px;padding:28px;text-align:center;color:#aaa}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}.card{background:linear-gradient(145deg,#171717,#0b0b0b);border:1px solid #2b2b2b;border-radius:24px;padding:18px}.card.pending{border-color:#6a421d}.card.resolved{opacity:.78}.cardHead{display:flex;justify-content:space-between;gap:12px}.cardHead span{color:#ff7a00;font-weight:900}.cardHead em{font-style:normal;background:#282828;padding:6px 10px;border-radius:999px;font-size:12px}.card h2{margin:16px 0 7px}.card p{color:#aaa;line-height:1.7;min-height:44px}.contact{display:grid;gap:7px;margin:0 0 13px}.contact a{color:#ffb06f;text-decoration:none;overflow-wrap:anywhere;font-size:13px;font-weight:800}.details{background:#101010;border:1px solid #292929;border-radius:14px;padding:12px;color:#ccc;line-height:1.7;margin-bottom:13px}.actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.actions button{border:0;border-radius:14px;padding:12px;font-weight:900;background:#ff7a00;color:#111;cursor:pointer}.actions button.reject{background:#341414;color:#ff9b9b;border:1px solid #5b2020}.actions button:disabled{opacity:.55;cursor:not-allowed}.locked{border:1px solid #303030;background:#121212;color:#999;border-radius:14px;padding:12px;text-align:center;font-size:13px;font-weight:800}.warning{display:block;margin-top:12px;color:#d6a46f;line-height:1.7}@media(max-width:650px){.top{align-items:flex-start;flex-direction:column}.top h1{font-size:28px}}
      `}</style>
    </main>
  );
}
