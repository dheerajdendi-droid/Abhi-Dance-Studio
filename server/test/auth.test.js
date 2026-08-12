const request = require("supertest");
const app = require("../index");
const { resetDb, getPool } = require("./helpers");

describe("auth", () => {
  beforeEach(async () => {
    await resetDb();
    // resetDb() doesn't touch pin_hash — clear it explicitly so each test
    // in this file starts from a genuine "no PIN set" state.
    await getPool().query("UPDATE settings SET pin_hash = NULL WHERE id = 1");
  });

  it("rejects a PIN that isn't 4-6 digits", async () => {
    const res = await request(app).post("/api/auth/setup").send({ pin: "12" });
    expect(res.status).toBe(400);
  });

  it("sets up a PIN and authenticates the session", async () => {
    const agent = request.agent(app);
    const setupRes = await agent.post("/api/auth/setup").send({ pin: "1234" });
    expect(setupRes.status).toBe(200);

    const meRes = await agent.get("/api/auth/me");
    expect(meRes.body).toEqual({ authenticated: true, pinSet: true });
  });

  it("refuses to set up a PIN twice", async () => {
    await request.agent(app).post("/api/auth/setup").send({ pin: "1234" });
    const res = await request(app).post("/api/auth/setup").send({ pin: "5678" });
    expect(res.status).toBe(409);
  });

  it("rejects an incorrect PIN on login", async () => {
    await request.agent(app).post("/api/auth/setup").send({ pin: "1234" });
    const res = await request(app).post("/api/auth/login").send({ pin: "9999" });
    expect(res.status).toBe(401);
  });

  it("accepts the correct PIN on login", async () => {
    await request.agent(app).post("/api/auth/setup").send({ pin: "1234" });
    const agent = request.agent(app);
    const res = await agent.post("/api/auth/login").send({ pin: "1234" });
    expect(res.status).toBe(200);
  });

  it("blocks protected routes without a session", async () => {
    const res = await request(app).get("/api/classes");
    expect(res.status).toBe(401);
  });
});
