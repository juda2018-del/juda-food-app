 export default function EmployeesCenter() {
  const employees = [
    { name: "أحمد", role: "كاشير", status: "متصل", shift: "صباحي" },
    { name: "علي", role: "مشرف طلبات", status: "متصل", shift: "مسائي" },
    { name: "حسين", role: "مطبخ", status: "غير متصل", shift: "صباحي" },
  ];

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
      <p style={{ margin: 0, color: "#ffb347", letterSpacing: 3, fontSize: 11, fontWeight: 950 }}>
        EMPLOYEES CENTER
      </p>

      <h2 style={{ margin: "8px 0 0", color: "white", fontSize: 26, fontWeight: 950 }}>
        👨‍💼 مركز الموظفين
      </h2>

      <p style={{ marginTop: 8, color: "#a1a1aa", fontWeight: 800 }}>
        إدارة الكادر، الورديات، وحالة العمل داخل المطعم
      </p>

      <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
        {employees.map((emp) => (
          <div
            key={emp.name}
            style={{
              border: "1px solid rgba(255,255,255,.08)",
              background: "rgba(0,0,0,.22)",
              borderRadius: 18,
              padding: 16,
              display: "grid",
              gridTemplateColumns: "1fr 160px 160px 120px",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ margin: 0, color: "white", fontSize: 18, fontWeight: 950 }}>
                {emp.name}
              </p>
              <p style={{ marginTop: 6, color: "#a1a1aa", fontWeight: 800 }}>
                {emp.role}
              </p>
            </div>

            <p style={{ margin: 0, color: "#ffb347", fontWeight: 950 }}>
              {emp.shift}
            </p>

            <p
              style={{
                margin: 0,
                color: emp.status === "متصل" ? "#86efac" : "#fca5a5",
                fontWeight: 950,
              }}
            >
              ● {emp.status}
            </p>

            <button
              style={{
                height: 40,
                border: "1px solid rgba(255,122,0,.35)",
                background: "rgba(255,122,0,.10)",
                color: "#ffb347",
                borderRadius: 12,
                fontWeight: 950,
                cursor: "pointer",
              }}
            >
              تفاصيل
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}