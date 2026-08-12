import { useMemo, useState } from "react";
import {
  useOutgoings,
  useOutgoingSuggestions,
  useAddOutgoing,
  useDeleteOutgoing,
} from "../lib/useOutgoings.js";

const CATEGORY_LABELS = {
  hall_rent: "Hall rent",
  teaching_assistant: "Teaching Assistant",
  other: "Other",
};

function describe(entry) {
  const base = CATEGORY_LABELS[entry.category] || entry.category;
  return entry.label ? `${base} · ${entry.label}` : base;
}

export default function SessionCostsCard({ classId, date }) {
  const [expanded, setExpanded] = useState(false);
  const [addingForm, setAddingForm] = useState(false);

  const { data: entries } = useOutgoings(classId, date);
  const { data: suggestions } = useOutgoingSuggestions(classId);
  const addOutgoing = useAddOutgoing(classId, date);
  const deleteOutgoing = useDeleteOutgoing(classId, date);

  const total = useMemo(
    () => (entries || []).reduce((sum, e) => sum + Number(e.amount), 0),
    [entries]
  );

  const usableSuggestions = useMemo(() => {
    const existingKeys = new Set((entries || []).map((e) => `${e.category}|${e.label || ""}`));
    return (suggestions || []).filter((s) => !existingKeys.has(`${s.category}|${s.label || ""}`));
  }, [suggestions, entries]);

  if (!classId || !date) return null;

  return (
    <div className="mx-4 mt-5 bg-white rounded-2xl border border-plum-100">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 min-h-[48px] text-left"
      >
        <span className="text-sm font-medium text-plum-500">
          Session costs
          {entries && entries.length > 0 && (
            <span className="text-plum-400">
              {" "}
              · £{total.toFixed(2)} · {entries.length} item{entries.length === 1 ? "" : "s"}
            </span>
          )}
        </span>
        <span className="text-plum-400">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-plum-50 pt-3">
          {entries && entries.length > 0 && (
            <div className="space-y-2">
              {entries.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between bg-plum-50/50 rounded-xl px-3 py-2"
                >
                  <span className="text-sm text-plum-700">{describe(e)}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-plum-800">
                      £{Number(e.amount).toFixed(2)}
                    </span>
                    <button
                      onClick={() => deleteOutgoing.mutate(e.id)}
                      className="min-w-[32px] min-h-[32px] flex items-center justify-center text-plum-300"
                      aria-label={`Remove ${describe(e)}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {usableSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {usableSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() =>
                    addOutgoing.mutate({ category: s.category, label: s.label, amount: Number(s.amount) })
                  }
                  className="min-h-[36px] px-3 rounded-full bg-marigold-500/10 text-plum-700 text-xs font-medium border border-marigold-500/30"
                >
                  + {describe(s)} £{Number(s.amount).toFixed(2)}
                </button>
              ))}
            </div>
          )}

          {addingForm ? (
            <AddOutgoingForm
              onSave={(data) => addOutgoing.mutate(data, { onSuccess: () => setAddingForm(false) })}
              onCancel={() => setAddingForm(false)}
              saving={addOutgoing.isPending}
            />
          ) : (
            <button
              onClick={() => setAddingForm(true)}
              className="w-full min-h-[40px] rounded-xl border border-dashed border-plum-200 text-plum-500 text-sm font-medium"
            >
              + Add cost
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AddOutgoingForm({ onSave, onCancel, saving }) {
  const [category, setCategory] = useState("hall_rent");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError("Enter a valid amount");
      return;
    }
    onSave({ category, label: label.trim() || null, amount: amt });
  }

  return (
    <form onSubmit={submit} className="bg-plum-50/50 rounded-xl p-3 space-y-2">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full min-h-[40px] rounded-lg border border-plum-100 px-3 bg-white text-sm"
      >
        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Name / note (optional)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="w-full min-h-[40px] rounded-lg border border-plum-100 px-3 bg-white text-sm"
      />
      <input
        type="number"
        inputMode="decimal"
        placeholder="Amount £"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full min-h-[40px] rounded-lg border border-plum-100 px-3 bg-white text-sm"
      />
      {error && <p className="text-coral-600 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 min-h-[40px] rounded-lg bg-plum-800 text-white text-sm font-medium"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 min-h-[40px] rounded-lg bg-white border border-plum-100 text-plum-700 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
