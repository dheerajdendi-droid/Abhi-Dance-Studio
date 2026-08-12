// Regression test for a real bug we hit: node-postgres parses SQL DATE
// columns into JS Date objects at local midnight, which then shifts by a
// day once JSON.stringify converts them to UTC (fixed via a custom pg type
// parser in server/db.js + explicit to_char() casts in students.js).
const app = require("../index");
const { resetDb, authedAgent, createClass, createStudent } = require("./helpers");

describe("date handling", () => {
  let agent;

  beforeAll(async () => {
    await resetDb();
    agent = await authedAgent(app);
  });

  beforeEach(async () => {
    await resetDb();
  });

  it("round-trips session dates with no timezone drift", async () => {
    const cls = await createClass(agent);
    const student = await createStudent(agent, cls.id);
    const sessionDate = "2026-08-11";

    await agent
      .post("/api/attendance")
      .send({ student_id: student.id, class_id: cls.id, session_date: sessionDate });

    const historyRes = await agent.get(`/api/students/${student.id}/history`);
    expect(historyRes.body.months[0].dates).toEqual([sessionDate]);

    await agent.put(`/api/payments/${student.id}/2026-08`).send({ paid: true });
    const paymentRes = await agent.get(`/api/students/${student.id}/history`);
    // paid_date is set server-side to CURRENT_DATE — just assert it's a
    // plain 'YYYY-MM-DD' string, not an ISO datetime with a shifted day.
    expect(paymentRes.body.months[0].paidDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
