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
    await agent.put("/api/settings").send({ junior_rate: 5, intermediate_rate: 6, senior_rate: 8 });
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
    expect(res.body[0].students[0]).toMatchObject({ sessions: 2, rate: 5, amount: 10, paid: false });
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
});
