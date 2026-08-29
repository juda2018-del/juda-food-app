"use client";

import Link from "next/link";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { firebaseAuth } from "@/lib/firebase/client";
import { db } from "../firebase";
import { saveFuseSession } from "@/lib/fuse-auth";
import { resolveFuseSession } from "@/lib/fuse-session-resolve";

function normalizePhone(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/\D/g, "")
    .replace(/^964/, "0");
}

function authMessage(code?: string) {
  if (code === "auth/email-already-in-use") return "هذا البريد مسجل مسبقاً. سجل دخول بدل إنشاء حساب جديد.";
  if (code === "auth/invalid-email") return "البريد الإلكتروني غير صحيح.";
  if (code === "auth/weak-password") return "كلمة المرور ضعيفة. استخدم 8 أحرف على الأقل.";
  if (code === "auth/network-request-failed") return "تعذر الاتصال. تحقق من الإنترنت وحاول مرة ثانية.";
  return "تعذر إنشاء الحساب. حاول مرة ثانية.";
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const cleanName = name.trim();
    const cleanPhone = normalizePhone(phone);
    const cleanAddress = address.trim();
    const cleanEmail = email.trim().toLowerCase();

    setError("");
    if (cleanName.length < 2) return setError("اكتب الاسم الكامل.");
    if (!/^07\d{9}$/.test(cleanPhone)) return setError("اكتب رقم هاتف عراقي صحيح مثل 07701234567.");
    if (cleanAddress.length < 8) return setError("اكتب عنوان توصيل واضحاً.");
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setError("اكتب بريداً إلكترونياً صحيحاً.");
    if (password.length < 8) return setError("كلمة المرور لازم تكون 8 أحرف على الأقل.");
    if (password !== confirmPassword) return setError("كلمتا المرور غير متطابقتين.");

    setBusy(true);
    try {
      const credential = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, password);
      await updateProfile(credential.user, { displayName: cleanName });
      await setDoc(doc(db, "users", credential.user.uid), {
        role: "customer",
        name: cleanName,
        phone: cleanPhone,
        address: cleanAddress,
        email: cleanEmail,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const session = await resolveFuseSession(credential.user);
      saveFuseSession(session);
      router.replace("/restaurants");
      router.refresh();
    } catch (signupError) {
      const code = typeof signupError === "object" && signupError && "code" in signupError
        ? String((signupError as { code?: string }).code || "")
        : "";
      setError(authMessage(code));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main dir="rtl" className="page">
      <section className="card">
        <Link href="/login" className="back">‹ رجوع للدخول</Link>
        <div className="brand">FUSE Iraq</div>
        <p className="eyebrow">حساب زبون جديد</p>
        <h1>سجل واطلب بسهولة</h1>
        <p className="sub">طلباتك وتقييماتك تبقى مربوطة بحسابك، وما تحتاج تبحث برقم الهاتف.</p>

        <form onSubmit={submit}>
          <label>الاسم الكامل<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} /></label>
          <label>رقم الهاتف<input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" dir="ltr" maxLength={14} placeholder="07701234567" /></label>
          <label>عنوان التوصيل<input value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" maxLength={220} placeholder="المنطقة، الشارع، أقرب نقطة دالة" /></label>
          <label>البريد الإلكتروني<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" dir="ltr" /></label>
          <label>كلمة المرور<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="new-password" dir="ltr" /></label>
          <label>تأكيد كلمة المرور<input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" autoComplete="new-password" dir="ltr" /></label>
          {error ? <div className="error">{error}</div> : null}
          <button type="submit" disabled={busy}>{busy ? "جاري إنشاء الحساب..." : "إنشاء حساب زبون"}</button>
        </form>

        <p className="login">عندك حساب؟ <Link href="/login">سجل دخول</Link></p>
      </section>

      <style jsx>{`
        :global(*){box-sizing:border-box}:global(body){margin:0;background:#050505}.page{min-height:100dvh;display:grid;place-items:center;padding:22px;background:radial-gradient(circle at top right,rgba(255,122,0,.2),transparent 38%),#050505;color:#fff;font-family:Cairo,system-ui,sans-serif}.card{width:min(100%,560px);border:1px solid rgba(255,255,255,.12);border-radius:32px;padding:28px;background:linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,122,0,.08));box-shadow:0 28px 80px rgba(0,0,0,.5)}.back{display:inline-flex;color:rgba(255,255,255,.72);text-decoration:none;font-weight:900;margin-bottom:18px}.brand{display:inline-flex;border-radius:999px;padding:10px 16px;background:#ff7a00;color:#111;font-weight:950}.eyebrow{margin:22px 0 0;color:#ff9f43;font-weight:900}h1{margin:6px 0 8px;font-size:clamp(36px,8vw,58px);line-height:1.08}.sub{margin:0 0 22px;color:rgba(255,255,255,.68);line-height:1.8}form,label{display:grid;gap:9px}form{gap:14px}label{font-weight:900;font-size:14px}input{width:100%;border:1px solid rgba(255,255,255,.14);border-radius:17px;padding:14px;background:#090909;color:#fff;font:inherit;outline:none}input:focus{border-color:#ff7a00;box-shadow:0 0 0 3px rgba(255,122,0,.15)}button{border:0;border-radius:17px;padding:15px;background:#ff7a00;color:#111;font:inherit;font-weight:950;cursor:pointer}button:disabled{opacity:.55;cursor:not-allowed}.error{border-radius:15px;padding:12px;background:rgba(239,68,68,.16);color:#fecaca;font-weight:800}.login{text-align:center;color:rgba(255,255,255,.65);margin:18px 0 0}.login a{color:#ff9f43;font-weight:900}
      `}</style>
    </main>
  );
}
