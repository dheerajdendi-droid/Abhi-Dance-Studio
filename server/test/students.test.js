const app = require("../index");
const { resetDb, authedAgent, createClass, createStudent } = require("./helpers");

describe("students", () => {
  let agent;

  beforeAll(async () => {
    await resetDb();
    agent = await authedAgent(app);
  });

  beforeEach(async () => {
    await resetDb();
  });

  it("resolves rate from settings by level", async () => {
    await agent.put("/api/settings").send({ junior_rate: 6, senior_rate: 9 });
    const cls = await createClass(agent);
    await createStudent(agent, cls.id, { name: "Junior Jo", level: "junior" });
    await createStudent(agent, cls.id, { name: "Senior Sam", level: "senior" });

    const res = await agent.get("/api/students");
    const jo = res.body.find((s) => s.name === "Junior Jo");
    const sam = res.body.find((s) => s.name === "Senior Sam");
    expect(Number(jo.rate)).toBe(6);
    expect(Number(sam.rate)).toBe(9);
  });

  it("soft-deletes a student instead of removing the row", async () => {
    const cls = await createClass(agent);
    const student = await createStudent(agent, cls.id);

    const delRes = await agent.delete(`/api/students/${student.id}`);
    expect(delRes.status).toBe(204);

    const activeOnly = await agent.get("/api/students");
    expect(activeOnly.body.find((s) => s.id === student.id)).toBeUndefined();

    const withInactive = await agent.get("/api/students?include_inactive=true");
    const found = withInactive.body.find((s) => s.id === student.id);
    expect(found).toBeDefined();
    expect(found.active).toBe(false);
  });

  it("computes attendance history month totals correctly", async () => {
    await agent.put("/api/settings").send({ junior_rate: 5, senior_rate: 7 });
    const cls = await createClass(agent);
    const student = await createStudent(agent, cls.id, { level: "junior" });

    await agent
      .post("/api/attendance")
      .send({ student_id: student.id, class_id: cls.id, session_date: "2026-03-07" });
    await agent
      .post("/api/attendance")
      .send({ student_id: student.id, class_id: cls.id, session_date: "2026-03-14" });

    const res = await agent.get(`/api/students/${student.id}/history`);
    expect(res.body.months).toHaveLength(1);
    expect(res.body.months[0]).toMatchObject({ month: "2026-03", sessions: 2, amountOwed: 10, paid: false });
  });
});
