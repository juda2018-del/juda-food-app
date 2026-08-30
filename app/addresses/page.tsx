"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import FuseIcon from "@/components/FuseIcon";
import { auth, db } from "../firebase";
import { parseFuseRole, roleHome } from "@/lib/fuse-auth";

const LOAD_TIMEOUT_MS = 7000;

function withTimeout<T>(promise: Promise<T>, timeoutMs = LOAD_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error("TIMEOUT")), timeoutMs);
    }),
  ]);
}

export default function AddressesPage() {
  const router = useRouter();
  const [uid, setUid] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    let authResolved = false;

    setLoading(true);
    setError("");
    setMessage("");

    const watchdog = window.setTimeout(() => {
      if (!active || authResolved) return;
      setLoading(false);
      setError("تعذر تحميل جلسة الحساب. تحقق من الاتصال ثم أعد المحاولة.");
    }, LOAD_TIMEOUT_MS);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      authResolved = true;
      window.clearTimeout(watchdog);
      if (!active) return;

      if (!user) {
        setLoading(false);
        setUid("");
        setError("سجّل الدخول حتى تقدر تدير عنوان التوصيل.");
        return;
      }

      try {
        const [token, snap] = await withTimeout(Promise.all([
          user.getIdTokenResult(),
          getDoc(doc(db, "users", user.uid)),
        ]));
        if (!active) return;

        const profile = snap.exists() ? snap.data() : {};
        const role = parseFuseRole(token.claims.role || token.claims.fuseRole || profile.role || profile.fuseRole);
        if (role && role !== "customer") {
          router.replace(roleHome[role]);
          return;
        }

        setUid(user.uid);
        setAddress(snap.exists() ? String(profile.address || "") : "");
      } catch {
        if (active) setError("تعذر تحميل العنوان حالياً. تحقق من الإنترنت وحاول مرة ثانية.");
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
      window.clearTimeout(watchdog);
      unsubscribe();
    };
  }, [router, retry]);

  async function saveAddress() {
    if (!uid || saving) return;
    const cleanAddress = address.trim();
    if (cleanAddress.length < 8) return setError("اكتب عنواناً واضحاً لا يقل عن 8 أحرف.");
    if (cleanAddress.length > 220) return setError("العنوان طويل جداً.");

    setSaving(true);
    setMessage("");
    setError("");
    try {
      const ref = doc(db, "users", uid);
      const snap = await withTimeout(getDoc(ref));
      if (snap.exists()) {
        await withTimeout(updateDoc(ref, { address: cleanAddress, updatedAt: serverTimestamp() }));
      } else {
        await withTimeout(setDoc(ref, {
          role: "customer",
          name: auth.currentUser?.displayName || "زبون FUSE",
          phone: "",
          address: cleanAddress,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }));
      }
      setMessage("تم حفظ عنوان التوصيل.");
    } catch {
      setError("تعذر حفظ العنوان. تحقق من الإنترنت وحاول مرة ثانية.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app" dir="rtl">
      <header className="top customer-header">
        <Link href="/profile" className="back fuse-back-btn" aria-label="الرجوع">
          <FuseIcon name="chevron-back" />
        </Link>
        <div className="title">
          <h1>عنوان التوصيل</h1>
          <p>يُستخدم تلقائياً عند الطلب</p>
        </div>
        <div className="space" aria-hidden="true" />
      </header>

      <section className="hero">
        <h2>
          <span className="hero-icon-inline"><FuseIcon name="map-pin" size="sm" /></span>
          عنوانك الأساسي
        </h2>
        <p>احفظ عنواناً واضحاً يتضمن المنطقة والشارع وأقرب نقطة دالة.</p>
      </section>

      {loading ? (
        <section className="state form-card">
          <span className="fuse-spinner" />
          جاري تحميل العنوان...
        </section>
      ) : (
        <section className="form-card">
          <label htmlFor="address">العنوان الكامل</label>
          <textarea
            id="address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="مثال: بغداد، المنصور، شارع 14 رمضان، قرب مول المنصور"
            maxLength={220}
            autoComplete="street-address"
          />
          <small>{address.length}/220</small>
          {error ? <div className="error">{error}</div> : null}
          {message ? <div className="success">{message}</div> : null}
          {!uid && !loading ? <Link className="btn-primary" href="/login?next=/addresses">تسجيل الدخول</Link> : null}
          {uid ? (
            <button type="button" className="btn-primary" onClick={saveAddress} disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ العنوان"}
            </button>
          ) : null}
          {error ? (
            <button className="btn-secondary" type="button" onClick={() => setRetry((value) => value + 1)}>
              إعادة المحاولة
            </button>
          ) : null}
        </section>
      )}

      <section className="notice form-card">
        <b>عنوان واحد موثوق</b>
        <p>حالياً نحفظ عنوان التوصيل الأساسي فقط حتى تبقى البيانات متوافقة وآمنة مع الحساب.</p>
      </section>
    </main>
  );
}
