"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { db, storage } from "../firebase";
import {
  FUSE_LOCAL_SESSION,
  parseFuseRole,
  roleHome,
  type FuseSession,
} from "@/lib/fuse-auth";

type ReelDoc = {
  documentId: string;
  title?: string;
  restaurant?: string;
  restaurantName?: string;
  status?: string;
  videoUrl?: string;
  submittedBy?: string;
  submittedByUid?: string;
  createdAt?: unknown;
};

function readSession(): FuseSession | null {
  try {
    const raw = localStorage.getItem(FUSE_LOCAL_SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FuseSession;
    const role = parseFuseRole(parsed.role);
    if (!parsed.email || !role) return null;
    return { ...parsed, role };
  } catch {
    return null;
  }
}

function statusLabel(status?: string) {
  if (status === "approved") return "مقبول ومنشور";
  if (status === "rejected") return "مرفوض";
  return "بانتظار المراجعة";
}

export default function RestaurantReelsPage() {
  const [session, setSession] = useState<FuseSession | null>(null);
  const [reels, setReels] = useState<ReelDoc[]>([]);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [offer, setOffer] = useState("");
  const [menuItem, setMenuItem] = useState("");
  const [price, setPrice] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = readSession();
    if (!saved) {
      window.location.href = "/login?next=/restaurant-reels";
      return;
    }
    if (saved.role !== "restaurant" && saved.role !== "admin" && saved.role !== "customer") {
      window.location.href = roleHome[saved.role] || "/login";
      return;
    }
    setSession(saved);
  }, []);

  const isCustomer = session?.role === "customer";
  const creatorName = useMemo(
    () => session?.name || session?.displayName || (isCustomer ? "زبون FUSE" : "مطعم FUSE"),
    [isCustomer, session]
  );
  const restaurantName = useMemo(
    () => isCustomer
      ? "مجتمع FUSE"
      : session?.restaurantName || session?.restaurant || session?.name || "مطعم FUSE",
    [isCustomer, session]
  );

  useEffect(() => {
    if (!session) return;
    const ownQuery = session.role === "admin"
      ? query(collection(db, "reels"))
      : query(collection(db, "reels"), where("submittedByUid", "==", session.uid));
    return onSnapshot(ownQuery, (snapshot) => {
      const own = snapshot.docs
        .map((item) => ({
          ...(item.data() as Omit<ReelDoc, "documentId">),
          documentId: item.id,
        }))
        .filter((item) => {
          if (session.role === "admin") return true;
          return item.submittedByUid === session.uid;
        });
      setReels(own);
    });
  }, [restaurantName, session]);

  async function uploadVideo(selected: File) {
    if (selected.size > 80 * 1024 * 1024) {
      throw new Error("حجم الفيديو أكبر من 80MB.");
    }
    const safeName = selected.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const storageRef = ref(storage, `reels/${session?.uid || "restaurant"}/${Date.now()}-${safeName}`);
    const task = uploadBytesResumable(storageRef, selected, { contentType: selected.type || "video/mp4" });
    return new Promise<string>((resolve, reject) => {
      task.on(
        "state_changed",
        (snapshot) => setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
        reject,
        async () => resolve(await getDownloadURL(task.snapshot.ref))
      );
    });
  }

  async function submitReel(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return setMessage("اكتب عنوان الريل.");
    if (!file && !videoUrl.trim()) return setMessage("اختر فيديو من الهاتف أو ضع رابط الفيديو.");

    setBusy(true);
    setMessage("");
    setProgress(0);
    try {
      const finalVideoUrl = file ? await uploadVideo(file) : videoUrl.trim();
      await addDoc(collection(db, "reels"), {
        title: title.trim(),
        caption: caption.trim(),
        offer: offer.trim(),
        menuItem: menuItem.trim(),
        price: Number(price || 0),
        videoUrl: finalVideoUrl,
        restaurant: restaurantName,
        restaurantName,
        restaurantId: session?.restaurantId || "",
        submittedBy: session?.email || "",
        submittedByUid: session?.uid || "",
        submittedByName: creatorName,
        submitterType: isCustomer ? "customer" : "restaurant",
        status: "pending",
        approved: false,
        active: false,
        createdAt: serverTimestamp(),
      });
      setTitle("");
      setCaption("");
      setOffer("");
      setMenuItem("");
      setPrice("");
      setVideoUrl("");
      setFile(null);
      setProgress(0);
      setMessage("تم إرسال الريل للإدارة. ما راح يظهر للزبائن إلا بعد الموافقة.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر إرسال الريل.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main dir="rtl" className="page">
      <section className="shell">
        <header>
          <div><small>FUSE Reels</small><h1>نشر ريل جديد</h1></div>
          <Link href={isCustomer ? "/reels" : "/restaurant-admin"}>رجوع</Link>
        </header>

        <section className="hero">
          <p>{isCustomer ? "حساب الزبون" : "المطعم"}</p>
          <h2>{isCustomer ? creatorName : restaurantName}</h2>
          <span>كل ريل يروح أولاً إلى مراجعة إدارة FUSE.</span>
        </section>

        <form className="panel" onSubmit={submitReel}>
          <label>عنوان الريل<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: وجبة اليوم وصلت حارة" /></label>
          <label>الوصف<textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="اكتب وصفاً مختصراً وجذاباً" /></label>
          {!isCustomer ? (
            <div className="grid">
              <label>العرض<input value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="خصم 20%" /></label>
              <label>اسم الوجبة<input value={menuItem} onChange={(e) => setMenuItem(e.target.value)} placeholder="برغر دبل" /></label>
              <label>السعر<input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" placeholder="7500" /></label>
            </div>
          ) : null}
          <label className="upload">
            <b>{file ? file.name : "اختر فيديو من الهاتف"}</b>
            <span>MP4 أو MOV — الحد الأعلى 80MB</span>
            <input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <div className="or">أو</div>
          <label>رابط فيديو مباشر<input dir="ltr" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." /></label>
          {busy && file ? <div className="progress"><i style={{ width: `${progress}%` }} /><span>{progress}%</span></div> : null}
          {message ? <p className="message">{message}</p> : null}
          <button disabled={busy}>{busy ? "جاري الإرسال..." : "إرسال للمراجعة"}</button>
        </form>

        <section className="panel">
          <div className="head"><h2>{isCustomer ? "ريلز حسابي" : "ريلز المطعم"}</h2><b>{reels.length}</b></div>
          <div className="list">
            {reels.map((reel) => (
              <article key={reel.documentId}>
                <video src={reel.videoUrl} muted playsInline preload="metadata" />
                <div><h3>{reel.title || "ريل"}</h3><p>{statusLabel(reel.status)}</p></div>
                <span className={`status ${reel.status || "pending"}`}>{statusLabel(reel.status)}</span>
              </article>
            ))}
            {!reels.length ? <div className="empty">بعد ما أرسلت أي ريل.</div> : null}
          </div>
        </section>
      </section>

      <style jsx>{`
        *{box-sizing:border-box}.page{min-height:100vh;background:radial-gradient(circle at top right,rgba(255,122,0,.18),transparent 32%),#050505;color:#fff;padding:20px 12px;font-family:Arial,sans-serif}.shell{max-width:860px;margin:auto}header{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px}header small,.hero p{color:#ff7a00;font-weight:950}header h1,.hero h2{margin:5px 0 0}header a{color:#fff;text-decoration:none;border:1px solid #333;background:#151515;border-radius:999px;padding:12px 16px;font-weight:900}.hero,.panel{border:1px solid #332c27;background:rgba(20,17,15,.95);border-radius:28px;padding:20px;margin-bottom:16px}.hero span{color:#aaa}.panel{display:grid;gap:13px}label{display:grid;gap:7px;color:#ddd;font-weight:900}input,textarea{width:100%;border:1px solid #37322f;background:#050505;color:#fff;border-radius:16px;padding:14px;font:inherit}textarea{min-height:100px;resize:vertical}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.upload{position:relative;text-align:center;border:1px dashed #ff7a00;background:rgba(255,122,0,.08);border-radius:20px;padding:24px;cursor:pointer}.upload span{color:#999;font-size:12px}.upload input{position:absolute;inset:0;opacity:0;cursor:pointer}.or{text-align:center;color:#777;font-weight:900}.panel>button{border:0;border-radius:17px;padding:16px;background:#ff7a00;color:#080808;font-size:17px;font-weight:950}.panel>button:disabled{opacity:.55}.message{margin:0;text-align:center;color:#ffbd78;font-weight:900}.progress{height:20px;background:#080808;border-radius:999px;overflow:hidden;position:relative}.progress i{display:block;height:100%;background:#ff7a00}.progress span{position:absolute;inset:0;display:grid;place-items:center;font-size:11px;font-weight:900}.head{display:flex;justify-content:space-between;align-items:center}.head h2{margin:0}.head b{background:#ff7a00;color:#050505;border-radius:12px;padding:8px 11px}.list{display:grid;gap:10px}.list article{display:grid;grid-template-columns:74px 1fr auto;gap:12px;align-items:center;border:1px solid #302b28;background:#080808;border-radius:18px;padding:10px}.list video{width:74px;height:96px;object-fit:cover;border-radius:13px;background:#111}.list h3{margin:0}.list p{margin:6px 0 0;color:#999}.status{border-radius:999px;padding:8px 10px;font-size:11px;font-weight:950}.pending{background:#3b2b08;color:#ffd36b}.approved{background:#11391f;color:#8dffad}.rejected{background:#401616;color:#ff9e9e}.empty{text-align:center;padding:24px;color:#888}@media(max-width:640px){.grid{grid-template-columns:1fr}header{align-items:flex-start}.list article{grid-template-columns:62px 1fr}.list video{width:62px;height:82px}.status{grid-column:2}}
      `}</style>
    </main>
  );
}
