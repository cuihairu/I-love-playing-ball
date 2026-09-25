import { describe, expect, it, vi } from "vitest";

import { getDefaultGameplayConfig } from "@i-love-playing-ball/game-config";

import { GameClient } from "./game-client.js";
import type { GameApi, LeaderboardEntry, PlatformFacade } from "../types.js";

function createApiStub(overrides: Partial<Record<keyof GameApi, GameApi[keyof GameApi]>> = {}) {
  const leaderboard: LeaderboardEntry[] = [
    { playerId: "p1", playerName: "小鸡一号", score: 30, createdAt: "2026-01-01T00:00:00.000Z" }
  ];

  return {
    getGameplayConfig: vi.fn(async () => getDefaultGameplayConfig()),
    getLeaderboard: vi.fn(async () => leaderboard),
    submitLeaderboard: vi.fn(async (entry: { playerId: string; playerName: string; score: number }) => ({
      ...entry,
      createdAt: "2026-01-02T00:00:00.000Z"
    })),
    ...overrides
  } as unknown as GameApi & Record<keyof GameApi, ReturnType<typeof vi.fn>>;
}

function createPlatformStub() {
  const saved: number[] = [];
  let best = 0;

  return {
    platformName: "web",
    loadBestScore: vi.fn(() => best),
    saveBestScore: vi.fn((score: number) => {
      saved.push(score);
      if (score > best) {
        best = score;
      }
    }),
    showReviveAd: vi.fn(async () => true),
    saved
  } as unknown as PlatformFacade & { saved: number[] };
}

describe("GameClient.loadGameplayConfig", () => {
  it("returns the api config on success", async () => {
    const api = createApiStub();
    const client = new GameClient(api, createPlatformStub());

    await expect(client.loadGameplayConfig()).resolves.toEqual(getDefaultGameplayConfig());
    expect(api.getGameplayConfig).toHaveBeenCalledTimes(1);
  });

  it("falls back to the default config when the api fails", async () => {
    const client = new GameClient(
      createApiStub({ getGameplayConfig: vi.fn(async () => {
        throw new Error("network down");
      }) }),
      createPlatformStub()
    );

    await expect(client.loadGameplayConfig()).resolves.toEqual(getDefaultGameplayConfig());
  });
});

describe("GameClient.loadLeaderboard", () => {
  it("returns the api entries on success", async () => {
    const client = new GameClient(createApiStub(), createPlatformStub());

    const entries = await client.loadLeaderboard();
    expect(entries).toHaveLength(1);
    expect(entries[0].playerId).toBe("p1");
  });

  it("falls back to an empty list when the api fails", async () => {
    const client = new GameClient(
      createApiStub({ getLeaderboard: vi.fn(async () => {
        throw new Error("network down");
      }) }),
      createPlatformStub()
    );

    await expect(client.loadLeaderboard()).resolves.toEqual([]);
  });
});

describe("GameClient.submitScore", () => {
  it("submits and records the entry", async () => {
    const api = createApiStub();
    const platform = createPlatformStub();
    const client = new GameClient(api, platform);

    const entry = await client.submitScore({ playerId: "p1", playerName: "鸡你太投", score: 28 });

    expect(entry?.score).toBe(28);
    expect(api.submitLeaderboard).toHaveBeenCalledWith({
      playerId: "p1",
      playerName: "鸡你太投",
      score: 28
    });
    expect(platform.saved).toEqual([28]);
    expect(client.getBestScore()).toBe(28);
  });

  it("still saves the best score when syncing is disabled", async () => {
    const api = createApiStub();
    const platform = createPlatformStub();
    const client = new GameClient(api, platform);

    const entry = await client.submitScore({
      playerId: "p1",
      playerName: "鸡你太投",
      score: 28,
      syncToLeaderboard: false
    });

    expect(entry).toBeNull();
    expect(api.submitLeaderboard).not.toHaveBeenCalled();
    expect(platform.saved).toEqual([28]);
  });

  it("returns null when the submission fails", async () => {
    const platform = createPlatformStub();
    const client = new GameClient(
      createApiStub({ submitLeaderboard: vi.fn(async () => {
        throw new Error("network down");
      }) }),
      platform
    );

    await expect(
      client.submitScore({ playerId: "p1", playerName: "鸡你太投", score: 5 })
    ).resolves.toBeNull();
    expect(platform.saved).toEqual([5]);
  });
});

describe("GameClient.tryRevive", () => {
  it("delegates to the platform ad", async () => {
    const platform = createPlatformStub();
    const client = new GameClient(createApiStub(), platform);

    await expect(client.tryRevive("ad-unit")).resolves.toBe(true);
    expect(platform.showReviveAd).toHaveBeenCalledWith("ad-unit");
  });
});
