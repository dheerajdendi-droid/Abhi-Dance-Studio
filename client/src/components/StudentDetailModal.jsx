import { useState } from "react";
import Avatar from "./Avatar.jsx";
import { useStudentHistory, useTogglePayment, useUpdateStudent, useSettings } from "../lib/useRoster.js";
import { formatMonth } from "../lib/date.js";
import { LEVELS, levelLabel, rateForLevel } from "../lib/levels.js";

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function StudentDetailModal({ studentId, onClose }) {
  const { data, isLoading } = useStudentHistory(studentId);
  const { data: settings } = useSettings();
  const togglePayment = useTogglePayment();
  const updateStudent = useUpdateStudent();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [level, setLevel] = useState("");
  const [error, setError] = useState("");
  const [rateChangeNotice, setRateChangeNotice] = useState(false);

  function startEdit() {
    setName(data.student.name);
    setPhone(data.student.parent_phone || "");
    setLevel(data.student.level);
    setError("");
    setEditing(true);
  }

  function save() {
    if (!name.trim()) {
      setError("Student name is required");
      return;
    }
    const levelChanged = level !== data.student.level;
    updateStudent.mutate(
      { id: studentId, name: name.trim(), parent_phone: phone.trim() || null, level },
      {
        onSuccess: () => {
          setEditing(false);
          if (levelChanged) setRateChangeNotice(true);
        },
        onError: (e) => setError(e.message),
      }
    );
  }

  return (
    <div className="fixed inset-0 z-30 bg-plum-900/60 flex items-end sm:items-center sm:justify-center">
      <div className="bg-cream-50 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        {isLoading || !data ? (
          <div className="p-6 text-center text-plum-400">Loading…</div>
        ) : (
          <>
            <div className="sticky top-0 bg-cream-50 px-4 pt-4 pb-3 border-b border-plum-100">
              {!editing ? (
                <div className="flex items-center gap-3">
                  <Avatar name={data.student.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-xl font-semibold truncate">{data.student.name}</p>
                    <p className="text-sm text-plum-400 capitalize">
                      {data.student.level} · £{Number(data.student.rate).toFixed(2)}/session
                      {data.student.parent_phone ? ` · ${data.student.parent_phone}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={startEdit}
                    className="min-h-[40px] px-3 rounded-xl bg-plum-50 text-plum-700 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={onClose}
                    className="min-w-[44px] min-h-[44px] rounded-full bg-plum-50 text-plum-700 text-lg"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Student name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-plum-100 px-3"
                    autoFocus
                  />
                  <input
                    type="tel"
                    placeholder="Parent WhatsApp number (optional)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-plum-100 px-3"
                  />
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-plum-100 px-3 bg-white"
                  >
                    {LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {levelLabel(lvl)}
                        {settings ? ` — £${rateForLevel(settings, lvl).toFixed(2)}/session` : ""}
                      </option>
                    ))}
                  </select>
                  {error && <p className="text-coral-600 text-sm">{error}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={save}
                      disabled={updateStudent.isPending}
                      className="flex-1 min-h-[44px] rounded-xl bg-plum-800 text-white font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="flex-1 min-h-[44px] rounded-xl bg-white border border-plum-100 text-plum-700 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {rateChangeNotice && (
                <div className="mt-3 flex items-start justify-between gap-2 bg-marigold-500/10 rounded-xl p-3">
                  <p className="text-sm text-plum-600">
                    New rate applies to future sessions — past sessions keep their original rate.
                  </p>
                  <button
                    onClick={() => setRateChangeNotice(false)}
                    className="text-plum-400 shrink-0"
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 space-y-3">
              {data.months.length === 0 && (
                <p className="text-plum-400 text-sm text-center py-6">No attendance recorded yet.</p>
              )}
              {data.months.map((m) => {
                const multiRate = m.lines.length > 1;
                return (
                  <div key={m.month} className="bg-white rounded-2xl shadow-sm p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{formatMonth(m.month)}</p>
                      <button
                        onClick={() =>
                          togglePayment.mutate({ studentId, month: m.month, paid: !m.paid })
                        }
                        className={`min-h-[36px] px-3 rounded-full text-sm font-semibold ${
                          m.paid ? "bg-coral-500 text-white" : "bg-plum-50 text-plum-700"
                        }`}
                      >
                        {m.paid ? "Paid" : "Unpaid"}
                      </button>
                    </div>
                    <div className="text-sm text-plum-500 mt-1">
                      {m.lines.map((l, i) => (
                        <p key={i}>
                          {l.sessions} session{l.sessions === 1 ? "" : "s"} × £{l.rate.toFixed(2)}
                          {multiRate ? ` (${levelLabel(l.tierLabel)})` : ""} = £{l.amount.toFixed(2)}
                        </p>
                      ))}
                      {multiRate && <p className="font-semibold text-plum-700">Total: £{m.amountOwed.toFixed(2)}</p>}
                    </div>
                    <p className="text-xs text-plum-400 mt-2">
                      {m.dates.map((d) => formatDate(d)).join(", ")}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
