"use client";

import Link from "next/link";

export default function SupportPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');

        *{
          box-sizing:border-box;
        }

        body{
          margin:0;
          background:#efe8df;
          font-family:"Cairo",sans-serif;
        }

        .app{
          width:100%;
          max-width:430px;
          min-height:100vh;
          margin:0 auto;
          padding:18px 18px 95px;
          direction:rtl;
          background:linear-gradient(180deg,#fffaf4 0%,#fff 100%);
          color:#151515;
        }

        .top{
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:22px;
        }

        .back{
          width:44px;
          height:44px;
          border-radius:16px;
          background:white;
          text-decoration:none;
          color:#151515;
          display:grid;
          place-items:center;
          font-size:26px;
          font-weight:900;
          box-shadow:0 12px 28px rgba(0,0,0,.07);
        }

        .title{
          text-align:center;
        }

        .title h1{
          margin:0;
          font-size:28px;
          font-weight:900;
        }

        .title p{
          margin:4px 0 0;
          color:#888;
          font-size:13px;
          font-weight:800;
        }

        .hero{
          background:linear-gradient(135deg,#ff4d00,#ff8a00);
          color:white;
          border-radius:30px;
          padding:22px;
          margin-bottom:18px;
          box-shadow:0 18px 42px rgba(255,77,0,.22);
        }

        .hero h2{
          margin:0;
          font-size:24px;
          font-weight:900;
        }

        .hero p{
          margin:8px 0 0;
          color:rgba(255,255,255,.92);
          font-size:13px;
          line-height:1.8;
          font-weight:800;
        }

        .cards{
          display:flex;
          flex-direction:column;
          gap:14px;
        }

        .card{
          background:white;
          border-radius:26px;
          padding:16px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          text-decoration:none;
          color:#151515;
          box-shadow:0 14px 34px rgba(0,0,0,.08);
        }

        .left{
          display:flex;
          align-items:center;
          gap:14px;
        }

        .icon{
          width:58px;
          height:58px;
          border-radius:20px;
          background:#fff3e9;
          color:#ff4d00;
          display:grid;
          place-items:center;
          font-size:28px;
        }

        .card h3{
          margin:0;
          font-size:18px;
          font-weight:900;
        }

        .card p{
          margin:4px 0 0;
          color:#777;
          font-size:12px;
          font-weight:800;
        }

        .arrow{
          color:#ff4d00;
          font-size:22px;
          font-weight:900;
        }

        .footer{
          margin-top:22px;
          background:#151515;
          color:white;
          border-radius:28px;
          padding:18px;
          text-align:center;
        }

        .footer h3{
          margin:0;
          font-size:18px;
          font-weight:900;
        }

        .footer p{
          margin:8px 0 0;
          color:#ddd;
          font-size:13px;
          line-height:1.8;
          font-weight:800;
        }
      `}</style>

      <main className="app">

        <header className="top">
          <Link href="/profile" className="back">
            ‹
          </Link>

          <div className="title">
            <h1>الدعم والمساعدة</h1>
            <p>فريق FUSE بخدمتك دائماً</p>
          </div>

          <div style={{ width: 44 }} />
        </header>

        <section className="hero">
          <h2>🎧 مركز الدعم</h2>

          <p>
            إذا واجهتك أي مشكلة بالطلب أو التوصيل أو الحساب،
            فريق فيوز جاهز لمساعدتك.
          </p>
        </section>

        <section className="cards">

          <a
            href="https://wa.me/9647733778077"
            target="_blank"
            className="card"
          >
            <div className="left">
              <div className="icon">💬</div>

              <div>
                <h3>واتساب</h3>
                <p>تواصل مباشر مع فريق الدعم</p>
              </div>
            </div>

            <div className="arrow">‹</div>
          </a>

          <a
            href="tel:07733778077"
            className="card"
          >
            <div className="left">
              <div className="icon">📞</div>

              <div>
                <h3>اتصال هاتفي</h3>
                <p>اتصل بخدمة العملاء</p>
              </div>
            </div>

            <div className="arrow">‹</div>
          </a>

          <Link
            href="/notifications"
            className="card"
          >
            <div className="left">
              <div className="icon">🔔</div>

              <div>
                <h3>الإشعارات</h3>
                <p>متابعة التنبيهات المهمة</p>
              </div>
            </div>

            <div className="arrow">‹</div>
          </Link>

        </section>

        <section className="footer">
          <h3>FUSE Support</h3>

          <p>
            نعمل باستمرار لتقديم أفضل تجربة طلب وتوصيل
            داخل العراق.
          </p>
        </section>

      </main>
    </>
  );
}