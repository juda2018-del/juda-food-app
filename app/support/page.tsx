export default function SupportPage() {
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#05070f",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
        padding: "40px 20px",
      }}
    >
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          background: "linear-gradient(135deg, #111827, #070707)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "28px",
          padding: "28px",
          boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
        }}
      >
        <p style={{ color: "#ff7a00", fontWeight: 800, margin: 0 }}>
          FUSE Iraq Support
        </p>

        <h1
          style={{
            fontSize: "42px",
            lineHeight: "1.25",
            margin: "14px 0",
            fontWeight: 900,
          }}
        >
          مركز دعم تطبيق FUSE Iraq
        </h1>

        <p
          style={{
            color: "rgba(255,255,255,0.72)",
            fontSize: "18px",
            lineHeight: "2",
            maxWidth: "850px",
          }}
        >
          هذه الصفحة مخصصة لمساعدة مستخدمي تطبيق FUSE Iraq بخصوص الطلبات،
          الحسابات، المطاعم، السائقين، والمشاكل التقنية. يمكنكم التواصل معنا عبر
          البريد الإلكتروني الرسمي للدعم.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
            marginTop: "26px",
          }}
        >
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "22px",
              padding: "22px",
            }}
          >
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>
              البريد الإلكتروني للدعم
            </p>
            <a
              href="mailto:fuseiraq@gmail.com"
              style={{
                display: "block",
                marginTop: "10px",
                color: "#ff7a00",
                fontSize: "26px",
                fontWeight: 900,
                textDecoration: "none",
              }}
            >
              fuseiraq@gmail.com
            </a>
            <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: "1.8" }}>
              أفضل طريقة للتواصل الرسمي والردود التفصيلية.
            </p>
          </div>

          <div
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "22px",
              padding: "22px",
            }}
          >
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>
              وقت الاستجابة المتوقع
            </p>
            <p
              style={{
                margin: "10px 0 0",
                color: "#ff7a00",
                fontSize: "26px",
                fontWeight: 900,
              }}
            >
              خلال 24 - 48 ساعة
            </p>
            <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: "1.8" }}>
              يتم الرد على طلبات الدعم حسب أولوية المشكلة ونوعها.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "14px",
            marginTop: "24px",
          }}
        >
          {[
            ["مشاكل الطلبات", "مساعدة بخصوص الطلبات، الإلغاء، أو حالة الطلب."],
            ["الحساب وتسجيل الدخول", "حل مشاكل الدخول، الخروج، أو بيانات الحساب."],
            ["المطاعم", "مساعدة المطاعم في استقبال الطلبات وإدارة القائمة."],
            ["السائقين", "مساعدة السائقين بخصوص الطلبات والتوصيل."],
          ].map(([title, desc]) => (
            <div
              key={title}
              style={{
                border: "1px solid rgba(255,255,255,0.10)",
                background: "#0f1117",
                borderRadius: "20px",
                padding: "20px",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 900 }}>
                {title}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: "1.8" }}>
                {desc}
              </p>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "24px",
            border: "1px solid rgba(255,122,0,0.35)",
            background: "rgba(255,122,0,0.10)",
            borderRadius: "22px",
            padding: "22px",
          }}
        >
          <h2 style={{ color: "#ff7a00", marginTop: 0 }}>
            المعلومات المطلوبة عند التواصل
          </h2>
          <ul style={{ color: "rgba(255,255,255,0.76)", lineHeight: "2" }}>
            <li>اسم المستخدم أو البريد المرتبط بالحساب إذا متوفر.</li>
            <li>رقم الطلب إذا كانت المشكلة تخص طلباً معيّناً.</li>
            <li>شرح مختصر للمشكلة مع لقطة شاشة إن وجدت.</li>
            <li>نوع الجهاز المستخدم: iPhone أو iPad أو Android.</li>
          </ul>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "24px" }}>
          <a
            href="mailto:fuseiraq@gmail.com"
            style={{
              background: "#ff7a00",
              color: "#000",
              padding: "14px 22px",
              borderRadius: "16px",
              fontWeight: 900,
              textDecoration: "none",
            }}
          >
            مراسلة الدعم
          </a>
          <a
            href="/privacy"
            style={{
              color: "#fff",
              padding: "14px 22px",
              borderRadius: "16px",
              fontWeight: 800,
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            سياسة الخصوصية
          </a>
          <a
            href="/"
            style={{
              color: "#fff",
              padding: "14px 22px",
              borderRadius: "16px",
              fontWeight: 800,
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            الرجوع للرئيسية
          </a>
        </div>
      </section>
    </main>
  );
}
