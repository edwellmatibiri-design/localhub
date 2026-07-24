export default function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative h-7 w-12 rounded-full transition ${enabled ? "bg-lh-emerald" : "bg-lh-muted/40"}`}
      aria-pressed={enabled}
    >
      <span
        className={`text-lh-on-accent absolute top-1 h-5 w-5 rounded-full transition ${enabled ? "left-6" : "left-1"}`}
      />
    </button>
  );
}
