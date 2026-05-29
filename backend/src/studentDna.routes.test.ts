import jwt from "jsonwebtoken";
import request from "supertest";
import { app } from "./app";
import * as service from "./studentDna.service";

jest.mock("./studentDna.service");

const userId = "11111111-1111-1111-1111-111111111111";
const token = jwt.sign({ userId }, process.env.JWT_SECRET || "dev-secret");

const payload = {
  userId,
  language: "en",
  goal: "fullstack",
  currentLevel: "beginner",
  dailyTimeMinutes: 90,
  learningStyles: ["video", "coding"],
  mentorPersonality: "strict",
  weakAreas: ["algorithms"],
  strongAreas: ["html"],
  preferredStudyTime: "night"
};

const path = {
  title: "fullstack beginner path",
  dailyTimeMinutes: 90,
  mentor: "strict" as const,
  phases: ["Foundation"]
};

describe("student DNA routes", () => {
  beforeEach(() => jest.resetAllMocks());

  it("creates a profile", async () => {
    jest.mocked(service.generateLearningPath).mockResolvedValue(path);
    jest.mocked(service.createProfile).mockResolvedValue({ user_id: userId, ...payload });

    const res = await request(app)
      .post("/api/student/dna")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.profile.user_id).toBe(userId);
    expect(res.body.generatedPath).toEqual(path);
  });

  it("rejects invalid input", async () => {
    const res = await request(app)
      .post("/api/student/dna")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...payload, dailyTimeMinutes: 5 });

    expect(res.status).toBe(400);
  });

  it("gets a profile", async () => {
    jest.mocked(service.getProfile).mockResolvedValue({ user_id: userId });

    const res = await request(app)
      .get(`/api/student/dna/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.profile.user_id).toBe(userId);
  });

  it("updates a profile", async () => {
    jest.mocked(service.updateProfile).mockResolvedValue({
      profile: { user_id: userId },
      generatedPath: { ...path, phases: ["Updated"] }
    });

    const res = await request(app)
      .put(`/api/student/dna/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.generatedPath.phases).toEqual(["Updated"]);
  });
});
