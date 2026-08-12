import { beforeEach, describe, expect, it, vi } from "vitest";

class MemoryStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
}

describe("attendanceQueue", () => {
  let enqueue, queueSize;

  beforeEach(async () => {
    vi.resetModules();
    globalThis.localStorage = new MemoryStorage();
    globalThis.fetch = vi.fn(async () => ({ ok: true }));
    // `window` is intentionally left undefined here so the module's
    // online-event/setInterval wiring doesn't run during unit tests.
    ({ enqueue, queueSize } = await import("./attendanceQueue.js"));
  });

  it("sends every concurrently-enqueued op exactly once and drains the queue", async () => {
    // Regression test for a real race condition we hit: firing several
    // enqueue() calls synchronously (e.g. "Mark everyone here" looping over
    // students) used to silently drop ops, because flush() worked off a
    // stale in-memory snapshot of the queue instead of re-reading it fresh
    // after each concurrently-appended op.
    for (let i = 1; i <= 5; i++) {
      enqueue({ type: "mark", student_id: i, class_id: 1, session_date: "2026-08-11" });
    }

    // enqueue() kicks off flush() itself in the background — wait for it
    // to actually finish draining, the same way the app relies on it.
    await vi.waitFor(() => expect(queueSize()).toBe(0));

    expect(globalThis.fetch).toHaveBeenCalledTimes(5);
    const sentStudentIds = globalThis.fetch.mock.calls.map(
      ([, options]) => JSON.parse(options.body).student_id
    );
    expect(new Set(sentStudentIds)).toEqual(new Set([1, 2, 3, 4, 5]));
  });

  it("stops on a failed send and leaves the rest queued for retry", async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 500 }));
    enqueue({ type: "mark", student_id: 1, class_id: 1, session_date: "2026-08-11" });

    // Give the background flush a moment to attempt the (failing) send.
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(queueSize()).toBe(1);
  });
});
