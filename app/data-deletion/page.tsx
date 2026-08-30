"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import FuseIcon from "@/components/FuseIcon";
import { auth, db } from "../firebase";

export default function DataDeletionPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => onAuthStateChanged(auth, async (currentUser) => {
    setUser(currentUser);
    setReady(true);
    if (!currentUser) return;
    try {
      const requestSnap = await getDoc(doc(db, "accountDeletionRequests", currentUser.uid));
      if (requestSnap.exists()) {
        const data = requestSnap.data();
        setStatus(String(data.status || "pending"));
        setReason(String(data.reason || ""));
      }
    } catch {
      // A missing request is normal.
    }
  }), []);

  async function submitRequest() {
    setError("");
    if (!user) return router.push("/login?next=/data-deletion");
    if (status && status !== "pending") return setError("هذا الطلب مغلق بعد قرار الإدارة. تواصل مع الدعم إذا تحتاج مساعدة إضافية.");
    if (confirmText.trim() !== "حذف حسابي") return setError('اكتب عبارة "حذف حسابي" للتأكيد.');
    if (reason.trim().length > 500) return setError("سبب الحذف طويل جداً.");

    setSaving(true);
    try {
      await setDoc(doc(db, "accountDeletionRequests", user.uid), {
        userUid: user.uid,
        email: user.email || "",
        reason: reason.trim(),
        status: "pending",
        requestedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: Boolean(status) });
      setStatus("pending");
      setConfirmText("");
    } catch {
      setError("تعذر إرسال الطلب. تأكد من اتصال الإنترنت وحاول مرة ثانية.");
    } finally {
      setSaving(false);
    }
  }

  const closed = status === "completed" || status === "rejected";

  return (
    <main dir="rtl" className="app">
      <header className="top customer-header">
        <Link href="/profile" className="back fuse-back-btn" aria-label="الرجوع">
          <FuseIcon name="chevron-back" />
        </Link>
        <div className="title">
          <h1>حذف الحساب</h1>
          <p>طلب حذف الحساب والبيانات</p>
        </div>
        <div className="space" aria-hidden="true" />
      </header>

      {!ready ? (
        <section className="state form-card">
          <span className="fuse-spinner" />
          جاري التحقق من الحساب...
        </section>
      ) : null}

      {ready && !user ? (
        <section className="state form-card">
          <h2 style={{ margin: "0 0 8px" }}>سجّل دخولك أولاً</h2>
          <p>طلب الحذف لازم يكون مربوطاً بالحساب الصحيح.</p>
          <Link href="/login?next=/data-deletion" className="btn-primary">تسجيل الدخول</Link>
        </section>
      ) : null}

      {user ? (
        <>
          <section className="warn-banner">
            <h2>تنبيه مهم</h2>
            <p>إرسال الطلب لا يحذف الحساب فوراً. تتم مراجعته لحماية الحساب والتأكد من عدم وجود طلبات نشطة أو التزامات معلقة. بعد المعالجة تُحذف بيانات الحساب وفق سياسة الخصوصية والمتطلبات القانونية.</p>
          </section>

          {status ? (
            <section className="form-card">
              <b>حالة طلبك: </b>
              <span style={{ color: status === "completed" ? "#15803d" : status === "rejected" ? "#b91c1c" : "#d97706", fontWeight: 900 }}>
                {status === "completed" ? "مكتمل" : status === "rejected" ? "مرفوض" : "قيد المراجعة"}
              </span>
              {closed ? <p style={{ margin: "9px 0 0", color: "var(--ref-muted)", fontSize: 12, lineHeight: 1.7 }}>تم إغلاق الطلب بعد قرار الإدارة. للاستفسار أو الاعتراض استخدم صفحة الدعم.</p> : null}
            </section>
          ) : null}

          <section className="form-card">
            <label>البريد المرتبط</label>
            <div dir="ltr" style={{ padding: "13px 14px", borderRadius: 14, background: "rgba(255,255,255,0.72)", fontSize: 13, overflowWrap: "anywhere" }}>{user.email || "بدون بريد"}</div>

            <label>سبب الحذف — اختياري</label>
            <textarea disabled={closed} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="اكتب السبب حتى نطوّر الخدمة" />

            {!closed ? (
              <>
                <label>للتأكيد اكتب: حذف حسابي</label>
                <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="حذف حسابي" />
              </>
            ) : null}

            {error ? <p className="error">{error}</p> : null}
            {closed ? (
              <Link href="/support" className="btn-primary">التواصل مع الدعم</Link>
            ) : (
              <button type="button" className="btn-danger" disabled={saving} onClick={submitRequest}>
                {saving ? "جاري الإرسال..." : status === "pending" ? "تحديث سبب طلب الحذف" : "إرسال طلب الحذف"}
              </button>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
