import { useEffect, useMemo, useState } from "react";
import ClassChips from "../components/ClassChips.jsx";
import AttendanceCard from "../components/AttendanceCard.jsx";
import SessionCostsCard from "../components/SessionCostsCard.jsx";
import { useClasses, useStudents } from "../lib/useRoster.js";
import { useAttendance, useSetAttendance, usePendingSyncCount } from "../lib/useAttendance.js";
import { mostRecentDateForWeekday } from "../lib/sessionDate.js";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function todayStr() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export default function Today() {
  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: students, isLoading: studentsLoading } = useStudents();
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [date, setDate] = useState(todayStr());
  const pendingSync = usePendingSyncCount();

  useEffect(() => {
    if (!classes || classes.length === 0 || selectedClassId) return;
    const todayName = WEEKDAYS[new Date().getDay()];
    const matchingToday = classes.find((c) => c.day_of_week === todayName);
    setSelectedClassId((matchingToday || classes[0]).id);
  }, [classes, selectedClassId]);

  const { data: attendance } = useAttendance(selectedClassId, date);
  const setAttendance = useSetAttendance(selectedClassId, date);

  const classStudents = useMemo(
    () => (students || []).filter((s) => s.class_id === selectedClassId),
    [students, selectedClassId]
  );

  const presentSet = useMemo(
    () => new Set(attendance?.presentStudentIds || []),
    [attendance]
  );

  function selectClass(classId) {
    setSelectedClassId(classId);
    const cls = (classes || []).find((c) => c.id === classId);
    if (cls) setDate(mostRecentDateForWeekday(cls.day_of_week));
  }

  function markAllPresent() {
    classStudents.forEach((s) => {
      if (!presentSet.has(s.id)) setAttendance(s.id, true);
    });
  }

  function clearAll() {
    classStudents.forEach((s) => {
      if (presentSet.has(s.id)) setAttendance(s.id, false);
    });
  }

  if (classesLoading || studentsLoading) {
    return <p className="p-4 text-plum-400">Loading…</p>;
  }

  if (!classes || classes.length === 0) {
    return (
      <p className="p-4 text-plum-400">
        No classes yet — add one from the Students tab to start marking attendance.
      </p>
    );
  }

  return (
    <div className="pb-6">
      {pendingSync > 0 && (
        <div className="mx-4 mt-3 mb-1 bg-marigold-500/20 text-marigold-600 text-sm font-medium rounded-xl px-3 py-2">
          {pendingSync} change{pendingSync === 1 ? "" : "s"} will sync when you're back online
        </div>
      )}

      <div className="mt-3">
        <ClassChips classes={classes} selectedId={selectedClassId} onSelect={selectClass} />
      </div>

      <div className="flex items-center justify-between px-4 mt-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="min-h-[44px] rounded-xl border border-plum-100 px-3 bg-white"
        />
        <p className="font-display text-lg font-semibold">
          {presentSet.size}/{classStudents.length} present
        </p>
      </div>

      <div className="flex gap-2 px-4 mt-3">
        <button
          onClick={markAllPresent}
          className="flex-1 min-h-[44px] rounded-xl bg-plum-800 text-white font-medium text-sm"
        >
          Mark everyone here
        </button>
        <button
          onClick={clearAll}
          className="flex-1 min-h-[44px] rounded-xl bg-white border border-plum-100 text-plum-700 font-medium text-sm"
        >
          Clear
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 px-4 mt-4">
        {classStudents.map((s) => (
          <AttendanceCard
            key={s.id}
            student={s}
            present={presentSet.has(s.id)}
            onToggle={setAttendance}
          />
        ))}
      </div>

      {classStudents.length === 0 && (
        <p className="px-4 mt-4 text-plum-400 text-sm">
          No students in this class yet — add them from the Students tab.
        </p>
      )}

      <SessionCostsCard classId={selectedClassId} date={date} />
    </div>
  );
}
