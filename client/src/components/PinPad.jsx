const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

export default function PinPad({ value, maxLength, onChange, disabled }) {
  function press(key) {
    if (disabled) return;
    if (key === "back") {
      onChange(value.slice(0, -1));
    } else if (key && value.length < maxLength) {
      onChange(value + key);
    }
  }

  return (
    <div>
      <div className="flex justify-center gap-3 mb-8" aria-hidden="true">
        {Array.from({ length: maxLength }).map((_, i) => (
          <span
            key={i}
            className={`w-4 h-4 rounded-full border-2 border-marigold-400 transition-colors ${
              i < value.length ? "bg-marigold-400" : "bg-transparent"
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
        {KEYS.map((key, i) =>
          key === "" ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => press(key)}
              className="min-h-[64px] rounded-2xl bg-plum-700/60 active:bg-plum-600 text-cream-50 text-2xl font-medium flex items-center justify-center select-none disabled:opacity-50"
            >
              {key === "back" ? "⌫" : key}
            </button>
          )
        )}
      </div>
    </div>
  );
}
