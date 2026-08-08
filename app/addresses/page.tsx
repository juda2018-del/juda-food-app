"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
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
      <header className="top">
        <Link href="/profile" className="back">‹</Link>
        <div className="title"><h1>عنوان التوصيل</h1><p>يُستخدم تلقائياً عند الطلب</p></div>
        <div style={{ width: 44 }} />
      </header>

      <section className="hero"><h2>📍 عنوانك الأساسي</h2><p>احفظ عنواناً واضحاً يتضمن المنطقة والشارع وأقرب نقطة دالة.</p></section>

      {loading ? <section className="state"><span className="spinner" />جاري تحميل العنوان...</section> : (
        <section className="card">
          <label htmlFor="address">العنوان الكامل</label>
          <textarea id="address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="مثال: بغداد، المنصور، شارع 14 رمضان، قرب مول المنصور" maxLength={220} autoComplete="street-address" />
          <small>{address.length}/220</small>
          {error ? <div className="error">{error}</div> : null}
          {message ? <div className="success">{message}</div> : null}
          {!uid && !loading ? <Link className="login" href="/login?next=/addresses">تسجيل الدخول</Link> : null}
          {uid ? <button type="button" onClick={saveAddress} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ العنوان"}</button> : null}
          {error ? <button className="retry" type="button" onClick={() => setRetry((value) => value + 1)}>إعادة المحاولة</button> : null}
        </section>
      )}

      <section className="notice"><b>عنوان واحد موثوق</b><p>حالياً نحفظ عنوان التوصيل الأساسي فقط حتى تبقى البيانات متوافقة وآمنة مع الحساب.</p></section>

      <style jsx>{`
        :global(*){box-sizing:border-box}:global(body){margin:0;background:#efe8df;font-family:Arial,"Cairo",sans-serif;color:#181818}.app{width:100%;max-width:430px;min-height:100dvh;margin:auto;padding:18px;background:linear-gradient(180deg,#fffaf4,#fff)}.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}.back{width:44px;height:44px;border-radius:16px;background:#fff;text-decoration:none;color:#151515;display:grid;place-items:center;font-size:28px;font-weight:900;box-shadow:0 12px 28px rgba(0,0,0,.07)}.title{text-align:center}.title h1{margin:0;font-size:25px}.title p{margin:4px 0 0;color:#888;font-size:12px;font-weight:700}.hero{background:linear-gradient(135deg,#ff4d00,#ff8a00);color:#fff;border-radius:28px;padding:22px;margin-bottom:16px;box-shadow:0 18px 42px rgba(255,77,0,.22)}.hero h2{margin:0;font-size:22px}.hero p{margin:8px 0 0;line-height:1.7;font-size:13px;color:rgba(255,255,255,.9)}.card,.state,.notice{background:#fff;border-radius:25px;padding:18px;box-shadow:0 14px 34px rgba(0,0,0,.07)}.card{display:grid;gap:10px}.card label{font-size:13px;font-weight:900}.card textarea{min-height:130px;resize:vertical;border:1px solid #eadfd6;border-radius:17px;padding:14px;font:inherit;line-height:1.8;outline:none}.card textarea:focus{border-color:#ff5a00;box-shadow:0 0 0 3px rgba(255,90,0,.12)}.card small{color:#999;text-align:left}.card button,.login{border:0;border-radius:17px;padding:15px;background:#171717;color:#fff;font:inherit;font-weight:900;text-align:center;text-decoration:none}.card button:disabled{opacity:.55;cursor:not-allowed}.card .retry{background:#fff0e8;color:#e65300}.error,.success{border-radius:14px;padding:11px;font-size:12px;font-weight:800}.error{background:#fff0f0;color:#a52323}.success{background:#edfff2;color:#17733a}.state{text-align:center;font-weight:800;display:flex;justify-content:center;align-items:center;gap:10px}.spinner{display:inline-block;width:20px;height:20px;border:3px solid #ffd9c2;border-top-color:#ff5a00;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.notice{margin-top:14px;background:#fff8f2}.notice b{color:#e65300}.notice p{margin:6px 0 0;color:#777;font-size:12px;line-height:1.7}
      `}</style>
    </main>
  );
}
