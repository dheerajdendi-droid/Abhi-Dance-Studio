const app = require("../index");
const { resetDb, authedAgent, createClass, createStudent } = require("./helpers");

describe("attendance", () => {
  let agent;

  beforeAll(async () => {
    await resetDb();
    agent = await authedAgent(app);
  });

  beforeEach(async () => {
    await resetDb();
  });

  it("marking present twice does not duplicate", async () => {
    const cls = await createClass(agent);
    const student = await createStudent(agent, cls.id);
    const body = { student_id: student.id, class_id: cls.id, session_date: "2026-05-02" };

    await agent.post("/api/attendance").send(body).expect(204);
    await agent.post("/api/attendance").send(body).expect(204);

    const res = await agent.get(`/api/attendance?class_id=${cls.id}&date=2026-05-02`);
    expect(res.body.presentStudentIds).toEqual([student.id]);
  });

  it("clearing an absent student is a no-op, not an error", async () => {
    const cls = await createClass(agent);
    const student = await createStudent(agent, cls.id);
    const res = await agent.delete(`/api/attendance/${student.id}/2026-05-02`);
    expect(res.status).toBe(204);
  });

  it("bulk-marks and bulk-clears a whole class", async () => {
    const cls = await createClass(agent);
    const s1 = await createStudent(agent, cls.id, { name: "A" });
    const s2 = await createStudent(agent, cls.id, { name: "B" });

    const markRes = await agent
      .post("/api/attendance/bulk-mark")
      .send({ class_id: cls.id, session_date: "2026-05-02", student_ids: [s1.id, s2.id] });
    expect(new Set(markRes.body.presentStudentIds)).toEqual(new Set([s1.id, s2.id]));

    const clearRes = await agent
      .post("/api/attendance/bulk-clear")
      .send({ class_id: cls.id, session_date: "2026-05-02" });
    expect(clearRes.body.presentStudentIds).toEqual([]);
  });

  it("rejects a malformed date", async () => {
    const cls = await createClass(agent);
    const student = await createStudent(agent, cls.id);
    const res = await agent
      .post("/api/attendance")
      .send({ student_id: student.id, class_id: cls.id, session_date: "not-a-date" });
    expect(res.status).toBe(400);
  });
});
