const app = require("../index");
const { resetDb, authedAgent, createClass } = require("./helpers");

describe("outgoings", () => {
  let agent;

  beforeAll(async () => {
    await resetDb();
    agent = await authedAgent(app);
  });

  beforeEach(async () => {
    await resetDb();
  });

  it("rejects an invalid category and a non-positive amount", async () => {
    const cls = await createClass(agent);
    const badCategory = await agent
      .post("/api/outgoings")
      .send({ class_id: cls.id, session_date: "2026-07-04", category: "bogus", amount: 5 });
    expect(badCategory.status).toBe(400);

    const badAmount = await agent
      .post("/api/outgoings")
      .send({ class_id: cls.id, session_date: "2026-07-04", category: "hall_rent", amount: -5 });
    expect(badAmount.status).toBe(400);
  });

  it("adds and lists outgoings for a specific session", async () => {
    const cls = await createClass(agent);
    await agent
      .post("/api/outgoings")
      .send({ class_id: cls.id, session_date: "2026-07-04", category: "hall_rent", label: "Hall", amount: 20 })
      .expect(201);
    await agent
      .post("/api/outgoings")
      .send({
        class_id: cls.id,
        session_date: "2026-07-04",
        category: "teaching_assistant",
        label: "Priya",
        amount: 15,
      })
      .expect(201);

    const res = await agent.get(`/api/outgoings?class_id=${cls.id}&date=2026-07-04`);
    expect(res.body).toHaveLength(2);
  });

  it("suggestions surface the most recent amount per category+label", async () => {
    const cls = await createClass(agent);
    await agent
      .post("/api/outgoings")
      .send({ class_id: cls.id, session_date: "2026-07-04", category: "hall_rent", label: "Hall", amount: 18 });
    await agent
      .post("/api/outgoings")
      .send({ class_id: cls.id, session_date: "2026-07-11", category: "hall_rent", label: "Hall", amount: 20 });

    const res = await agent.get(`/api/outgoings/suggestions?class_id=${cls.id}`);
    expect(res.body).toHaveLength(1);
    expect(Number(res.body[0].amount)).toBe(20);
    expect(res.body[0].session_date).toBe("2026-07-11");
  });

  it("deletes an outgoing", async () => {
    const cls = await createClass(agent);
    const created = await agent
      .post("/api/outgoings")
      .send({ class_id: cls.id, session_date: "2026-07-04", category: "other", amount: 12 });

    await agent.delete(`/api/outgoings/${created.body.id}`).expect(204);
    const res = await agent.get(`/api/outgoings?class_id=${cls.id}&date=2026-07-04`);
    expect(res.body).toHaveLength(0);
  });
});
