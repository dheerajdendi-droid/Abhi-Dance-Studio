import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "./api.js";
import { enqueue, subscribeQueue, flush } from "./attendanceQueue.js";

export function useAttendance(classId, date) {
  return useQuery({
    queryKey: ["attendance", classId, date],
    queryFn: () => api.get(`/attendance?class_id=${classId}&date=${date}`),
    enabled: !!classId && !!date,
    staleTime: 10 * 1000,
  });
}

export function useSetAttendance(classId, date) {
  const qc = useQueryClient();

  return (studentId, present) => {
    const key = ["attendance", classId, date];
    qc.setQueryData(key, (old) => {
      const current = new Set(old?.presentStudentIds || []);
      if (present) current.add(studentId);
      else current.delete(studentId);
      return { presentStudentIds: Array.from(current) };
    });
    enqueue({
      type: present ? "mark" : "clear",
      student_id: studentId,
      class_id: classId,
      session_date: date,
    });
  };
}

export function usePendingSyncCount() {
  const [count, setCount] = useState(0);
  useEffect(() => subscribeQueue(setCount), []);
  return count;
}

export { flush as flushAttendanceQueue };
