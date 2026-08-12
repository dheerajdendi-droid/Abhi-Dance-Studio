export default function ClassChips({ classes, selectedId, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-1 -mx-1 snap-x">
      {classes.map((c) => {
        const active = c.id === selectedId;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`shrink-0 snap-start min-h-[56px] px-4 rounded-2xl text-left border transition-colors ${
              active
                ? "bg-plum-800 border-plum-800 text-white"
                : "bg-white border-plum-100 text-plum-700"
            }`}
          >
            <p className="font-semibold text-sm leading-tight">{c.name}</p>
            <p className={`text-xs leading-tight ${active ? "text-plum-100/80" : "text-plum-400"}`}>
              {c.day_of_week} · {c.time.slice(0, 5)}
            </p>
          </button>
        );
      })}
    </div>
  );
}
