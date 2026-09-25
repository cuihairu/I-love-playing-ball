import { describe, expect, it, vi } from "vitest";

import { HttpGameApi } from "./http-game-api.js";

type FetchCall = { input: string; init?: RequestInit };

function createFetchStub(response: { status?: number; statusText?: string; body: unknown }) {
  const calls: FetchCall[] = [];

  const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ input: String(input), init });

    return new Response(JSON.stringify(response.body), {
      status: response.status ?? 200,
      statusText: response.statusText ?? "OK",
      headers: { "Content-Type": "application/json" }
    });
  });

  return { fetchImpl, calls };
}

describe("HttpGameApi", () => {
  it("strips trailing slashes from the base url", async () => {
    const { fetchImpl, calls } = createFetchStub({ body: { data: {} } });
    const api = new HttpGameApi({ baseUrl: "http://api.local:3000///", fetchImpl });

    await api.getGameplayConfig();

    expect(calls[0].input).toBe("http://api.local:3000/config/game");
  });

  it("loads the gameplay config envelope", async () => {
    const config = { game: { roundDurationSeconds: 60 } };
    const { fetchImpl, calls } = createFetchStub({ body: { data: config } });
    const api = new HttpGameApi({ baseUrl: "http://api.local", fetchImpl });

    await expect(api.getGameplayConfig()).resolves.toEqual(config);
    expect(calls[0].input).toBe("http://api.local/config/game");
    expect(calls[0].init).toBeUndefined();
  });

  it("loads the leaderboard", async () => {
    const entries = [{ playerId: "p1", playerName: "n", score: 3, createdAt: "x" }];
    const { fetchImpl, calls } = createFetchStub({ body: { data: entries } });
    const api = new HttpGameApi({ baseUrl: "http://api.local", fetchImpl });

    await expect(api.getLeaderboard()).resolves.toEqual(entries);
    expect(calls[0].input).toBe("http://api.local/leaderboard");
  });

  it("submits leaderboard entries as json posts", async () => {
    const saved = { playerId: "p1", playerName: "ikun", score: 9, createdAt: "now" };
    const { fetchImpl, calls } = createFetchStub({
      status: 201,
      statusText: "Created",
      body: { data: saved }
    });
    const api = new HttpGameApi({ baseUrl: "http://api.local", fetchImpl });

    await expect(
      api.submitLeaderboard({ playerId: "p1", playerName: "ikun", score: 9 })
    ).resolves.toEqual(saved);

    expect(calls[0].input).toBe("http://api.local/leaderboard/submit");
    expect(calls[0].init?.method).toBe("POST");
    expect(new Headers(calls[0].init?.headers).get("Content-Type")).toBe("application/json");
    expect(calls[0].init?.body).toBe(
      JSON.stringify({ playerId: "p1", playerName: "ikun", score: 9 })
    );
  });

  it("throws a descriptive error for non-2xx responses", async () => {
    const { fetchImpl } = createFetchStub({
      status: 500,
      statusText: "Internal Server Error",
      body: {}
    });
    const api = new HttpGameApi({ baseUrl: "http://api.local", fetchImpl });

    await expect(api.getLeaderboard()).rejects.toThrow(
      "Game API request failed: 500 Internal Server Error"
    );
    await expect(api.getGameplayConfig()).rejects.toThrow(
      "Game API request failed: 500 Internal Server Error"
    );
    await expect(
      api.submitLeaderboard({ playerId: "p", playerName: "p", score: 1 })
    ).rejects.toThrow("Game API request failed: 500 Internal Server Error");
  });
});
