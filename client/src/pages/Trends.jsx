import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import StatCard from "../components/StatCard.jsx";
import { useDashboardSummary, useDashboardClasses } from "../lib/useDashboard.js";
import { formatMonth, currentMonth, shiftMonth } from "../lib/date.js";

const METRICS = {
  students: { label: "Students", key: "studentCount", color: "#3D1F3E", format: (v) => String(v) },
  attendance: { label: "Attendance", key: "sessions", color: "#FF7A45", format: (v) => String(v) },
  payments: { label: "Payments", key: "billed", color: "#F4A63D", format: (v) => `£${v.toFixed(0)}` },
};

export default function Trends() {
  const [metric, setMetric] = useState("students");
  const [month, setMonth] = useState(currentMonth());
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: classData, isLoading: classesLoading } = useDashboardClasses(month);

  const chartData = useMemo(
    () => (classData?.classes || []).map((c) => ({ ...c, name: shortName(c.className) })),
    [classData]
  );

  const insight = useMemo(() => {
    const classes = classData?.classes || [];
    if (classes.length === 0) return "";
    const busiest = classes.reduce((a, b) => (b.studentCount > a.studentCount ? b : a));
    const totalBilled = classes.reduce((s, c) => s + c.billed, 0);
    const totalCollected = classes.reduce((s, c) => s + c.collected, 0);
    const pct = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;
    return `${busiest.className} is the busiest class with ${busiest.studentCount} students · ${pct}% collected of what's billed for ${formatMonth(month)}.`;
  }, [classData, month]);

  const metricConfig = METRICS[metric];
  const showMonthNav = metric !== "students";

  return (
    <div className="pb-6">
      <div className="grid grid-cols-2 gap-3 mx-4 mt-4">
        {summaryLoading ? (
          <p className="col-span-2 text-plum-400">Loading…</p>
        ) : (
          <>
            <StatCard label="Active students" value={summary.activeStudents} />
            <StatCard label="Classes running" value={summary.classesRunning} />
            <StatCard label="Billed this month" value={`£${summary.thisMonthBilled.toFixed(2)}`} />
            <StatCard label="Outstanding (all-time)" value={`£${summary.allTimeOutstanding.toFixed(2)}`} />
          </>
        )}
      </div>

      <div className="mx-4 mt-6 flex bg-plum-50 rounded-xl p-1">
        {Object.entries(METRICS).map(([key, m]) => (
          <button
            key={key}
            onClick={() => setMetric(key)}
            className={`flex-1 min-h-[40px] rounded-lg text-sm font-semibold transition-colors ${
              metric === key ? "bg-white shadow-sm text-plum-800" : "text-plum-500"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {showMonthNav && (
        <div className="flex items-center justify-between mx-4 mt-3">
          <button
            onClick={() => setMonth(shiftMonth(month, -1))}
            className="min-w-[40px] min-h-[40px] rounded-full bg-white shadow-sm text-plum-700"
            aria-label="Previous month"
          >
            ←
          </button>
          <p className="font-medium text-sm">{formatMonth(month)}</p>
          <button
            onClick={() => setMonth(shiftMonth(month, 1))}
            className="min-w-[40px] min-h-[40px] rounded-full bg-white shadow-sm text-plum-700"
            aria-label="Next month"
          >
            →
          </button>
        </div>
      )}

      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm p-3" style={{ height: 260 }}>
        {classesLoading ? (
          <p className="text-plum-400 p-3">Loading…</p>
        ) : chartData.length === 0 ? (
          <p className="text-plum-400 p-3">No classes yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5EBDD" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8A4A73" }} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: "#8A4A73" }} allowDecimals={false} />
              <Tooltip
                formatter={(value) => metricConfig.format(value)}
                contentStyle={{ borderRadius: 12, border: "1px solid #F5EBDD" }}
              />
              <Bar dataKey={metricConfig.key} fill={metricConfig.color} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {insight && (
        <p className="mx-4 mt-4 text-sm text-plum-600 bg-marigold-500/10 rounded-xl p-3">{insight}</p>
      )}
    </div>
  );
}

function shortName(name) {
  return name.length > 14 ? `${name.slice(0, 13)}…` : name;
}
