import Avatar from "./Avatar.jsx";
import { useStudentHistory, useTogglePayment } from "../lib/useRoster.js";
import { formatMonth } from "../lib/date.js";

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function StudentDetailModal({ studentId, onClose }) {
  const { data, isLoading } = useStudentHistory(studentId);
  const togglePayment = useTogglePayment();

  return (
    <div className="fixed inset-0 z-30 bg-plum-900/60 flex items-end sm:items-center sm:justify-center">
      <div className="bg-cream-50 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        {isLoading || !data ? (
          <div className="p-6 text-center text-plum-400">Loading…</div>
        ) : (
          <>
            <div className="sticky top-0 bg-cream-50 px-4 pt-4 pb-3 border-b border-plum-100 flex items-center gap-3">
              <Avatar name={data.student.name} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-display text-xl font-semibold truncate">{data.student.name}</p>
                <p className="text-sm text-plum-400 capitalize">
                  {data.student.level} · £{Number(data.student.rate).toFixed(2)}/session
                  {data.student.parent_phone ? ` · ${data.student.parent_phone}` : ""}
                </p>
              </div>
              <button
                onClick={onClose}
                className="min-w-[44px] min-h-[44px] rounded-full bg-plum-50 text-plum-700 text-lg"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3">
              {data.months.length === 0 && (
                <p className="text-plum-400 text-sm text-center py-6">No attendance recorded yet.</p>
              )}
              {data.months.map((m) => (
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
                  <p className="text-sm text-plum-500 mt-1">
                    {m.sessions} session{m.sessions === 1 ? "" : "s"} · £{m.amountOwed.toFixed(2)}
                  </p>
                  <p className="text-xs text-plum-400 mt-2">
                    {m.dates.map((d) => formatDate(d)).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
