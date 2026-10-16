import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { createRun } from "../runController";
import { AuthRequest } from "../../middleware/auth";

describe("Run Controller API Validation", () => {
  after(async () => {
    await mongoose.disconnect();
  });
  it("returns 400 when research topic is empty or missing", async () => {
    let responseStatus = 0;
    let responseJson: any = null;

    const req = {
      body: { topic: "" },
      userId: "user-test-123",
      app: { locals: { io: null } },
    } as unknown as AuthRequest;

    const res = {
      status(code: number) {
        responseStatus = code;
        return this;
      },
      json(payload: any) {
        responseJson = payload;
        return this;
      },
    } as any;

    await createRun(req, res);
    assert.equal(responseStatus, 400);
    assert(responseJson?.error?.includes("required"));
  });

  it("returns 400 when research topic is too short (< 3 characters)", async () => {
    let responseStatus = 0;
    let responseJson: any = null;

    const req = {
      body: { topic: "ab" },
      userId: "user-test-123",
      app: { locals: { io: null } },
    } as unknown as AuthRequest;

    const res = {
      status(code: number) {
        responseStatus = code;
        return this;
      },
      json(payload: any) {
        responseJson = payload;
        return this;
      },
    } as any;

    await createRun(req, res);
    assert.equal(responseStatus, 400);
    assert(responseJson?.error?.includes("at least 3 characters"));
  });

  it("returns 400 when research topic exceeds 500 characters", async () => {
    let responseStatus = 0;
    let responseJson: any = null;

    const req = {
      body: { topic: "A".repeat(501) },
      userId: "user-test-123",
      app: { locals: { io: null } },
    } as unknown as AuthRequest;

    const res = {
      status(code: number) {
        responseStatus = code;
        return this;
      },
      json(payload: any) {
        responseJson = payload;
        return this;
      },
    } as any;

    await createRun(req, res);
    assert.equal(responseStatus, 400);
    assert(responseJson?.error?.includes("cannot exceed 500 characters"));
  });
});
