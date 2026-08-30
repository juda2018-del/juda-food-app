"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import FuseIcon from "@/components/FuseIcon";
import { auth, db } from "../firebase";
import { parseFuseRole, roleHome } from "@/lib/fuse-auth";

type Kind = "driver" | "restaurant";
type Props = { kind: Kind };
type ExistingApplication = { status?: string; reviewedAt?: unknown };

function normalizePhone(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[^0-9+]/g, "")
    .replace(/^\+964/, "0");
}

function statusLabel(status?: string) {
  if (status === "approved") return "تم قبول الطلب";
  if (status === "rejected") return "تم رفض الطلب";
  return "الطلب قيد المراجعة";
}

export default function JoinApplicationForm({ kind }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [existing, setExisting] = useState<ExistingApplication | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("بغداد");
  const [details, setDetails] = useState("");
  const [vehicleType, setVehicleType] = useState("دراجة نارية");
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantAddress, setRestaurantAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const config = useMemo(() => kind === "driver" ? {
    title: "الانضمام كسائق",
    eyebrow: "فريق التوصيل",
    description: "قدّم معلوماتك الحقيقية، وتراجع الإدارة الطلب قبل تفعيل حساب السائق.",
    collection: "driverApplications",
  } : {
    title: "تسجيل مطعمك",
    eyebrow: "شركاء FUSE",
    description: "أرسل معلومات المطعم، وتراجع الإدارة الطلب قبل إنشاء لوحة المطعم والمنيو.",
    collection: "restaurantApplications",
  }, [kind]);

  useEffect(() => onAuthStateChanged(auth, async (currentUser) => {
    setUser(currentUser);
    if (!currentUser) {
      setReady(true);
      return;
    }

    try {
      const [token, profileSnap, applicationSnap] = await Promise.all([
        currentUser.getIdTokenResult(),
        getDoc(doc(db, "users", currentUser.uid)),
        getDoc(doc(db, config.collection, currentUser.uid)),
      ]);
      const profile = profileSnap.exists() ? profileSnap.data() : {};
      const role = parseFuseRole(token.claims.role || token.claims.fuseRole || profile.role || profile.fuseRole);
      if (role && role !== "customer") {
        router.replace(roleHome[role]);
        return;
      }

      setName(currentUser.displayName || String(profile.name || ""));
      setPhone(String(profile.phone || ""));
      if (applicationSnap.exists()) setExisting(applicationSnap.data() as ExistingApplication);
    } catch {
      setError("تعذر تحميل بيانات الطلب. حاول مرة ثانية.");
    } finally {
      setReady(true);
    }
  }), [config.collection, router]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!user) {
      router.push(`/login?next=/${kind === "driver" ? "driver-register" : "restaurant-register"}`);
      return;
    }
    if (existing) {
      setError("عندك طلب مسجل مسبقاً، تابع حالته من هذه الصفحة.");
      return;
    }

    const cleanPhone = normalizePhone(phone);
    if (name.trim().length < 2) return setError("اكتب الاسم الكامل.");
    if (!/^07\d{9}$/.test(cleanPhone)) return setError("اكتب رقم هاتف عراقي صحيح مثل 07701234567.");
    if (city.trim().length < 2) return setError("اكتب المدينة.");
    if (details.trim().length < 10) return setError("اكتب تفاصيل كافية عن الطلب.");
    if (kind === "restaurant" && restaurantName.trim().length < 2) return setError("اكتب اسم المطعم.");
    if (kind === "restaurant" && restaurantAddress.trim().length < 8) return setError("اكتب عنوان المطعم بوضوح.");

    setBusy(true);
    try {
      const payload = {
        applicantUid: user.uid,
        applicantEmail: user.email || "",
        applicantName: name.trim(),
        phone: cleanPhone,
        city: city.trim(),
        details: details.trim().slice(0, 1000),
        kind,
        status: "pending",
        ...(kind === "driver" ? { vehicleType } : {
          restaurantName: restaurantName.trim(),
          restaurantAddress: restaurantAddress.trim(),
        }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, config.collection, user.uid), payload);
      setExisting({ status: "pending" });
      setMessage("تم إرسال طلبك بنجاح. ستراجعه إدارة FUSE وتتواصل وياك.");
    } catch {
      setError("تعذر إرسال الطلب. تأكد من تسجيل الدخول واتصال الإنترنت ثم حاول مرة ثانية.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main dir="rtl" className="app">
      <section className="form-card" style={{ maxWidth: 560, margin: "0 auto" }}>
        <Link href="/profile" className="back fuse-back-btn" aria-label="الرجوع للحساب" style={{ marginBottom: 12, display: "inline-grid" }}>
          <FuseIcon name="chevron-back" />
        </Link>
        <p className="eyebrow">{config.eyebrow}</p>
        <h1>{config.title}</h1>
        <p className="sub">{config.description}</p>

        {!ready ? <div className="notice">جاري التحقق من الحساب...</div> : null}
        {ready && !user ? <div className="notice">سجّل دخولك أولاً حتى يرتبط الطلب بحسابك.</div> : null}
        {existing ? <div className={`application-status ${existing.status || "pending"}`}><b>{statusLabel(existing.status)}</b><span>لا يمكن إرسال طلب آخر بنفس الحساب. تتغير الحالة هنا بعد مراجعة الإدارة.</span></div> : null}

        {!existing ? (
          <form onSubmit={submit}>
            <label>الاسم الكامل<input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></label>
            <label>رقم الهاتف<input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" dir="ltr" placeholder="07701234567" maxLength={14} /></label>
            <label>المدينة<input value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} /></label>

            {kind === "driver" ? (
              <label>نوع وسيلة التوصيل<select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}><option>دراجة نارية</option><option>سيارة</option><option>دراجة هوائية</option></select></label>
            ) : (
              <>
                <label>اسم المطعم<input value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} maxLength={120} /></label>
                <label>عنوان المطعم<input value={restaurantAddress} onChange={(e) => setRestaurantAddress(e.target.value)} maxLength={220} /></label>
              </>
            )}

            <label>{kind === "driver" ? "الخبرة ومناطق العمل" : "نوع الأكل ومعلومات إضافية"}<textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} rows={5} /></label>
            <button disabled={busy || !ready}>{busy ? "جاري الإرسال..." : "إرسال الطلب"}</button>
          </form>
        ) : null}

        {message ? <div className="success">{message}</div> : null}
        {error ? <div className="error">{error}</div> : null}
      </section>

      <style jsx>{`
        .eyebrow{margin:12px 0 4px;color:var(--ref-green);font-weight:900}
        h1{margin:0;font-size:28px;font-family:var(--fuse-title-font)}
        .sub{color:var(--ref-muted);line-height:1.8;margin:8px 0 20px;font-weight:700}
        .notice,.success,.error,.application-status{padding:13px;border-radius:16px;margin:12px 0;font-weight:800}
        .notice{background:rgba(255,252,247,.88);color:#7b5700}
        .success{background:#edfff2;color:#08783d}
        .error{background:#fff0f1;color:#b4232c}
        .application-status{display:grid;gap:6px;background:rgba(255,252,247,.88);color:#7b5700}
        .application-status span{font-size:12px;line-height:1.7}
        .application-status.approved{background:#edfff2;color:#08783d}
        .application-status.rejected{background:#fff0f1;color:#b4232c}
        form{display:grid;gap:14px}
        label{display:grid;gap:8px;font-size:13px;font-weight:900}
        button{border:0;border-radius:17px;padding:15px;background:linear-gradient(135deg,var(--ref-green),var(--ref-green-2));color:#fff;font:inherit;font-weight:950;cursor:pointer}
        button:disabled{opacity:.55;cursor:not-allowed}
      `}</style>
    </main>
  );
}
