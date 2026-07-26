"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "../firebase";

type ProfileData = {
  name?: string;
  displayName?: string;
  phone?: string;
  address?: string;
  role?: string;
  fuseRole?: string;
};

function normalizePhone(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[^0-9+]/g, "")
    .replace(/^\+964/, "0");
}

function validPhone(value: string) {
  return /^07\d{9}$/.test(normalizePhone(value));
}

function normalizeRole(value?: string) {
  const role = String(value || "").trim().toLowerCase();
  if (["admin", "restaurant", "driver", "customer"].includes(role)) return role;
  return "";
}

async function readProfile(user: User): Promise<ProfileData> {
  for (const collectionName of ["users", "profiles", "accounts"]) {
    try {
      const snapshot = await getDoc(doc(db, collectionName, user.uid));
      if (snapshot.exists()) return snapshot.data() as ProfileData;
    } catch {
      // Continue to the next compatible profile collection.
    }
  }
  return {};
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login?next=/settings");
        return;
      }

      try {
        const token = await currentUser.getIdTokenResult();
        const profile = await readProfile(currentUser);
        const role = normalizeRole(String(token.claims.role || token.claims.fuseRole || profile.role || profile.fuseRole || ""));

        if (role && role !== "customer") {
          const target = role === "admin" ? "/" : role === "restaurant" ? "/restaurant-admin" : "/driver-app";
          router.replace(target);
          return;
        }

        setUser(currentUser);
        setName(String(profile.name || profile.displayName || currentUser.displayName || ""));
        setPhone(String(profile.phone || currentUser.phoneNumber || ""));
        setAddress(String(profile.address || ""));
      } catch {
        setError("تعذر تحميل بيانات الحساب.");
      } finally {
        setLoading(false);
      }
    });
  }, [router]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || saving) return;

    setMessage("");
    setError("");

    const cleanName = name.trim();
    const cleanPhone = normalizePhone(phone);
    const cleanAddress = address.trim();

    if (cleanName.length < 2 || cleanName.length > 80) {
      setError("اكتب اسماً صحيحاً من حرفين إلى 80 حرفاً.");
      return;
    }
    if (!validPhone(cleanPhone)) {
      setError("اكتب رقم هاتف عراقي صحيح مثل 07701234567.");
      return;
    }
    if (cleanAddress && (cleanAddress.length < 8 || cleanAddress.length > 220)) {
      setError("العنوان يجب أن يكون واضحاً ومن 8 إلى 220 حرفاً.");
      return;
    }

    setSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const existing = await getDoc(userRef);

      if (existing.exists()) {
        await setDoc(
          userRef,
          {
            name: cleanName,
            phone: cleanPhone,
            address: cleanAddress,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        await setDoc(userRef, {
          role: "customer",
          name: cleanName,
          phone: cleanPhone,
          address: cleanAddress,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      setPhone(cleanPhone);
      setMessage("تم حفظ بيانات حسابك بنجاح.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "تعذر حفظ البيانات.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main dir="rtl" className="state">جاري تحميل الإعدادات...</main>;
  }

  return (
    <main dir="rtl" className="page">
      <header className="top">
        <Link href="/profile" className="back">‹</Link>
        <div><small>FUSE العراق</small><h1>إعدادات الحساب</h1></div>
        <Link href="/support" className="support">دعم</Link>
      </header>

      <section className="card">
        <div className="identity">
          <div className="avatar">{(name || user?.email || "F").trim().charAt(0).toUpperCase()}</div>
          <div><b>{user?.email}</b><span>بيانات التوصيل المحفوظة</span></div>
        </div>

        <form onSubmit={saveProfile}>
          <label>الاسم الكامل<input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} autoComplete="name" /></label>
          <label>رقم الهاتف<input value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={14} inputMode="tel" autoComplete="tel" dir="ltr" placeholder="07701234567" /></label>
          <label>عنوان التوصيل<textarea value={address} onChange={(event) => setAddress(event.target.value)} maxLength={220} autoComplete="street-address" placeholder="المنطقة، الشارع، أقرب نقطة دالة" /></label>
          <button type="submit" disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ التغييرات"}</button>
        </form>

        {message ? <p className="message ok">{message}</p> : null}
        {error ? <p className="message bad">{error}</p> : null}
      </section>

      <section className="note"><b>حماية الحساب</b><p>لا يمكن من هذه الصفحة تغيير البريد أو الدور أو صلاحيات الإدارة والمطعم والسائق.</p></section>

      <style jsx>{`
        :global(*){box-sizing:border-box}:global(body){margin:0;background:#efe8df}.page,.state{width:100%;max-width:430px;min-height:100dvh;margin:auto;background:linear-gradient(180deg,#fffaf4,#fff);font-family:Cairo,Arial,sans-serif;color:#171717}.page{padding:18px 16px 50px}.state{display:grid;place-items:center;font-weight:900}.top{display:grid;grid-template-columns:48px 1fr 48px;align-items:center;gap:8px;margin-bottom:18px;text-align:center}.top h1{margin:2px 0 0;font-size:24px}.top small{color:#ff5a00;font-weight:900}.back,.support{height:44px;border-radius:15px;background:#fff;display:grid;place-items:center;text-decoration:none;color:#171717;box-shadow:0 8px 24px rgba(0,0,0,.08);font-weight:900}.back{font-size:30px}.support{font-size:12px;color:#ff5a00}.card,.note{background:#fff;border-radius:28px;padding:18px;box-shadow:0 14px 34px rgba(0,0,0,.07)}.identity{display:flex;align-items:center;gap:12px;padding-bottom:16px;border-bottom:1px solid #f0e8df}.avatar{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#ff8a00,#ff3d00);color:#fff;font-size:24px;font-weight:950}.identity div:last-child{display:grid;gap:4px;min-width:0}.identity b{font-size:13px;overflow-wrap:anywhere}.identity span{font-size:11px;color:#888;font-weight:800}form{display:grid;gap:14px;margin-top:18px}label{display:grid;gap:7px;font-size:13px;font-weight:900}input,textarea{width:100%;border:1px solid #ece3da;border-radius:16px;padding:14px;background:#fffaf6;font:inherit;outline:none}textarea{min-height:100px;resize:vertical}input:focus,textarea:focus{border-color:#ff6a00;box-shadow:0 0 0 3px rgba(255,106,0,.12)}button{border:0;border-radius:17px;padding:15px;background:#ff5a00;color:#fff;font:inherit;font-weight:950;cursor:pointer}button:disabled{opacity:.55;cursor:not-allowed}.message{margin:14px 0 0;border-radius:15px;padding:12px;font-size:12px;font-weight:900}.ok{background:#edfff2;color:#176b35}.bad{background:#fff0f0;color:#a52323}.note{margin-top:14px;background:linear-gradient(135deg,#171717,#2d2d2d);color:#fff}.note p{margin:7px 0 0;color:#ccc;font-size:12px;line-height:1.7}
      `}</style>
    </main>
  );
}
