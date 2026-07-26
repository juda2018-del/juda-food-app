"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "../firebase";

export default function DataDeletionPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => onAuthStateChanged(auth, async (currentUser) => {
    setUser(currentUser);
    setReady(true);
    if (!currentUser) return;
    try {
      const requestSnap = await getDoc(doc(db, "accountDeletionRequests", currentUser.uid));
      if (requestSnap.exists()) {
        const data = requestSnap.data();
        setStatus(String(data.status || "pending"));
        setReason(String(data.reason || ""));
      }
    } catch {
      // A missing request is normal.
    }
  }), []);

  async function submitRequest() {
    setError("");
    if (!user) return router.push("/login?next=/data-deletion");
    if (status && status !== "pending") return setError("هذا الطلب مغلق بعد قرار الإدارة. تواصل مع الدعم إذا تحتاج مساعدة إضافية.");
    if (confirmText.trim() !== "حذف حسابي") return setError('اكتب عبارة "حذف حسابي" للتأكيد.');
    if (reason.trim().length > 500) return setError("سبب الحذف طويل جداً.");

    setSaving(true);
    try {
      await setDoc(doc(db, "accountDeletionRequests", user.uid), {
        userUid: user.uid,
        email: user.email || "",
        reason: reason.trim(),
        status: "pending",
        requestedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: Boolean(status) });
      setStatus("pending");
      setConfirmText("");
    } catch {
      setError("تعذر إرسال الطلب. تأكد من اتصال الإنترنت وحاول مرة ثانية.");
    } finally {
      setSaving(false);
    }
  }

  const closed = status === "completed" || status === "rejected";

  return (
    <main dir="rtl" style={{minHeight:"100dvh",background:"linear-gradient(180deg,#fff7f7,#fff)",fontFamily:'Arial,"Cairo",sans-serif',padding:"18px 16px 60px",color:"#171717"}}>
      <section style={{width:"100%",maxWidth:430,margin:"0 auto"}}>
        <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <Link href="/profile" style={{width:44,height:44,borderRadius:16,background:"#fff",display:"grid",placeItems:"center",textDecoration:"none",color:"#171717",fontSize:28,boxShadow:"0 10px 26px rgba(0,0,0,.08)"}}>‹</Link>
          <div style={{textAlign:"center"}}><h1 style={{margin:0,fontSize:23}}>حذف الحساب</h1><p style={{margin:"4px 0 0",fontSize:12,color:"#777"}}>طلب حذف الحساب والبيانات</p></div>
          <div style={{width:44}} />
        </header>

        {!ready ? <div style={{padding:20,borderRadius:20,background:"#fff"}}>جاري التحقق من الحساب...</div> : null}

        {ready && !user ? (
          <section style={{background:"#fff",borderRadius:26,padding:22,boxShadow:"0 12px 32px rgba(0,0,0,.07)",textAlign:"center"}}>
            <h2 style={{margin:"0 0 8px"}}>سجّل دخولك أولاً</h2>
            <p style={{color:"#777",lineHeight:1.8}}>طلب الحذف لازم يكون مربوطاً بالحساب الصحيح.</p>
            <Link href="/login?next=/data-deletion" style={{display:"inline-block",marginTop:10,padding:"12px 18px",borderRadius:14,background:"#171717",color:"#fff",textDecoration:"none",fontWeight:900}}>تسجيل الدخول</Link>
          </section>
        ) : null}

        {user ? (
          <>
            <section style={{background:"#fff1f2",border:"1px solid #fecdd3",borderRadius:25,padding:20}}>
              <h2 style={{margin:"0 0 8px",color:"#be123c",fontSize:19}}>تنبيه مهم</h2>
              <p style={{margin:0,color:"#6b2538",lineHeight:1.9,fontSize:13}}>إرسال الطلب لا يحذف الحساب فوراً. تتم مراجعته لحماية الحساب والتأكد من عدم وجود طلبات نشطة أو التزامات معلقة. بعد المعالجة تُحذف بيانات الحساب وفق سياسة الخصوصية والمتطلبات القانونية.</p>
            </section>

            {status ? (
              <section style={{marginTop:14,background:"#fff",borderRadius:22,padding:18,boxShadow:"0 10px 28px rgba(0,0,0,.06)"}}>
                <b>حالة طلبك: </b><span style={{color:status === "completed" ? "#15803d" : status === "rejected" ? "#b91c1c" : "#d97706",fontWeight:900}}>{status === "completed" ? "مكتمل" : status === "rejected" ? "مرفوض" : "قيد المراجعة"}</span>
                {closed ? <p style={{margin:"9px 0 0",color:"#777",fontSize:12,lineHeight:1.7}}>تم إغلاق الطلب بعد قرار الإدارة. للاستفسار أو الاعتراض استخدم صفحة الدعم.</p> : null}
              </section>
            ) : null}

            <section style={{marginTop:14,background:"#fff",borderRadius:26,padding:20,boxShadow:"0 12px 32px rgba(0,0,0,.07)"}}>
              <label style={{display:"block",fontWeight:900,fontSize:13,marginBottom:7}}>البريد المرتبط</label>
              <div dir="ltr" style={{padding:"13px 14px",borderRadius:14,background:"#f7f7f7",fontSize:13,overflowWrap:"anywhere"}}>{user.email || "بدون بريد"}</div>

              <label style={{display:"block",fontWeight:900,fontSize:13,margin:"16px 0 7px"}}>سبب الحذف — اختياري</label>
              <textarea disabled={closed} value={reason} onChange={(e)=>setReason(e.target.value)} maxLength={500} placeholder="اكتب السبب حتى نطوّر الخدمة" style={{width:"100%",minHeight:110,border:"1px solid #ddd",borderRadius:16,padding:13,fontFamily:"inherit",resize:"vertical",opacity:closed?.65:1}} />

              {!closed ? <>
                <label style={{display:"block",fontWeight:900,fontSize:13,margin:"16px 0 7px"}}>للتأكيد اكتب: حذف حسابي</label>
                <input value={confirmText} onChange={(e)=>setConfirmText(e.target.value)} placeholder="حذف حسابي" style={{width:"100%",height:50,border:"1px solid #ddd",borderRadius:15,padding:"0 13px",fontFamily:"inherit"}} />
              </> : null}

              {error ? <p style={{background:"#fff1f2",color:"#b91c1c",padding:12,borderRadius:14,fontSize:13,fontWeight:800}}>{error}</p> : null}
              {closed ? <Link href="/support" style={{width:"100%",height:52,borderRadius:16,background:"#171717",color:"#fff",fontWeight:900,fontSize:14,textDecoration:"none",display:"grid",placeItems:"center"}}>التواصل مع الدعم</Link> : <button type="button" disabled={saving} onClick={submitRequest} style={{width:"100%",height:52,border:0,borderRadius:16,background:saving?"#aaa":"#dc2626",color:"#fff",fontFamily:"inherit",fontWeight:900,fontSize:14,cursor:saving?"default":"pointer"}}>{saving ? "جاري الإرسال..." : status === "pending" ? "تحديث سبب طلب الحذف" : "إرسال طلب الحذف"}</button>}
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}
