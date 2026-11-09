const REQUEST_TIMEOUT_MS = 15000;
export const UNAVAILABLE_MESSAGE = "Can't reach the server right now. This is not a PIN problem.";

function unavailableError(status) {
  const err = new Error(UNAVAILABLE_MESSAGE);
  err.status = status;
  err.unavailable = true;
  return err;
}

async function request(path, options = {}) {
  // Without a timeout, a hung server leaves the UI waiting forever.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(`/api${path}`, {
      credentials: "include",
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
      ...options,
      signal: controller.signal,
    });
  } catch {
    // Network failure or timeout (abort).
    throw unavailableError(0);
  } finally {
    clearTimeout(timer);
  }

  if (res.status >= 500) throw unavailableError(res.status);

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const data = await res.json();
      if (data && data.error) message = data.error;
    } catch {
      // ignore non-JSON error bodies
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  del: (path) => request(path, { method: "DELETE" }),
};
