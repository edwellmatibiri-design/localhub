export default function Chart({ label }: { label: string }) {
  return (
    <div className="card">
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-3 grid grid-cols-12 items-end gap-2">
        {[28, 34, 31, 42, 44, 39, 52, 58, 61, 57, 66, 72].map((v, i) => (
          <div key={i} className="rounded-t bg-lh-electric-blue/75" style={{ height: `${v}px` }} />
        ))}
      </div>
    </div>
  );
}
