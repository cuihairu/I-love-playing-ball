import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveRuntimeConfig } from "./runtime-config.js";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("resolveRuntimeConfig", () => {
  it("uses the explicitly provided base url", () => {
    expect(resolveRuntimeConfig("https://api.example.com")).toEqual({
      apiBaseUrl: "https://api.example.com"
    });
  });

  it("trims trailing slashes from the provided base url", () => {
    expect(resolveRuntimeConfig("https://api.example.com///").apiBaseUrl).toBe(
      "https://api.example.com"
    );
  });

  it("reads the base url from GAME_API_BASE_URL when not provided", () => {
    vi.stubEnv("GAME_API_BASE_URL", "http://10.0.0.2:9000");

    expect(resolveRuntimeConfig().apiBaseUrl).toBe("http://10.0.0.2:9000");
  });

  it("trims trailing slashes from the env base url", () => {
    vi.stubEnv("GAME_API_BASE_URL", "http://10.0.0.2:9000/");

    expect(resolveRuntimeConfig().apiBaseUrl).toBe("http://10.0.0.2:9000");
  });

  it("prefers the explicit url over the environment", () => {
    vi.stubEnv("GAME_API_BASE_URL", "http://from-env");

    expect(resolveRuntimeConfig("http://explicit").apiBaseUrl).toBe("http://explicit");
  });

  it("falls back to the browser origin when available", () => {
    vi.stubGlobal("window", { location: { origin: "https://play.example.com" } });

    expect(resolveRuntimeConfig().apiBaseUrl).toBe("https://play.example.com");
  });

  it("falls back to the local default outside the browser", () => {
    expect(resolveRuntimeConfig().apiBaseUrl).toBe("http://127.0.0.1:3000");
  });
});
