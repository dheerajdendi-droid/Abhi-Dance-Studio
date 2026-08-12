import { useState } from "react";
import Avatar from "./Avatar.jsx";
import ClassForm from "./ClassForm.jsx";
import StudentForm from "./StudentForm.jsx";
import {
  useUpdateClass,
  useDeleteClass,
  useCreateStudent,
  useDeleteStudent,
} from "../lib/useRoster.js";

export default function ClassCard({ classInfo, students, onOpenStudent }) {
  const [editing, setEditing] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);
  const [error, setError] = useState("");

  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();
  const createStudent = useCreateStudent();
  const deleteStudent = useDeleteStudent();

  function saveClass(data) {
    updateClass.mutate(
      { id: classInfo.id, ...data },
      { onSuccess: () => setEditing(false) }
    );
  }

  function removeClass() {
    if (!confirm(`Delete "${classInfo.name}"?`)) return;
    deleteClass.mutate(classInfo.id, {
      onError: (e) => setError(e.message),
    });
  }

  function addStudent(data) {
    createStudent.mutate(
      { ...data, class_id: classInfo.id },
      { onSuccess: () => setAddingStudent(false) }
    );
  }

  function removeStudent(student) {
    if (!confirm(`Remove ${student.name} from the roster?`)) return;
    deleteStudent.mutate(student.id);
  }

  if (editing) {
    return (
      <div className="mx-4">
        <ClassForm
          initial={classInfo}
          onSave={saveClass}
          onCancel={() => setEditing(false)}
          saving={updateClass.isPending}
        />
      </div>
    );
  }

  return (
    <div className="mx-4 bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-plum-50">
        <div>
          <p className="font-display text-lg font-semibold">{classInfo.name}</p>
          <p className="text-sm text-plum-400">
            {classInfo.day_of_week} · {classInfo.time.slice(0, 5)} · {students.length} student
            {students.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setEditing(true)}
            className="min-w-[40px] min-h-[40px] rounded-full text-plum-500 text-lg"
            aria-label="Edit class"
          >
            ✎
          </button>
          <button
            onClick={removeClass}
            className="min-w-[40px] min-h-[40px] rounded-full text-plum-400 text-lg"
            aria-label="Delete class"
          >
            🗑
          </button>
        </div>
      </div>

      {error && <p className="text-coral-600 text-sm px-4 pt-2">{error}</p>}

      <div className="p-3 space-y-2">
        {students.map((s) => (
          <button
            key={s.id}
            onClick={() => onOpenStudent(s.id)}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-plum-50/60 active:bg-plum-50 text-left"
          >
            <Avatar name={s.name} />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{s.name}</p>
              <p className="text-xs text-plum-400 capitalize">
                {s.level} · £{Number(s.rate).toFixed(2)}
              </p>
            </div>
            <span
              onClick={(e) => {
                e.stopPropagation();
                removeStudent(s);
              }}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center text-plum-300 text-lg"
              role="button"
              aria-label={`Remove ${s.name}`}
            >
              ✕
            </span>
          </button>
        ))}

        {addingStudent ? (
          <StudentForm
            onSave={addStudent}
            onCancel={() => setAddingStudent(false)}
            saving={createStudent.isPending}
          />
        ) : (
          <button
            onClick={() => setAddingStudent(true)}
            className="w-full min-h-[44px] rounded-xl border border-dashed border-plum-200 text-plum-500 font-medium"
          >
            + Add student
          </button>
        )}
      </div>
    </div>
  );
}
