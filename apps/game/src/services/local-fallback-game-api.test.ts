import { describe, expect, it } from "vitest";

import { getDefaultGameplayConfig } from "@i-love-playing-ball/game-config";

import { LocalFallbackGameApi } from "./local-fallback-game-api.js";

describe("LocalFallbackGameApi", () => {
  it("serves the default gameplay config", async () => {
    const api = new LocalFallbackGameApi();

    await expect(api.getGameplayConfig()).resolves.toEqual(getDefaultGameplayConfig());
  });

  it("seeds one local leaderboard entry", async () => {
    const api = new LocalFallbackGameApi();

    const entries = await api.getLeaderboard();
    expect(entries).toHaveLength(1);
    expect(entries[0].playerId).toBe("local-1");
    expect(entries[0].playerName).toBe("本地小鸡");
    expect(entries[0].score).toBe(12);
  });

  it("appends submitted entries and sorts them by score desc", async () => {
    const api = new LocalFallbackGameApi();

    await api.submitLeaderboard({ playerId: "a", playerName: "a", score: 5 });
    const saved = await api.submitLeaderboard({ playerId: "b", playerName: "b", score: 50 });

    expect(saved.playerId).toBe("b");
    expect(saved.score).toBe(50);
    expect(typeof saved.createdAt).toBe("string");

    const entries = await api.getLeaderboard();
    expect(entries.map((entry) => entry.score)).toEqual([50, 12, 5]);
  });

  it("keeps instances isolated from each other", async () => {
    const first = new LocalFallbackGameApi();
    const second = new LocalFallbackGameApi();

    await first.submitLeaderboard({ playerId: "a", playerName: "a", score: 5 });

    expect(await first.getLeaderboard()).toHaveLength(2);
    expect(await second.getLeaderboard()).toHaveLength(1);
  });
});
