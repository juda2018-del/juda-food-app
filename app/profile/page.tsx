 "use client";

import Link from "next/link";

export default function ProfilePage() {
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
          padding: 18px 18px 96px;
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

        .hero {
          background: linear-gradient(135deg, #ff4d00, #ff8a00);
          border-radius: 30px;
          padding: 20px;
          color: white;
          box-shadow: 0 18px 42px rgba(255,77,0,.22);
          margin-bottom: 16px;
        }

        .user {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .avatar {
          width: 74px;
          height: 74px;
          border-radius: 24px;
          background: white;
          color: #ff4d00;
          display: grid;
          place-items: center;
          font-size: 34px;
          font-weight: 900;
        }

        .user h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 900;
        }

        .user p {
          margin: 4px 0 0;
          font-size: 13px;
          font-weight: 800;
          color: rgba(255,255,255,.9);
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin: 16px 0;
        }

        .stat {
          background: white;
          border-radius: 24px;
          padding: 14px 10px;
          text-align: center;
          box-shadow: 0 12px 30px rgba(0,0,0,.07);
        }

        .stat p {
          margin: 0;
          color: #888;
          font-size: 11px;
          font-weight: 800;
        }

        .stat b {
          display: block;
          margin-top: 5px;
          font-size: 20px;
          font-weight: 900;
          color: #151515;
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .item {
          background: white;
          border-radius: 24px;
          padding: 15px;
          text-decoration: none;
          color: #151515;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 12px 30px rgba(0,0,0,.07);
        }

        .item-main {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .icon {
          width: 48px;
          height: 48px;
          border-radius: 17px;
          background: #fff3e9;
          display: grid;
          place-items: center;
          font-size: 22px;
        }

        .admin-icon {
          background: #151515;
          color: #ff4d00;
        }

        .item h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 900;
        }

        .item p {
          margin: 3px 0 0;
          color: #888;
          font-size: 12px;
          font-weight: 800;
        }

        .arrow {
          color: #ff4d00;
          font-size: 22px;
          font-weight: 900;
        }

        .logout {
          margin-top: 16px;
          width: 100%;
          border: 0;
          border-radius: 22px;
          background: #151515;
          color: white;
          padding: 15px;
          font-family: inherit;
          font-weight: 900;
        }

        .nav {
          position: fixed;
          left: 50%;
          bottom: 0;
          transform: translateX(-50%);
          width: 100%;
          max-width: 430px;
          height: 76px;
          background: #ffffff;
          box-shadow: 0 -12px 32px rgba(0,0,0,.08);
          display: grid;
          grid-template-columns: repeat(5,1fr);
          align-items: center;
          text-align: center;
          color: #777;
          font-size: 11px;
          font-weight: 800;
          z-index: 50;
          border-top: 1px solid rgba(0,0,0,.04);
        }

        .nav a {
          text-decoration: none;
          color: inherit;
          line-height: 1.6;
        }

        .nav .active {
          color: #ff4d00;
          font-weight: 900;
        }
      `}</style>

      <main className="app">
        <header className="top">
          <Link className="back" href="/">‹</Link>

          <div className="title">
            <h1>حسابي</h1>
            <p>إدارة بياناتك وطلباتك</p>
          </div>

          <div style={{ width: 44 }} />
        </header>

        <section className="hero">
          <div className="user">
            <div className="avatar">F</div>
            <div>
              <h2>ضيف فيوز</h2>
              <p>مرحباً بك داخل FUSE</p>
            </div>
          </div>
        </section>

        <section className="stats">
          <div className="stat">
            <p>طلباتي</p>
            <b>0</b>
          </div>
          <div className="stat">
            <p>المفضلة</p>
            <b>0</b>
          </div>
          <div className="stat">
            <p>النقاط</p>
            <b>0</b>
          </div>
        </section>

        <section className="list">
          <Link href="/order-status" className="item">
            <div className="item-main">
              <div className="icon">📦</div>
              <div>
                <h3>تتبع الطلب</h3>
                <p>تابع آخر طلب وصلت له</p>
              </div>
            </div>
            <div className="arrow">‹</div>
          </Link>

          <Link href="/ratings" className="item">
            <div className="item-main">
              <div className="icon">⭐</div>
              <div>
                <h3>تقييم الطلب</h3>
                <p>قيّم المطعم والسائق</p>
              </div>
            </div>
            <div className="arrow">‹</div>
          </Link>

          <Link href="/notifications" className="item">
            <div className="item-main">
              <div className="icon">🔔</div>
              <div>
                <h3>الإشعارات</h3>
                <p>تنبيهات الطلبات والعروض</p>
              </div>
            </div>
            <div className="arrow">‹</div>
          </Link>

          <Link href="/favorites" className="item">
            <div className="item-main">
              <div className="icon">❤️</div>
              <div>
                <h3>المفضلة</h3>
                <p>مطاعمك ووجباتك المحفوظة</p>
              </div>
            </div>
            <div className="arrow">‹</div>
          </Link>

          <Link href="/addresses" className="item">
            <div className="item-main">
              <div className="icon">📍</div>
              <div>
                <h3>العناوين</h3>
                <p>إدارة عناوين التوصيل</p>
              </div>
            </div>
            <div className="arrow">‹</div>
          </Link>

          <Link href="/support" className="item">
            <div className="item-main">
              <div className="icon">🎧</div>
              <div>
                <h3>الدعم</h3>
                <p>تواصل ويا فريق فيوز</p>
              </div>
            </div>
            <div className="arrow">‹</div>
          </Link>

          <Link href="/restaurant-admin" className="item">
            <div className="item-main">
              <div className="icon admin-icon">🍽️</div>
              <div>
                <h3>لوحة المطعم</h3>
                <p>جهاز الطلبات وإدارة المطعم</p>
              </div>
            </div>
            <div className="arrow">‹</div>
          </Link>

          <Link href="/ceo-dashboard" className="item">
            <div className="item-main">
              <div className="icon admin-icon">👑</div>
              <div>
                <h3>لوحة CEO</h3>
                <p>إدارة النظام بالكامل</p>
              </div>
            </div>
            <div className="arrow">‹</div>
          </Link>
        </section>

        <button className="logout">تسجيل خروج</button>

        <nav className="nav">
          <Link href="/">⌂<br />الرئيسية</Link>
          <Link href="/explore">⌕<br />استكشف</Link>
          <Link href="/cart">▱<br />السلة</Link>
          <Link href="/order-status">▣<br />طلباتي</Link>
          <Link href="/profile" className="active">○<br />حسابي</Link>
        </nav>
      </main>
    </>
  );
}