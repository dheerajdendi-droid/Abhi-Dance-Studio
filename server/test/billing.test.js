const app = require("../index");
const { resetDb, authedAgent, createClass, createStudent } = require("./helpers");

describe("billing", () => {
  let agent;

  beforeAll(async () => {
    await resetDb();
    agent = await authedAgent(app);
  });

  beforeEach(async () => {
    await resetDb();
  });

  it("computes sessions × rate and groups by class", async () => {
    await agent
      .put("/api/settings")
      .send({ junior_rate: 5, intermediate_rate: 6, senior_rate: 8, advanced_rate: 12 });
    const cls = await createClass(agent, { name: "Juniors" });
    const student = await createStudent(agent, cls.id, { level: "junior" });

    await agent
      .post("/api/attendance")
      .send({ student_id: student.id, class_id: cls.id, session_date: "2026-06-06" });
    await agent
      .post("/api/attendance")
      .send({ student_id: student.id, class_id: cls.id, session_date: "2026-06-13" });

    const res = await agent.get("/api/billing/2026-06");
    expect(res.body).toHaveLength(1);
    expect(res.body[0].className).toBe("Juniors");
    const row = res.body[0].students[0];
    expect(row).toMatchObject({ sessions: 2, amount: 10, paid: false });
    expect(row.lines).toEqual([{ tierLabel: "junior", rate: 5, sessions: 2, amount: 10 }]);
  });

  it("snapshots the rate at attendance time — a mid-month tier change bills as separate lines and never rewrites earlier sessions", async () => {
    await agent
      .put("/api/settings")
      .send({ junior_rate: 5, intermediate_rate: 8, senior_rate: 7, advanced_rate: 12 });
    const cls = await createClass(agent, { name: "Mixed" });
    const student = await createStudent(agent, cls.id, { level: "junior" });

    await agent
      .post("/api/attendance")
      .send({ student_id: student.id, class_id: cls.id, session_date: "2026-07-01" });
    await agent
      .post("/api/attendance")
      .send({ student_id: student.id, class_id: cls.id, session_date: "2026-07-08" });

    await agent.put(`/api/students/${student.id}`).send({ level: "intermediate" });

    await agent
      .post("/api/attendance")
      .send({ student_id: student.id, class_id: cls.id, session_date: "2026-07-15" });

    const res = await agent.get("/api/billing/2026-07");
    const row = res.body[0].students[0];
    expect(row.sessions).toBe(3);
    expect(row.amount).toBe(18); // 2 × £5 (junior, before the change) + 1 × £8 (intermediate, after)
    expect(row.lines).toHaveLength(2);
    expect(row.lines.find((l) => l.tierLabel === "junior")).toMatchObject({ sessions: 2, rate: 5, amount: 10 });
    expect(row.lines.find((l) => l.tierLabel === "intermediate")).toMatchObject({
      sessions: 1,
      rate: 8,
      amount: 8,
    });
  });

  it("outstanding excludes paid months and sorts oldest first", async () => {
    const cls = await createClass(agent);
    const student = await createStudent(agent, cls.id);

    await agent
      .post("/api/attendance")
      .send({ student_id: student.id, class_id: cls.id, session_date: "2026-01-10" });
    await agent
      .post("/api/attendance")
      .send({ student_id: student.id, class_id: cls.id, session_date: "2026-03-10" });
    await agent.put(`/api/payments/${student.id}/2026-01`).send({ paid: true });

    const res = await agent.get("/api/billing/outstanding");
    expect(res.body).toHaveLength(1);
    expect(res.body[0].month).toBe("2026-03");
  });

  it("bills a Standard student at the Standard rate and every other tier at its own rate", async () => {
    await agent.put("/api/settings").send({
      junior_rate: 5, intermediate_rate: 8, senior_rate: 7, standard_rate: 10, advanced_rate: 12,
    });
    const cls = await createClass(agent, { name: "All tiers" });
    const tiers = { junior: 5, intermediate: 8, senior: 7, standard: 10, advanced: 12 };
    for (const [level, rate] of Object.entries(tiers)) {
      const student = await createStudent(agent, cls.id, { name: `S-${level}`, level });
      expect(student.level).toBe(level);
      await agent
        .post("/api/attendance")
        .send({ student_id: student.id, class_id: cls.id, session_date: "2026-08-01" });
      const row = (await agent.get("/api/billing/2026-08")).body[0].students.find((r) => r.studentName === `S-${level}`);
      expect(row.lines).toEqual([{ tierLabel: level, rate, sessions: 1, amount: rate }]);
    }
  });

  it("adding/changing the Standard rate never alters past sessions of other tiers", async () => {
    await agent.put("/api/settings").send({
      junior_rate: 5, intermediate_rate: 8, senior_rate: 7, standard_rate: 10, advanced_rate: 12,
    });
    const cls = await createClass(agent, { name: "History" });
    const student = await createStudent(agent, cls.id, { level: "advanced" });
    await agent
      .post("/api/attendance")
      .send({ student_id: student.id, class_id: cls.id, session_date: "2026-08-01" });

    await agent.put("/api/settings").send({
      junior_rate: 5, intermediate_rate: 8, senior_rate: 7, standard_rate: 11, advanced_rate: 12,
    });

    const row = (await agent.get("/api/billing/2026-08")).body[0].students[0];
    expect(row.lines).toEqual([{ tierLabel: "advanced", rate: 12, sessions: 1, amount: 12 }]);
  });

  it("settings PUT without standard_rate (older cached client) keeps the stored Standard rate", async () => {
    await agent.put("/api/settings").send({
      junior_rate: 5, intermediate_rate: 8, senior_rate: 7, standard_rate: 10.5, advanced_rate: 12,
    });
    const res = await agent
      .put("/api/settings")
      .send({ junior_rate: 5, intermediate_rate: 8, senior_rate: 7, advanced_rate: 12 });
    expect(res.status).toBe(200);
    expect(Number(res.body.standard_rate)).toBe(10.5);
  });

  it("rejects an invalid standard_rate", async () => {
    const res = await agent.put("/api/settings").send({
      junior_rate: 5, intermediate_rate: 8, senior_rate: 7, standard_rate: -1, advanced_rate: 12,
    });
    expect(res.status).toBe(400);
  });
});
