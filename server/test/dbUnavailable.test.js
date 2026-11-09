const request = require("supertest");
const app = require("../index");
const { pool } = require("../db");

// Regression: a database outage used to leave requests hanging (Express 4
// ignores rejected async handlers), which made the app look like a PIN fault.
describe("database unavailable", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("answers /api/auth/me with 503 instead of hanging", async () => {
    const err = Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" });
    vi.spyOn(pool, "query").mockRejectedValue(err);
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(503);
    expect(res.body.error).toBe("Database unavailable");
  });

  it("maps a pg connection timeout to 503", async () => {
    vi.spyOn(pool, "query").mockRejectedValue(new Error("timeout exceeded when trying to connect"));
    const res = await request(app).post("/api/auth/login").send({ pin: "1234" });
    expect(res.status).toBe(503);
  });

  it("does not turn ordinary errors into 503", async () => {
    vi.spyOn(pool, "query").mockRejectedValue(new Error("some bug"));
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(500);
  });
});
