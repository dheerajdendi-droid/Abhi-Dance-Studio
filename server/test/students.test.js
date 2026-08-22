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
    await agent
      .put("/api/settings")
      .send({ junior_rate: 6, intermediate_rate: 8, senior_rate: 9, advanced_rate: 12 });
    const cls = await createClass(agent);
    await createStudent(agent, cls.id, { name: "Junior Jo", level: "junior" });
    await createStudent(agent, cls.id, { name: "Intermediate Ivy", level: "intermediate" });
    await createStudent(agent, cls.id, { name: "Senior Sam", level: "senior" });
    await createStudent(agent, cls.id, { name: "Advanced Amy", level: "advanced" });

    const res = await agent.get("/api/students");
    const jo = res.body.find((s) => s.name === "Junior Jo");
    const ivy = res.body.find((s) => s.name === "Intermediate Ivy");
    const sam = res.body.find((s) => s.name === "Senior Sam");
    const amy = res.body.find((s) => s.name === "Advanced Amy");
    expect(Number(jo.rate)).toBe(6);
    expect(Number(ivy.rate)).toBe(8);
    expect(Number(sam.rate)).toBe(9);
    expect(Number(amy.rate)).toBe(12);
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
    await agent
      .put("/api/settings")
      .send({ junior_rate: 5, intermediate_rate: 8, senior_rate: 7, advanced_rate: 12 });
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

  it("changing a student's tier does not rewrite earlier attendance's billed rate", async () => {
    await agent
      .put("/api/settings")
      .send({ junior_rate: 5, intermediate_rate: 8, senior_rate: 7, advanced_rate: 12 });
    const cls = await createClass(agent);
    const student = await createStudent(agent, cls.id, { level: "junior" });

    await agent
      .post("/api/attendance")
      .send({ student_id: student.id, class_id: cls.id, session_date: "2026-04-02" });

    const putRes = await agent.put(`/api/students/${student.id}`).send({ level: "intermediate" });
    expect(putRes.body.level).toBe("intermediate");

    await agent
      .post("/api/attendance")
      .send({ student_id: student.id, class_id: cls.id, session_date: "2026-04-09" });

    const res = await agent.get(`/api/students/${student.id}/history`);
    const april = res.body.months.find((m) => m.month === "2026-04");
    expect(april.sessions).toBe(2);
    expect(april.amountOwed).toBe(13); // 1 × £5 (junior, unchanged) + 1 × £8 (intermediate)
    expect(april.lines).toHaveLength(2);
    expect(april.lines.find((l) => l.tierLabel === "junior")).toMatchObject({ sessions: 1, rate: 5 });
    expect(april.lines.find((l) => l.tierLabel === "intermediate")).toMatchObject({ sessions: 1, rate: 8 });
  });
});
