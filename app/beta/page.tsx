import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BetaRecruitClient from "./BetaRecruitClient";
import {
  FUSE_CLOSED_TEST_URL,
  FUSE_IRAQI_SOURCES_ASK_FIRST,
  FUSE_RECRUIT_SOURCES,
  FUSE_TESTER_FEEDBACK_EMAIL,
} from "@/lib/fuse-beta-recruit";
import "./beta.css";

export const metadata: Metadata = {
  title: "اختبار بيتا | مختبرون حقيقيون",
  description:
    "انضم لاختبار FUSE Iraq المغلق على Google Play — مستخدمون أندرويد حقيقيون فقط، بدون حسابات وهمية.",
  robots: {
    index: true,
    follow: true,
  },
};

const steps = [
  "افتح رابط الاختبار الرسمي من Google Play وانضم بحساب Google الحقيقي.",
  "ثبّت تطبيق FUSE من صفحة الاختبار.",
  "افتح التطبيق واستخدمه بشكل طبيعي (تصفح، طلب تجريبي إن أمكن).",
  "أرسل ملاحظات صادقة عن الأخطاء أو تجربة الاستخدام.",
  "ابقَ منضمّاً للاختبار طوال الفترة المطلوبة (يفضّل 14 يوماً متواصلاً).",
];

export default function BetaRecruitPage() {
  return (
    <main dir="rtl" className="app beta-page" lang="ar">
      <header className="beta-brand">
        <Image
          src="/images/fuse-logo.png"
          alt="شعار FUSE"
          width={52}
          height={52}
          priority
        />
        <div>
          <strong>FUSE Iraq</strong>
          <span>اختبار مغلق على Google Play</span>
        </div>
      </header>

      <section className="beta-hero">
        <h1>نحتاج مختبرين حقيقيين لتطبيق FUSE</h1>
        <p>
          FUSE تطبيق توصيل طعام في بغداد. قبل الإطلاق العلني نحتاج مستخدمين أندرويد حقيقيين
          يختبرون الإصدار المغلق ويعطوننا ملاحظات صادقة — بدون حسابات وهمية وبدون تثبيت اصطناعي.
        </p>
      </section>

      <section className="beta-card">
        <p className="beta-note">
          <strong>مهم</strong>
          نريد مختبرين حقيقيين وملاحظات حقيقية فقط. لا نطلب كلمة مرور Google، ولا ندفع مقابل
          تثبيتات وهمية، ولا نقبل مزارع الحسابات أو البوتات.
        </p>
      </section>

      <section className="beta-card">
        <h2>المتطلبات</h2>
        <ul className="beta-req">
          <li>جهاز أندرويد حقيقي</li>
          <li>حساب Google حقيقي على نفس الجهاز</li>
          <li>الانضمام عبر رابط Google Play الرسمي فقط</li>
          <li>الاستعداد للبقاء منضمّاً خلال فترة الاختبار</li>
        </ul>
      </section>

      <section className="beta-card">
        <h2>خطوات الانضمام</h2>
        <ol className="beta-steps">
          {steps.map((step, index) => (
            <li key={step}>
              <b>{index + 1}</b>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="beta-card">
        <h2>الرابط الرسمي للاختبار</h2>
        <a
          className="beta-cta"
          href={FUSE_CLOSED_TEST_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          الانضمام لاختبار Google Play
        </a>
        <div className="beta-link-box">{FUSE_CLOSED_TEST_URL}</div>
        <div className="beta-qr-wrap">
          <Image
            src="/images/fuse-closed-test-qr.png"
            alt="رمز QR لرابط اختبار FUSE على Google Play"
            width={220}
            height={220}
            unoptimized
          />
          <p className="beta-muted" style={{ margin: 0, textAlign: "center" }}>
            امسح الرمز لفتح رابط الاختبار الرسمي فقط
          </p>
        </div>
      </section>

      <BetaRecruitClient />

      <section className="beta-card">
        <h2>مصادر تجنيد عالمية (روابط جاهزة)</h2>
        <p className="beta-warn">
          انشر يدوياً. لا يتم إرسال أي منشور تلقائي من هذه الصفحة.
        </p>
        <div className="beta-sources">
          {FUSE_RECRUIT_SOURCES.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <strong>{source.name}</strong>
              <span>{source.note}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="beta-card">
        <h2>مصادر عراقية — اطلب إذن الإدارة أولاً</h2>
        <p className="beta-warn">لا تنشر تلقائياً. اسأل المشرفين قبل أي منشور تجنيد.</p>
        <div className="beta-sources">
          {FUSE_IRAQI_SOURCES_ASK_FIRST.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <strong>{source.name}</strong>
              <span dir="ltr">{source.url}</span>
            </a>
          ))}
        </div>
      </section>

      <p className="beta-footer">
        ملاحظات الاختبار:{" "}
        <a href={`mailto:${FUSE_TESTER_FEEDBACK_EMAIL}`}>{FUSE_TESTER_FEEDBACK_EMAIL}</a>
        <br />
        <Link href="/privacy">الخصوصية</Link>
        {" · "}
        <Link href="/support">الدعم</Link>
        {" · "}
        <Link href="/">الرئيسية</Link>
      </p>
    </main>
  );
}
