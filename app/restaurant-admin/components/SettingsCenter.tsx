 export default function SettingsCenter() {
  return (
    <section
      style={{
        marginTop: 18,
        border: "1px solid rgba(255,255,255,.10)",
        background:
          "linear-gradient(135deg, rgba(17,16,14,.98), rgba(7,6,5,.98))",
        borderRadius: 26,
        padding: 18,
      }}
    >
      <h2 style={{ margin: 0, color: "white", fontSize: 26, fontWeight: 950 }}>
        ⚙️ إعدادات المطعم
      </h2>

      <p style={{ marginTop: 8, color: "#a1a1aa", fontWeight: 800 }}>
        ساعات العمل، رسوم التوصيل، الحد الأدنى ومعلومات الفرع
      </p>

      <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
        <input placeholder="اسم المطعم" style={inputStyle} />
        <input placeholder="رقم التواصل" style={inputStyle} />
        <input placeholder="العنوان" style={inputStyle} />
        <input placeholder="الحد الأدنى للطلب" style={inputStyle} />
        <input placeholder="رسوم التوصيل" style={inputStyle} />

        <button
          style={{
            height: 46,
            border: 0,
            borderRadius: 14,
            background: "#ff7a00",
            color: "#111",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          حفظ الإعدادات
        </button>
      </div>
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  height: 46,
  borderRadius: 14,
  background: "#060504",
  border: "1px solid rgba(255,255,255,.12)",
  color: "white",
  padding: "0 14px",
  outline: "none",
  fontWeight: 800,
};