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
import FuseBackButton from "@/components/customer/FuseButtons";
import CustomerPageShell from "@/components/customer/CustomerPageShell";

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
    <CustomerPageShell variant="auth">
      <div className="fuse-auth-card">
        <FuseBackButton href="/login" label="رجوع لتسجيل الدخول" />
        <header className="fuse-auth-head">
          <p className="fuse-auth-eyebrow">حساب زبون جديد</p>
          <h1>إنشاء حساب FUSE</h1>
          <p className="fuse-auth-sub">طلباتك وتقييماتك تبقى مربوطة بحسابك بدون بحث بالهاتف.</p>
        </header>

        <form className="fuse-auth-form" onSubmit={submit}>
          <label>الاسم الكامل<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} /></label>
          <label>رقم الهاتف<input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" dir="ltr" maxLength={14} placeholder="07701234567" /></label>
          <label>عنوان التوصيل<input value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" maxLength={220} placeholder="المنطقة، الشارع، أقرب نقطة دالة" /></label>
          <label>البريد الإلكتروني<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" dir="ltr" /></label>
          <label>كلمة المرور<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="new-password" dir="ltr" /></label>
          <label>تأكيد كلمة المرور<input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" autoComplete="new-password" dir="ltr" /></label>
          {error ? <div className="fuse-auth-message">{error}</div> : null}
          <button className="fuse-auth-submit" type="submit" disabled={busy}>
            {busy ? "جاري إنشاء الحساب..." : "إنشاء حساب زبون"}
          </button>
        </form>

        <p className="fuse-auth-link-row">
          عندك حساب؟ <Link href="/login">سجل دخول</Link>
        </p>
      </div>
    </CustomerPageShell>
  );
}
