"use client";

import { useMemo, useState } from "react";

type OrderStatus =
  | "جديد"
  | "قيد التحضير"
  | "جاهز للتوصيل"
  | "السائق استلم الطلب"
  | "السائق بالطريق"
  | "تم التسليم";

type Step = {
  title: OrderStatus;
  icon: string;
  desc: string;
};

const steps: Step[] = [
  { title: "جديد", icon: "🧾", desc: "تم استلام طلبك بنجاح" },
  { title: "قيد التحضير", icon: "👨‍🍳", desc: "المطعم يحضر الطلب" },
  { title: "جاهز للتوصيل", icon: "✅", desc: "الطلب جاهز وينتظر السائق" },
  { title: "السائق استلم الطلب", icon: "🛵", desc: "السائق استلم الطلب من المطعم" },
  { title: "السائق بالطريق", icon: "📍", desc: "السائق قريب منك" },
  { title: "تم التسليم", icon: "🎉", desc: "تم تسليم الطلب بنجاح" },
];

export default function OrderStatusPage() {
  const [status] = useState<OrderStatus>("السائق بالطريق");

  const activeIndex = useMemo(
    () => steps.findIndex((step) => step.title === status),
    [status]
  );

  const progressPercent = Math.round(((activeIndex + 1) / steps.length) * 100);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; }

        body {
          margin: 0;
          font-family: "Cairo", sans-serif;
          background: #efe8df;
        }

        .app {
          width: 100%;
          max-width: 430px;
          min-height: 100vh;
          margin: 0 auto;
          direction: rtl;
          padding: 18px 18px 32px;
          background: linear-gradient(180deg, #fffaf4 0%, #ffffff 100%);
          color: #151515;
        }

        .top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }

        .back {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          background: white;
          color: #151515;
          text-decoration: none;
          display: grid;
          place-items: center;
          font-size: 26px;
          font-weight: 900;
          box-shadow: 0 12px 28px rgba(0,0,0,.07);
        }

        .title {
          text-align: center;
        }

        .title h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 900;
        }

        .title p {
          margin: 4px 0 0;
          color: #888;
          font-size: 13px;
          font-weight: 800;
        }

        .card {
          background: white;
          border-radius: 28px;
          padding: 18px;
          box-shadow: 0 14px 34px rgba(0,0,0,.07);
          margin-bottom: 16px;
        }

        .order-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .muted {
          color: #888;
          font-size: 12px;
          font-weight: 800;
        }

        .order-id {
          margin: 4px 0 0;
          font-size: 22px;
          font-weight: 900;
        }

        .badge {
          background: #ff4d00;
          color: white;
          padding: 10px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
          box-shadow: 0 12px 26px rgba(255,77,0,.22);
        }

        .progress-wrap {
          margin-top: 22px;
        }

        .progress-text {
          display: flex;
          justify-content: space-between;
          color: #777;
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 8px;
        }

        .progress {
          height: 12px;
          background: #f1e9e0;
          border-radius: 99px;
          overflow: hidden;
        }

        .bar {
          height: 100%;
          background: linear-gradient(90deg, #ff4d00, #ff8a00);
          border-radius: 99px;
          transition: .4s;
        }

        .steps {
          margin-top: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .step {
          display: grid;
          grid-template-columns: 52px 1fr;
          gap: 12px;
          padding: 13px;
          border-radius: 22px;
          background: #f8f3ee;
          border: 1px solid transparent;
        }

        .step.done {
          background: #fff3e9;
        }

        .step.active {
          background: #151515;
          color: white;
          border-color: #ff4d00;
          box-shadow: 0 14px 30px rgba(0,0,0,.16);
        }

        .icon {
          width: 52px;
          height: 52px;
          border-radius: 18px;
          background: white;
          display: grid;
          place-items: center;
          font-size: 24px;
          box-shadow: 0 10px 22px rgba(0,0,0,.06);
        }

        .step.active .icon {
          background: #ff4d00;
        }

        .step h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 900;
        }

        .step p {
          margin: 4px 0 0;
          color: #777;
          font-size: 12px;
          font-weight: 800;
        }

        .step.active p {
          color: #ddd;
        }

        .driver-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 12px;
        }

        .info {
          background: #f8f3ee;
          border-radius: 20px;
          padding: 13px;
        }

        .info h3 {
          margin: 4px 0 0;
          font-size: 16px;
          font-weight: 900;
        }

        .actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 12px;
        }

        .action {
          text-decoration: none;
          text-align: center;
          border-radius: 18px;
          padding: 13px;
          font-weight: 900;
          color: white;
        }

        .call { background: #151515; }
        .whatsapp { background: #ff4d00; }

        .map {
          height: 190px;
          border-radius: 24px;
          background:
            radial-gradient(circle at 40% 45%, rgba(255,77,0,.18), transparent 24%),
            linear-gradient(135deg, #f8f3ee, #ffffff);
          display: grid;
          place-items: center;
          text-align: center;
          color: #777;
          font-weight: 900;
          margin-top: 12px;
          border: 1px solid #f1e9e0;
        }

        .map div:first-child {
          font-size: 45px;
          margin-bottom: 8px;
        }
      `}</style>

      <main className="app">
        <header className="top">
          <a className="back" href="/">‹</a>

          <div className="title">
            <h1>تتبع الطلب</h1>
            <p>تابع طلبك لحظة بلحظة</p>
          </div>

          <div style={{ width: 44 }} />
        </header>

        <section className="card">
          <div className="order-head">
            <div>
              <div className="muted">رقم الطلب</div>
              <div className="order-id">#FUSE-1024</div>
            </div>

            <div className="badge">{status}</div>
          </div>

          <div className="progress-wrap">
            <div className="progress-text">
              <span>تقدم الطلب</span>
              <span>{progressPercent}%</span>
            </div>

            <div className="progress">
              <div className="bar" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="steps">
            {steps.map((step, index) => {
              const isDone = index <= activeIndex;
              const isActive = index === activeIndex;

              return (
                <div
                  key={step.title}
                  className={`step ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}
                >
                  <div className="icon">{step.icon}</div>

                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card">
          <div className="section-title">
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
              معلومات السائق
            </h2>
          </div>

          <div className="driver-grid">
            <div className="info">
              <div className="muted">اسم السائق</div>
              <h3>علي حسن</h3>
            </div>

            <div className="info">
              <div className="muted">الوصول المتوقع</div>
              <h3 style={{ color: "#ff4d00" }}>12 دقيقة</h3>
            </div>
          </div>

          <div className="actions">
            <a className="action call" href="tel:07700000000">اتصال</a>
            <a className="action whatsapp" href="https://wa.me/9647700000000" target="_blank">
              واتساب
            </a>
          </div>
        </section>

        <section className="card">
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
            موقع السائق
          </h2>

          <div className="map">
            <div>
              <div>🗺️</div>
              الخريطة المباشرة نربطها بالمرحلة الجاية
            </div>
          </div>
        </section>
      </main>
    </>
  );
}