import { useState } from "react";
import BillingRow from "../components/BillingRow.jsx";
import { useBillingMonth, useBillingOutstanding } from "../lib/useBilling.js";
import { useTogglePayment } from "../lib/useRoster.js";
import { formatMonth, currentMonth, shiftMonth } from "../lib/date.js";

export default function Money() {
  const [view, setView] = useState("month"); // month | outstanding
  const [month, setMonth] = useState(currentMonth());

  return (
    <div className="pb-6">
      <div className="mx-4 mt-3 flex bg-plum-50 rounded-xl p-1">
        {[
          { key: "month", label: "By month" },
          { key: "outstanding", label: "Outstanding" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={`flex-1 min-h-[40px] rounded-lg text-sm font-semibold transition-colors ${
              view === tab.key ? "bg-white shadow-sm text-plum-800" : "text-plum-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === "month" ? (
        <MonthView month={month} setMonth={setMonth} />
      ) : (
        <OutstandingView />
      )}
    </div>
  );
}

function MonthView({ month, setMonth }) {
  const { data: groups, isLoading } = useBillingMonth(month);
  const togglePayment = useTogglePayment();

  return (
    <div>
      <div className="flex items-center justify-between mx-4 mt-4">
        <button
          onClick={() => setMonth(shiftMonth(month, -1))}
          className="min-w-[44px] min-h-[44px] rounded-full bg-white shadow-sm text-plum-700 text-lg"
          aria-label="Previous month"
        >
          ←
        </button>
        <p className="font-display text-lg font-semibold">{formatMonth(month)}</p>
        <button
          onClick={() => setMonth(shiftMonth(month, 1))}
          className="min-w-[44px] min-h-[44px] rounded-full bg-white shadow-sm text-plum-700 text-lg"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      {isLoading ? (
        <p className="p-4 text-plum-400">Loading…</p>
      ) : !groups || groups.length === 0 ? (
        <p className="mx-4 mt-6 text-plum-400 text-sm">No sessions recorded for this month.</p>
      ) : (
        <div className="space-y-5 mt-4">
          {groups.map((g) => (
            <div key={g.classId || "unassigned"} className="mx-4">
              <h3 className="font-display text-base font-semibold mb-2">{g.className}</h3>
              <div className="space-y-2">
                {g.students.map((row) => (
                  <BillingRow
                    key={row.studentId}
                    row={row}
                    onTogglePaid={(paid) =>
                      togglePayment.mutate({ studentId: row.studentId, month: row.month, paid })
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OutstandingView() {
  const { data: rows, isLoading } = useBillingOutstanding();
  const togglePayment = useTogglePayment();

  if (isLoading) return <p className="p-4 text-plum-400">Loading…</p>;

  if (!rows || rows.length === 0) {
    return <p className="mx-4 mt-6 text-plum-400 text-sm">Nothing outstanding — all caught up!</p>;
  }

  return (
    <div className="mx-4 mt-4 space-y-2">
      {rows.map((row) => (
        <BillingRow
          key={`${row.studentId}-${row.month}`}
          row={row}
          showMonth
          onTogglePaid={(paid) =>
            togglePayment.mutate({ studentId: row.studentId, month: row.month, paid })
          }
        />
      ))}
    </div>
  );
}
