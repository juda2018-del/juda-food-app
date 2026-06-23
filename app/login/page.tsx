"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login() {
    try {
      if (!email || !password) return alert("اكتب الإيميل والباسورد");

      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      router.push("/profile");
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function googleLogin() {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/profile");
    } catch (error: any) {
      alert(error.message);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');

        *{box-sizing:border-box}
        body{margin:0;font-family:"Cairo",sans-serif;background:#efe8df}

        .app{
          max-width:430px;
          min-height:100vh;
          margin:0 auto;
          padding:24px 18px;
          direction:rtl;
          background:linear-gradient(180deg,#fffaf4,#fff);
          color:#151515;
        }

        .hero{
          margin-top:40px;
          border-radius:32px;
          padding:28px;
          background:linear-gradient(135deg,#ff4d00,#ff8a00);
          color:white;
          box-shadow:0 18px 42px rgba(255,77,0,.25);
        }

        .hero h1{
          margin:0;
          font-size:36px;
          font-weight:900;
        }

        .hero p{
          margin:8px 0 0;
          font-weight:800;
          color:rgba(255,255,255,.9);
        }

        .card{
          margin-top:22px;
          background:white;
          border-radius:30px;
          padding:20px;
          box-shadow:0 14px 34px rgba(0,0,0,.08);
        }

        input{
          width:100%;
          border:0;
          outline:none;
          border-radius:18px;
          background:#f8f3ee;
          padding:15px;
          margin-bottom:12px;
          font-family:inherit;
          font-weight:800;
        }

        button{
          width:100%;
          border:0;
          border-radius:20px;
          padding:15px;
          font-family:inherit;
          font-weight:900;
          margin-top:10px;
        }

        .main{
          background:#ff4d00;
          color:white;
        }

        .google{
          background:#151515;
          color:white;
        }

        .switch{
          background:#fff3e9;
          color:#ff4d00;
        }
      `}</style>

      <main className="app">
        <section className="hero">
          <h1>FUSE</h1>
          <p>{isRegister ? "إنشاء حساب جديد" : "تسجيل الدخول لحسابك"}</p>
        </section>

        <section className="card">
          <input
            type="email"
            placeholder="الإيميل"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="main" onClick={login}>
            {isRegister ? "إنشاء حساب" : "دخول"}
          </button>

          <button className="google" onClick={googleLogin}>
            الدخول بواسطة Google
          </button>

          <button className="switch" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "عندي حساب بالفعل" : "إنشاء حساب جديد"}
          </button>
        </section>
      </main>
    </>
  );
}