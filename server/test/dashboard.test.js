const app = require("../index");
const { resetDb, authedAgent, createClass, createStudent, currentMonth } = require("./helpers");

describe("dashboard", () => {
  let agent;

  beforeAll(async () => {
    await resetDb();
    agent = await authedAgent(app);
  });

  beforeEach(async () => {
    await resetDb();
  });

  it("summary totals match hand-computed fixtures", async () => {
    await agent.put("/api/settings").send({ junior_rate: 5, intermediate_rate: 5, senior_rate: 5 });
    const cls = await createClass(agent);
    const s1 = await createStudent(agent, cls.id);
    const s2 = await createStudent(agent, cls.id);

    const thisMonth = currentMonth();
    const sessionDate = `${thisMonth}-15`;
    await agent.post("/api/attendance").send({ student_id: s1.id, class_id: cls.id, session_date: sessionDate });
    await agent.post("/api/attendance").send({ student_id: s2.id, class_id: cls.id, session_date: sessionDate });
    await agent.put(`/api/payments/${s1.id}/${thisMonth}`).send({ paid: true });

    const res = await agent.get("/api/dashboard/summary");
    expect(res.body).toMatchObject({
      activeStudents: 2,
      classesRunning: 1,
      thisMonthBilled: 10,
      allTimeOutstanding: 5, // only s2's session is unpaid
    });
  });

  it("aggregates per-class headcount/sessions/billed for a given month", async () => {
    await agent.put("/api/settings").send({ junior_rate: 5, intermediate_rate: 5, senior_rate: 5 });
    const clsA = await createClass(agent, { name: "A" });
    const clsB = await createClass(agent, { name: "B" });
    const s1 = await createStudent(agent, clsA.id);
    await createStudent(agent, clsB.id); // no attendance for B

    await agent
      .post("/api/attendance")
      .send({ student_id: s1.id, class_id: clsA.id, session_date: "2026-04-04" });

    const res = await agent.get("/api/dashboard/classes?month=2026-04");
    const a = res.body.classes.find((c) => c.className === "A");
    const b = res.body.classes.find((c) => c.className === "B");
    expect(a).toMatchObject({ studentCount: 1, sessions: 1, billed: 5 });
    expect(b).toMatchObject({ studentCount: 1, sessions: 0, billed: 0 });
  });
});
