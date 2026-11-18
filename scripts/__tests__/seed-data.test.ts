import { describe, it, expect } from "vitest";
import {
  users,
  communities,
  posts,
  threads,
  fillerPools,
  parseOffsetToMinutes,
  countThreadComments,
} from "../seed-data";

describe("Curia Seed Data Counts & Integrity", () => {
  it("has exactly 12 demo users", () => {
    expect(users).toHaveLength(12);
    // Check all usernames are unique
    const usernames = new Set(users.map((u) => u.username));
    expect(usernames.size).toBe(12);
  });

  it("has exactly 8 communities with 3 rules each and valid creators", () => {
    expect(communities).toHaveLength(8);
    for (const comm of communities) {
      expect(comm.rules).toHaveLength(3);
      expect(users.some((u) => u.username === comm.creator)).toBe(true);
      expect(comm.members.length).toBeGreaterThan(0);
    }
  });

  it("has exactly 24 posts with keys P01 through P24", () => {
    expect(posts).toHaveLength(24);
    const postKeys = posts.map((p) => p.key).sort();
    for (let i = 1; i <= 24; i++) {
      const expectedKey = `P${i.toString().padStart(2, "0")}`;
      expect(postKeys).toContain(expectedKey);
    }
  });

  it("has exactly 42 hand-written comments across threads T1 to T4", () => {
    const t1Count = countThreadComments(threads.T1);
    const t2Count = countThreadComments(threads.T2);
    const t3Count = countThreadComments(threads.T3);
    const t4Count = countThreadComments(threads.T4);

    expect(t1Count).toBe(14);
    expect(t2Count).toBe(13);
    expect(t3Count).toBe(7);
    expect(t4Count).toBe(8);

    const totalHandWritten = t1Count + t2Count + t3Count + t4Count;
    expect(totalHandWritten).toBe(42);
  });

  it("matches thread comment counts with post targetCommentCounts", () => {
    const postMap = new Map(posts.map((p) => [p.key, p]));

    expect(countThreadComments(threads.T1)).toBe(postMap.get("P01")?.targetCommentCount);
    expect(countThreadComments(threads.T2)).toBe(postMap.get("P04")?.targetCommentCount);
    expect(countThreadComments(threads.T3)).toBe(postMap.get("P22")?.targetCommentCount);
    expect(countThreadComments(threads.T4)).toBe(postMap.get("P07")?.targetCommentCount);
  });

  it("has exactly 16 generic filler comments and 2 per community", () => {
    expect(fillerPools.generic).toHaveLength(16);
    expect(Object.keys(fillerPools.perCommunity)).toHaveLength(8);
    for (const comm of communities) {
      expect(fillerPools.perCommunity[comm.name]).toHaveLength(2);
    }
  });

  it("correctly parses time offsets to minutes", () => {
    expect(parseOffsetToMinutes("+12m")).toBe(12);
    expect(parseOffsetToMinutes("+1h")).toBe(60);
    expect(parseOffsetToMinutes("+1h 20m")).toBe(80);
    expect(parseOffsetToMinutes("+2h 30m")).toBe(150);
    expect(parseOffsetToMinutes("+3d")).toBe(4320);
    expect(parseOffsetToMinutes("45m")).toBe(45);
  });
});
