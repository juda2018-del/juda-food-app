"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  FUSE_LOCAL_SESSION,
  parseFuseRole,
  roleHome,
  type FuseSession,
} from "@/lib/fuse-auth";

type ReelDoc = {
  documentId: string;
  title?: string;
  caption?: string;
  restaurant?: string;
  restaurantName?: string;
  offer?: string;
  videoUrl?: string;
  status?: string;
  submitterType?: string;
  submittedByName?: string;
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

export default function ReelsReviewPage() {
  const [session, setSession] = useState<FuseSession | null>(null);
  const [reels, setReels] = useState<ReelDoc[]>([]);
  const [filter, setFilter] = useState("pending");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = readSession();
    if (!saved) {
      window.location.href = "/login?next=/reels-review";
      return;
    }
    if (saved.role !== "admin") {
      window.location.href = roleHome[saved.role] || "/login";
      return;
    }
    setSession(saved);
  }, []);

  useEffect(() => onSnapshot(query(collection(db, "reels")), (snapshot) => {
    setReels(snapshot.docs.map((item) => ({
      ...(item.data() as Omit<ReelDoc, "documentId">),
      documentId: item.id,
    })));
  }), []);

  const visible = useMemo(
    () => reels.filter((item) => (item.status || "approved") === filter),
    [filter, reels]
  );

  async function decide(item: ReelDoc, status: "approved" | "rejected") {
    await updateDoc(doc(db, "reels", item.documentId), {
      status,
      approved: status === "approved",
      active: status === "approved",
      reviewedBy: session?.email || "admin@fuse.iq",
      reviewedAt: serverTimestamp(),
    });
    setMessage(status === "approved" ? "تمت الموافقة ونُشر الريل." : "تم رفض الريل ولن يظهر للزبائن.");
    window.setTimeout(() => setMessage(""), 2400);
  }

  return (
    <main dir="rtl" className="page">
      <section className="shell">
        <header>
          <div><small>FUSE ADMIN</small><h1>مراجعة الريلز</h1></div>
          <Link href="/fuse-admin">رجوع للإدارة</Link>
        </header>

        <section className="stats">
          <button className={filter === "pending" ? "active" : ""} onClick={() => setFilter("pending")}>بانتظار المراجعة <b>{reels.filter((r) => r.status === "pending").length}</b></button>
          <button className={filter === "approved" ? "active" : ""} onClick={() => setFilter("approved")}>منشورة <b>{reels.filter((r) => (r.status || "approved") === "approved").length}</b></button>
          <button className={filter === "rejected" ? "active" : ""} onClick={() => setFilter("rejected")}>مرفوضة <b>{reels.filter((r) => r.status === "rejected").length}</b></button>
        </section>

        {message ? <div className="message">{message}</div> : null}

        <section className="list">
          {visible.map((reel) => (
            <article key={reel.documentId}>
              <video src={reel.videoUrl} controls playsInline preload="metadata" />
              <div className="copy">
                <small>
                  {reel.submitterType === "customer"
                    ? `زبون: ${reel.submittedByName || "مجتمع FUSE"}`
                    : reel.restaurantName || reel.restaurant || "مطعم"}
                </small>
                <h2>{reel.title || "ريل بدون عنوان"}</h2>
                <p>{reel.caption || "بدون وصف"}</p>
                {reel.offer ? <span>{reel.offer}</span> : null}
              </div>
              <div className="actions">
                {filter !== "approved" ? <button className="approve" onClick={() => decide(reel, "approved")}>موافقة ونشر</button> : null}
                {filter !== "rejected" ? <button className="reject" onClick={() => decide(reel, "rejected")}>رفض</button> : null}
              </div>
            </article>
          ))}
          {!visible.length ? <div className="empty">ماكو ريلز ضمن هذا القسم.</div> : null}
        </section>
      </section>

      <style jsx>{`
        *{box-sizing:border-box}.page{min-height:100vh;background:radial-gradient(circle at top right,rgba(255,122,0,.16),transparent 32%),#050505;color:#fff;padding:20px 12px;font-family:Arial,sans-serif}.shell{max-width:1100px;margin:auto}header{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px}header small{color:#ff7a00;font-weight:950}header h1{margin:5px 0 0}header a{color:#fff;text-decoration:none;border:1px solid #333;background:#151515;border-radius:999px;padding:12px 16px;font-weight:900}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}.stats button{border:1px solid #38312c;background:#15110f;color:#aaa;border-radius:18px;padding:16px;font-weight:950}.stats button.active{background:#ff7a00;color:#050505;border-color:#ff7a00}.stats b{margin-inline-start:8px}.message{position:sticky;top:8px;z-index:5;background:#153822;color:#9effb8;border-radius:16px;padding:14px;margin-bottom:14px;text-align:center;font-weight:950}.list{display:grid;gap:14px}.list article{display:grid;grid-template-columns:180px 1fr auto;gap:16px;align-items:center;border:1px solid #352f2b;background:rgba(22,18,16,.96);border-radius:25px;padding:14px}.list video{width:180px;height:250px;object-fit:cover;background:#090909;border-radius:18px}.copy small{color:#ff8b24;font-weight:950}.copy h2{margin:8px 0}.copy p{color:#aaa;line-height:1.7}.copy span{display:inline-block;background:rgba(255,122,0,.14);color:#ffad62;border-radius:999px;padding:8px 11px;font-weight:900}.actions{display:grid;gap:9px}.actions button{border:0;border-radius:14px;padding:13px 16px;font-weight:950}.approve{background:#27d46f;color:#06140b}.reject{background:#4a1717;color:#ffaaaa}.empty{text-align:center;border:1px dashed #333;border-radius:24px;padding:34px;color:#888}@media(max-width:720px){.stats{grid-template-columns:1fr}.list article{grid-template-columns:100px 1fr}.list video{width:100px;height:150px}.actions{grid-column:1/-1;grid-template-columns:1fr 1fr}}
      `}</style>
    </main>
  );
}
