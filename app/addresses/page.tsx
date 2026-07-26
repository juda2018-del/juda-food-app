"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "../firebase";

export default function AddressesPage() {
  const router = useRouter();
  const [uid, setUid] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login?next=/addresses");
        return;
      }

      const token = await user.getIdTokenResult(true);
      const role = typeof token.claims.role === "string" ? token.claims.role : "";
      if (role && role !== "customer") {
        router.replace(role === "restaurant" ? "/restaurant-admin" : role === "driver" ? "/driver-app" : "/");
        return;
      }

      setUid(user.uid);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setAddress(String(snap.data().address || ""));
      } catch {
        setError("تعذر تحميل عنوانك.");
      } finally {
        setLoading(false);
      }
    });
  }, [router]);

  async function saveAddress() {
    if (!uid || saving) return;
    const cleanAddress = address.trim();
    if (cleanAddress.length < 8) {
      setError("اكتب عنواناً واضحاً لا يقل عن 8 أحرف.");
      return;
    }
    if (cleanAddress.length > 220) {
      setError("العنوان طويل جداً.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");
    try {
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, { address: cleanAddress, updatedAt: serverTimestamp() });
      } else {
        await setDoc(ref, {
          role: "customer",
          name: auth.currentUser?.displayName || "زبون FUSE",
          phone: "",
          address: cleanAddress,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setMessage("تم حفظ عنوان التوصيل.");
    } catch {
      setError("تعذر حفظ العنوان. حاول مرة ثانية.");
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

      <section className="hero">
        <h2>📍 عنوانك الأساسي</h2>
        <p>احفظ عنواناً واضحاً يتضمن المنطقة والشارع وأقرب نقطة دالة.</p>
      </section>

      {loading ? <section className="state">جاري تحميل العنوان...</section> : (
        <section className="card">
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
          <button type="button" onClick={saveAddress} disabled={saving}>
            {saving ? "جاري الحفظ..." : "حفظ العنوان"}
          </button>
        </section>
      )}

      <section className="notice">
        <b>عنوان واحد موثوق</b>
        <p>حالياً نحفظ عنوان التوصيل الأساسي فقط حتى تبقى البيانات متوافقة وآمنة مع الحساب.</p>
      </section>

      <style jsx>{`
        :global(*){box-sizing:border-box}:global(body){margin:0;background:#efe8df;font-family:Arial,"Cairo",sans-serif;color:#181818}
        .app{width:100%;max-width:430px;min-height:100dvh;margin:auto;padding:18px;background:linear-gradient(180deg,#fffaf4,#fff)}
        .top{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}.back{width:44px;height:44px;border-radius:16px;background:#fff;text-decoration:none;color:#151515;display:grid;place-items:center;font-size:28px;font-weight:900;box-shadow:0 12px 28px rgba(0,0,0,.07)}
        .title{text-align:center}.title h1{margin:0;font-size:25px}.title p{margin:4px 0 0;color:#888;font-size:12px;font-weight:700}
        .hero{background:linear-gradient(135deg,#ff4d00,#ff8a00);color:#fff;border-radius:28px;padding:22px;margin-bottom:16px;box-shadow:0 18px 42px rgba(255,77,0,.22)}.hero h2{margin:0;font-size:22px}.hero p{margin:8px 0 0;line-height:1.7;font-size:13px;color:rgba(255,255,255,.9)}
        .card,.state,.notice{background:#fff;border-radius:25px;padding:18px;box-shadow:0 14px 34px rgba(0,0,0,.07)}.card{display:grid;gap:10px}.card label{font-size:13px;font-weight:900}.card textarea{min-height:130px;resize:vertical;border:1px solid #eadfd6;border-radius:17px;padding:14px;font:inherit;line-height:1.8;outline:none}.card textarea:focus{border-color:#ff5a00;box-shadow:0 0 0 3px rgba(255,90,0,.12)}.card small{color:#999;text-align:left}.card button{border:0;border-radius:17px;padding:15px;background:#171717;color:#fff;font:inherit;font-weight:900;cursor:pointer}.card button:disabled{opacity:.55;cursor:not-allowed}
        .error,.success{border-radius:14px;padding:11px;font-size:12px;font-weight:800}.error{background:#fff0f0;color:#a52323}.success{background:#edfff2;color:#17733a}.state{text-align:center;font-weight:800}.notice{margin-top:14px;background:#fff8f2}.notice b{color:#e65300}.notice p{margin:6px 0 0;color:#777;font-size:12px;line-height:1.7}
      `}</style>
    </main>
  );
}
