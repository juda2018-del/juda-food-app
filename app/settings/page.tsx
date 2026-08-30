"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import FuseIcon from "@/components/FuseIcon";
import { auth, db } from "../firebase";
import { performFuseLogout } from "@/lib/fuse-logout";

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
          const target = role === "admin" ? "/fuse-admin" : role === "restaurant" ? "/restaurant-admin" : "/driver-app";
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
    return (
      <main dir="rtl" className="app">
        <section className="state form-card">
          <span className="fuse-spinner" />
          جاري تحميل الإعدادات...
        </section>
      </main>
    );
  }

  return (
    <main dir="rtl" className="app fuse-satellite">
      <header className="top customer-header">
        <Link href="/profile" className="back fuse-back-btn" aria-label="الرجوع">
          <FuseIcon name="chevron-back" />
        </Link>
        <div className="title">
          <h1>إعدادات الحساب</h1>
          <p>FUSE Iraq</p>
        </div>
        <Link href="/support" className="support" aria-label="الدعم">دعم</Link>
      </header>

      <section className="form-card">
        <div className="identity">
          <div className="avatar">{(name || user?.email || "F").trim().charAt(0).toUpperCase()}</div>
          <div><b>{user?.email}</b><span>بيانات التوصيل المحفوظة</span></div>
        </div>

        <form onSubmit={saveProfile}>
          <label>الاسم الكامل<input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} autoComplete="name" /></label>
          <label>رقم الهاتف<input value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={14} inputMode="tel" autoComplete="tel" dir="ltr" placeholder="07701234567" /></label>
          <label>عنوان التوصيل<textarea value={address} onChange={(event) => setAddress(event.target.value)} maxLength={220} autoComplete="street-address" placeholder="المنطقة، الشارع، أقرب نقطة دالة" /></label>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ التغييرات"}</button>
        </form>

        {message ? <p className="success">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="form-card links">
        <h2>الحساب والقانونية</h2>
        <Link href="/privacy" className="chevron-link"><span>سياسة الخصوصية</span><FuseIcon name="chevron-forward" size="sm" /></Link>
        <Link href="/terms" className="chevron-link"><span>الشروط والأحكام</span><FuseIcon name="chevron-forward" size="sm" /></Link>
        <Link href="/data-deletion" className="chevron-link danger"><span>طلب حذف الحساب والبيانات</span><FuseIcon name="chevron-forward" size="sm" /></Link>
        <button type="button" className="btn-secondary" onClick={() => performFuseLogout("/")}>تسجيل الخروج</button>
      </section>

      <section className="notice form-card">
        <b>حماية الحساب</b>
        <p>لا يمكن من هذه الصفحة تغيير البريد أو الدور أو صلاحيات الإدارة والمطعم والسائق.</p>
      </section>

    </main>
  );
}
