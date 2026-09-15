"use client";

import { useState } from "react";
import {
  FUSE_REDDIT_ENGLISH_INVITE,
  FUSE_TELEGRAM_INVITE,
  FUSE_TESTER_FEEDBACK_EMAIL,
  FUSE_WHATSAPP_INVITE,
} from "@/lib/fuse-beta-recruit";

type CopyKey = "whatsapp" | "telegram" | "english";

const COPY_MAP: Record<CopyKey, string> = {
  whatsapp: FUSE_WHATSAPP_INVITE,
  telegram: FUSE_TELEGRAM_INVITE,
  english: FUSE_REDDIT_ENGLISH_INVITE,
};

export default function BetaRecruitClient() {
  const [copied, setCopied] = useState<CopyKey | null>(null);
  const [nickname, setNickname] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [sentHint, setSentHint] = useState(false);

  async function copyText(key: CopyKey) {
    const text = COPY_MAP[key];
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 2200);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 2200);
    }
  }

  function sendJoinedMail() {
    if (!confirmed) return;
    const name = nickname.trim() || "مختبر";
    const subject = encodeURIComponent("FUSE closed test — انضممت للاختبار");
    const body = encodeURIComponent(
      `الاسم/الكنية (اختياري): ${name}\n\nأؤكد أني انضممت للاختبار المغلق لتطبيق FUSE عبر الرابط الرسمي من Google Play، وسأستخدم التطبيق وأرسل ملاحظات صادقة.\n\nلا أرسل كلمة مرور أو بيانات حساسة.`
    );
    window.location.href = `mailto:${FUSE_TESTER_FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
    setSentHint(true);
  }

  return (
    <>
      <section className="beta-card">
        <h2>نصوص جاهزة للنسخ</h2>
        <p className="beta-muted">انسخ والصق يدوياً. لا يتم النشر التلقائي من هذه الصفحة.</p>
        <div className="beta-copy-grid">
          <button type="button" className="beta-copy-btn" onClick={() => copyText("whatsapp")}>
            {copied === "whatsapp" ? "تم النسخ ✓" : "نسخ رسالة واتساب"}
          </button>
          <button type="button" className="beta-copy-btn" onClick={() => copyText("telegram")}>
            {copied === "telegram" ? "تم النسخ ✓" : "نسخ رسالة تيليجرام"}
          </button>
          <button type="button" className="beta-copy-btn" onClick={() => copyText("english")}>
            {copied === "english" ? "Copied ✓" : "Copy English / Reddit message"}
          </button>
        </div>
        <details className="beta-details">
          <summary>معاينة النص العربي (واتساب)</summary>
          <pre className="beta-pre" dir="rtl">{FUSE_WHATSAPP_INVITE}</pre>
        </details>
        <details className="beta-details">
          <summary>Preview English / Reddit</summary>
          <pre className="beta-pre" dir="ltr">{FUSE_REDDIT_ENGLISH_INVITE}</pre>
        </details>
      </section>

      <section className="beta-card">
        <h2>تأكيد انضمام اختياري</h2>
        <p className="beta-muted">
          لا نطلب كلمة مرور Google ولا بيانات دفع. الاسم اختياري فقط لإعلام الدعم بأنك انضممت.
        </p>
        <label className="beta-label" htmlFor="beta-nick">
          اسم أو كنية (اختياري)
        </label>
        <input
          id="beta-nick"
          className="beta-input"
          type="text"
          maxLength={40}
          autoComplete="nickname"
          placeholder="مثلاً: أحمد"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <label className="beta-check">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <span>أؤكد أني انضممت عبر رابط Google Play الرسمي وسأقدّم ملاحظات صادقة.</span>
        </label>
        <button
          type="button"
          className="beta-secondary-btn"
          disabled={!confirmed}
          onClick={sendJoinedMail}
        >
          إرسال تأكيد بالبريد إلى الدعم
        </button>
        {sentHint ? (
          <p className="beta-ok">سيُفتح تطبيق البريد لإرسال رسالة إلى {FUSE_TESTER_FEEDBACK_EMAIL}.</p>
        ) : null}
      </section>
    </>
  );
}
