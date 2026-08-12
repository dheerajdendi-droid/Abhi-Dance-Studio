import { useState } from "react";
import { useSettings, useUpdateSettings } from "../lib/useRoster.js";

export default function RatesCard() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [editing, setEditing] = useState(false);
  const [junior, setJunior] = useState("");
  const [senior, setSenior] = useState("");
  const [error, setError] = useState("");

  function startEdit() {
    setJunior(String(settings.junior_rate));
    setSenior(String(settings.senior_rate));
    setError("");
    setEditing(true);
  }

  function save() {
    const jr = Number(junior);
    const sr = Number(senior);
    if (!Number.isFinite(jr) || jr <= 0 || !Number.isFinite(sr) || sr <= 0) {
      setError("Enter valid rates");
      return;
    }
    updateSettings.mutate(
      { junior_rate: jr, senior_rate: sr },
      { onSuccess: () => setEditing(false), onError: (e) => setError(e.message) }
    );
  }

  if (isLoading) return null;

  return (
    <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm p-4">
      {!editing ? (
        <div className="flex items-center justify-between">
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-plum-400 uppercase tracking-wide">Junior rate</p>
              <p className="font-display text-xl font-semibold">£{Number(settings.junior_rate).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-plum-400 uppercase tracking-wide">Senior rate</p>
              <p className="font-display text-xl font-semibold">£{Number(settings.senior_rate).toFixed(2)}</p>
            </div>
          </div>
          <button
            onClick={startEdit}
            className="min-h-[44px] px-4 rounded-xl bg-plum-50 text-plum-700 font-medium text-sm"
          >
            Edit rates
          </button>
        </div>
      ) : (
        <div>
          <div className="flex gap-3">
            <label className="flex-1 text-sm">
              Junior £
              <input
                type="number"
                inputMode="decimal"
                value={junior}
                onChange={(e) => setJunior(e.target.value)}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-plum-100 px-3"
              />
            </label>
            <label className="flex-1 text-sm">
              Senior £
              <input
                type="number"
                inputMode="decimal"
                value={senior}
                onChange={(e) => setSenior(e.target.value)}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-plum-100 px-3"
              />
            </label>
          </div>
          {error && <p className="text-coral-600 text-sm mt-2">{error}</p>}
          <div className="flex gap-2 mt-3">
            <button
              onClick={save}
              disabled={updateSettings.isPending}
              className="flex-1 min-h-[44px] rounded-xl bg-plum-800 text-white font-medium"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex-1 min-h-[44px] rounded-xl bg-plum-50 text-plum-700 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
