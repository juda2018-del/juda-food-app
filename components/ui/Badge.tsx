export function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${color}`}>
      {text}
    </span>
  );
}

export default Badge;
