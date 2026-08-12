const request = require("supertest");
const app = require("../index");
const { resetDb, authedAgent, createClass, createStudent } = require("./helpers");

describe("classes", () => {
  let agent;

  beforeAll(async () => {
    await resetDb();
    agent = await authedAgent(app);
  });

  beforeEach(async () => {
    await resetDb();
  });

  it("creates and lists a class", async () => {
    const created = await createClass(agent, { name: "Juniors", day_of_week: "Saturday", time: "10:00" });
    expect(created.id).toBeDefined();

    const res = await agent.get("/api/classes");
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ name: "Juniors", day_of_week: "Saturday", student_count: 0 });
  });

  it("rejects an invalid day of week", async () => {
    const res = await agent.post("/api/classes").send({ name: "X", day_of_week: "Someday", time: "10:00" });
    expect(res.status).toBe(400);
  });

  it("updates a class", async () => {
    const created = await createClass(agent);
    const res = await agent
      .put(`/api/classes/${created.id}`)
      .send({ name: "Renamed", day_of_week: "Sunday", time: "11:00" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Renamed");
  });

  it("deletes a class with no students", async () => {
    const created = await createClass(agent);
    const res = await agent.delete(`/api/classes/${created.id}`);
    expect(res.status).toBe(204);
  });

  it("blocks deleting a class with an active student", async () => {
    const created = await createClass(agent);
    await createStudent(agent, created.id);
    const res = await agent.delete(`/api/classes/${created.id}`);
    expect(res.status).toBe(409);
  });
});
