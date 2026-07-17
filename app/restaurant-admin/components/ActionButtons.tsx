 type ButtonProps = {
  text: string;
  onClick?: () => void;
  orange?: boolean;
  green?: boolean;
  red?: boolean;
  white?: boolean;
  orangeOutline?: boolean;
};

function getButtonStyle({
  orange,
  green,
  red,
  white,
  orangeOutline,
}: ButtonProps): React.CSSProperties {
  const base: React.CSSProperties = {
    width: "100%",
    borderRadius: 12,
    padding: "9px 10px",
    fontSize: 11,
    fontWeight: 950,
    border: "1px solid rgba(255,255,255,.10)",
    cursor: "pointer",
    transition: "0.15s ease",
  };

  if (orange) {
    return {
      ...base,
      background: "#ff7a00",
      color: "#111",
      borderColor: "#ff7a00",
      boxShadow: "0 8px 18px rgba(255,122,0,.16)",
    };
  }

  if (green) {
    return {
      ...base,
      background: "#059669",
      color: "white",
      borderColor: "#10b981",
    };
  }

  if (red) {
    return {
      ...base,
      background: "#dc2626",
      color: "white",
      borderColor: "#ef4444",
    };
  }

  if (white) {
    return {
      ...base,
      background: "white",
      color: "#111",
      borderColor: "white",
    };
  }

  if (orangeOutline) {
    return {
      ...base,
      background: "rgba(255,122,0,.10)",
      color: "#ffb347",
      borderColor: "rgba(255,122,0,.35)",
    };
  }

  return {
    ...base,
    background: "#18181b",
    color: "white",
  };
}

export function ActionButton(props: ButtonProps) {
  return (
    <button
      onClick={props.onClick}
      style={getButtonStyle(props)}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "scale(.97)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {props.text}
    </button>
  );
}

export function ActionLink({
  href,
  text,
  green,
  white,
}: {
  href: string;
  text: string;
  green?: boolean;
  white?: boolean;
}) {
  const style = getButtonStyle({ text, green, white });

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      style={{
        ...style,
        display: "block",
        textAlign: "center",
        textDecoration: "none",
      }}
    >
      {text}
    </a>
  );
}