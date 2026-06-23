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

type Role = {
  title: string;
  desc: string;
  icon: string;
  href: string;
  color: string;
  value: string;
};

const auth = getAuth(app);

const roles: Role[] = [
  {
    title: "زبون",
    desc: "طلب الطعام وتتبع الطلب وتقييم الخدمة",
    icon: "👤",
    href: "/",
    color: "bg-[#FF7A00]",
    value: "customer",
  },
  {
    title: "سائق",
    desc: "استلام الطلبات وتحديث حالة التوصيل",
    icon: "🛵",
    href: "/driver-app",
    color: "bg-yellow-400",
    value: "driver",
  },
  {
    title: "مطعم",
    desc: "إدارة الطلبات وتحضيرها وتسليمها للسائق",
    icon: "🍽️",
    href: "/restaurant-admin",
    color: "bg-blue-400",
    value: "restaurant",
  },
  {
    title: "مدير",
    desc: "غرفة القيادة والتحليلات والذكاء الاصطناعي",
    icon: "👑",
    href: "/uber-dashboard",
    color: "bg-purple-400",
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
    <main dir="rtl" className="min-h-screen bg-[#050505] px-4 py-8 text-white">
      <section className="mx-auto max-w-md">
        <div className="text-center">
          <img
            src="/images/fuse-logo.png"
            alt="FUSE"
            className="mx-auto h-28 w-28 rounded-3xl object-contain"
          />

          <h1 className="mt-4 text-4xl font-black text-[#FF7A00]">
            دخول FUSE
          </h1>

          <p className="mt-2 text-zinc-400">
            سجل دخولك أو أنشئ حساب جديد
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 rounded-3xl bg-[#121217] p-2">
          <button
            onClick={() => setMode("login")}
            className={`rounded-2xl py-3 font-black ${
              mode === "login" ? "bg-[#FF7A00] text-black" : "text-white"
            }`}
          >
            تسجيل دخول
          </button>

          <button
            onClick={() => setMode("register")}
            className={`rounded-2xl py-3 font-black ${
              mode === "register" ? "bg-[#FF7A00] text-black" : "text-white"
            }`}
          >
            إنشاء حساب
          </button>
        </div>

        <div className="mt-5 rounded-[2rem] border border-white/10 bg-[#111116] p-5">
          <label className="mb-2 block font-black text-zinc-300">الإيميل</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
            className="mb-4 w-full rounded-2xl border border-white/10 bg-[#1A1A20] p-4 text-white outline-none placeholder:text-zinc-600"
          />

          <label className="mb-2 block font-black text-zinc-300">
            كلمة السر
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="اكتب كلمة السر"
            className="mb-4 w-full rounded-2xl border border-white/10 bg-[#1A1A20] p-4 text-white outline-none placeholder:text-zinc-600"
          />

          <label className="mb-2 block font-black text-zinc-300">
            رقم الهاتف
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07701234567"
            className="w-full rounded-2xl border border-white/10 bg-[#1A1A20] p-4 text-white outline-none placeholder:text-zinc-600"
          />

          <button
            onClick={resetPassword}
            disabled={loading}
            className="mt-4 text-sm font-black text-[#FF7A00]"
          >
            نسيت كلمة السر؟
          </button>
        </div>

        <h2 className="mt-6 mb-3 text-xl font-black">اختار نوع الحساب</h2>

        <div className="grid gap-3">
          {roles.map((role) => {
            const active = selectedRole?.title === role.title;

            return (
              <button
                key={role.title}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`rounded-3xl border p-4 text-right transition active:scale-95 ${
                  active
                    ? "border-[#FF7A00] bg-[#FF7A00]/10"
                    : "border-white/10 bg-[#111116]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${role.color}`}
                  >
                    {role.icon}
                  </div>

                  <div>
                    <h3 className="text-xl font-black">{role.title}</h3>
                    <p className="text-sm text-zinc-400">{role.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleAuth}
          disabled={loading}
          className="mt-6 w-full rounded-3xl bg-[#FF7A00] py-4 text-xl font-black text-black disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          {loading
            ? "انتظر..."
            : mode === "login"
            ? "دخول"
            : "إنشاء حساب"}
        </button>

        <Link
          href="/"
          className="mt-4 block rounded-3xl border border-white/10 bg-[#111116] py-4 text-center font-black"
        >
          رجوع للرئيسية
        </Link>
      </section>
    </main>
  );
}