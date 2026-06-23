type Props = {
  text: string;
  green?: boolean;
};

export default function Toast({ text, green }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        top: 22,
        right: 22,
        zIndex: 9999,
        minWidth: 320,
        maxWidth: 420,
        borderRadius: 20,
        padding: "16px 18px",
        background: green
          ? "linear-gradient(135deg,#059669,#047857)"
          : "linear-gradient(135deg,#ff7a00,#ff9f3f)",
        color: green ? "white" : "#111",
        fontSize: 15,
        fontWeight: 950,
        boxShadow: "0 20px 50px rgba(0,0,0,.35)",
      }}
    >
      {text}
    </div>
  );
}