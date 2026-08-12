const STORAGE_KEY = "abhi-attendance-queue";
const listeners = new Set();
let flushing = false;

function readQueue() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function writeQueue(queue) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

function notify() {
  const size = readQueue().length;
  listeners.forEach((fn) => fn(size));
}

export function subscribeQueue(fn) {
  listeners.add(fn);
  fn(readQueue().length);
  return () => listeners.delete(fn);
}

export function queueSize() {
  return readQueue().length;
}

async function sendOp(op) {
  let res;
  if (op.type === "mark") {
    res = await fetch("/api/attendance", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: op.student_id,
        class_id: op.class_id,
        session_date: op.session_date,
      }),
    });
  } else {
    res = await fetch(`/api/attendance/${op.student_id}/${op.session_date}`, {
      method: "DELETE",
      credentials: "include",
    });
  }
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
}

export function enqueue(op) {
  const queue = readQueue();
  queue.push({ ...op, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` });
  writeQueue(queue);
  notify();
  flush();
}

export async function flush() {
  if (flushing) return;
  flushing = true;
  try {
    while (true) {
      // Re-read fresh each iteration — other enqueue() calls may be
      // concurrently appending to localStorage while we await a send.
      const queue = readQueue();
      if (queue.length === 0) break;
      const op = queue[0];
      try {
        await sendOp(op);
      } catch {
        break; // network or server error — stop, retry later
      }
      // Remove just this op by id, not by index, since the queue may
      // have grown while sendOp() was in flight.
      writeQueue(readQueue().filter((o) => o.id !== op.id));
      notify();
    }
  } finally {
    flushing = false;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", flush);
  setInterval(flush, 15000);
}
