 "use client";

import Link from "next/link";
import { useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { app, db } from "../firebase";

import FuseIcon, { type FuseIconName } from "@/components/FuseIcon";

type Role = {
  title: string;
  desc: string;
  icon: FuseIconName;
  href: string;
  value: string;
};

const auth = getAuth(app);

const roles: Role[] = [
  {
    title: "زبون",
    desc: "طلب الطعام وتتبع الطلب وتقييم الخدمة",
    icon: "user",
    href: "/",
    value: "customer",
  },
  {
    title: "سائق",
    desc: "استلام الطلبات وتحديث حالة التوصيل",
    icon: "truck",
    href: "/driver-app",
    value: "driver",
  },
  {
    title: "مطعم",
    desc: "إدارة الطلبات وتحضيرها وتسليمها للسائق",
    icon: "store",
    href: "/restaurant-admin",
    value: "restaurant",
  },
  {
    title: "مدير",
    desc: "غرفة القيادة والتحليلات والذكاء الاصطناعي",
    icon: "shield",
    href: "/uber-dashboard",
    value: "admin",
  },
];

function getArabicError(code: string) {
  if (code.includes("auth/email-already-in-use")) {
    return "هذا الإيميل مسجل مسبقاً. استخدم تسجيل دخول أو اضغط نسيت كلمة السر.";
  }

  if (code.includes("auth/invalid-credential")) {
    return "الإيميل أو كلمة السر غير صحيحة.";
  }

  if (code.includes("auth/user-not-found")) {
    return "لا يوجد حساب بهذا الإيميل.";
  }

  if (code.includes("auth/wrong-password")) {
    return "كلمة السر غير صحيحة.";
  }

  if (code.includes("auth/weak-password")) {
    return "كلمة السر ضعيفة. اكتب 6 أحرف أو أرقام على الأقل.";
  }

  if (code.includes("auth/invalid-email")) {
    return "صيغة الإيميل غير صحيحة.";
  }

  return "صار خطأ. جرّب مرة ثانية.";
}

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(roles[0]);
  const [loading, setLoading] = useState(false);

  async function handleAuth() {
    if (!email || !password) {
      alert("اكتب الإيميل وكلمة السر");
      return;
    }

    if (!selectedRole) {
      alert("اختار نوع الحساب");
      return;
    }

    try {
      setLoading(true);

      const result =
        mode === "register"
          ? await createUserWithEmailAndPassword(auth, email, password)
          : await signInWithEmailAndPassword(auth, email, password);

      await setDoc(
        doc(db, "users", result.user.uid),
        {
          uid: result.user.uid,
          email,
          phone,
          role: selectedRole.value,
          roleTitle: selectedRole.title,
          updatedAt: serverTimestamp(),
          ...(mode === "register" ? { createdAt: serverTimestamp() } : {}),
        },
        { merge: true }
      );

      window.location.href = selectedRole.href;
    } catch (error: any) {
      alert(getArabicError(error.code || error.message || ""));
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    if (!email) {
      alert("اكتب الإيميل أولاً حتى نرسل رابط تغيير كلمة السر");
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      alert("تم إرسال رابط تغيير كلمة السر إلى الإيميل");
    } catch (error: any) {
      alert(getArabicError(error.code || error.message || ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" className="fuse-auth-page">
      <section className="fuse-auth-card">
        <div className="fuse-auth-head text-center">
          <img
            src="/images/fuse-logo.png"
            alt="FUSE"
            className="fuse-auth-logo mx-auto"
          />

          <h1>دخول FUSE</h1>

          <p className="text-muted">سجل دخولك أو أنشئ حساب جديد</p>
        </div>

        <div className="fuse-auth-tabs">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={mode === "login" ? "is-active" : undefined}
          >
            تسجيل دخول
          </button>

          <button
            type="button"
            onClick={() => setMode("register")}
            className={mode === "register" ? "is-active" : undefined}
          >
            إنشاء حساب
          </button>
        </div>

        <div className="fuse-auth-form">
          <label>الإيميل</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
            dir="ltr"
          />

          <label>كلمة السر</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="اكتب كلمة السر"
          />

          <label>رقم الهاتف</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07701234567"
            dir="ltr"
          />

          <button
            type="button"
            onClick={resetPassword}
            disabled={loading}
            className="fuse-auth-reset"
          >
            نسيت كلمة السر؟
          </button>
        </div>

        <h2 className="fuse-auth-section-title">اختار نوع الحساب</h2>

        <div className="fuse-auth-roles">
          {roles.map((role) => {
            const active = selectedRole?.title === role.title;

            return (
              <button
                key={role.title}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`fuse-role-btn${active ? " is-active" : ""}`}
              >
                <div className="fuse-role-icon">
                  <FuseIcon name={role.icon} size="lg" />
                </div>

                <div>
                  <h3>{role.title}</h3>
                  <p>{role.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleAuth}
          disabled={loading}
          className="fuse-auth-submit"
        >
          {loading
            ? "انتظر..."
            : mode === "login"
            ? "دخول"
            : "إنشاء حساب"}
        </button>

        <Link href="/" className="fuse-auth-back">
          رجوع للرئيسية
        </Link>
      </section>

    </main>
  );
}