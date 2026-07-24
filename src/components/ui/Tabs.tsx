interface TabsProps {
  tabs: { id: string; label: string }[];
  activeId: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, activeId, onChange }: TabsProps) {
  return (
    <div className="border-lh-border bg-lh-surface-soft inline-flex rounded-2xl border p-1">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`rounded-2xl px-3 py-1 text-xs font-medium transition ${
              active
                ? "bg-lh-accent text-lh-on-accent"
                : "text-lh-text-secondary hover:bg-lh-surface"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
