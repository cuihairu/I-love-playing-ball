import { describe, expect, it } from "vitest";

import type { PlatformName, PlatformSdk } from "@i-love-playing-ball/platform-sdk";

import { createGameServices } from "./bootstrap.js";
import { HttpGameApi } from "./services/http-game-api.js";
import { LocalFallbackGameApi } from "./services/local-fallback-game-api.js";

function createSdkDouble(platformName: PlatformName = "wechat"): PlatformSdk {
  return {
    getPlatformName: () => platformName,
    login: async () => ({ platform: platformName }),
    createRewardedVideoAd: async () => ({ show: async () => ({ finished: false }) }),
    createInterstitialAd: async () => ({ show: async () => undefined }),
    share: async () => undefined,
    getStorage: () => null,
    setStorage: () => undefined
  };
}

describe("createGameServices", () => {
  it("wires the http api and web platform by default", () => {
    const services = createGameServices({ apiBaseUrl: "http://api.local" });

    expect(services.api).toBeInstanceOf(HttpGameApi);
    expect(services.platform.platformName).toBe("web");
    expect(services.runtime.apiBaseUrl).toBe("http://api.local");
  });

  it("uses the local fallback api when offline", () => {
    const services = createGameServices({ apiBaseUrl: "http://api.local", offline: true });

    expect(services.api).toBeInstanceOf(LocalFallbackGameApi);
    expect(services.platform.platformName).toBe("web");
  });

  it("normalizes trailing slashes in the runtime config", () => {
    const services = createGameServices({ apiBaseUrl: "http://api.local///" });

    expect(services.runtime.apiBaseUrl).toBe("http://api.local");
  });

  it("wraps an injected platform sdk", () => {
    const services = createGameServices({
      apiBaseUrl: "http://api.local",
      platformSdk: createSdkDouble("douyin")
    });

    expect(services.platform.platformName).toBe("douyin");
  });

  it("accepts a platform name for the memory sdk", () => {
    const services = createGameServices({ platformName: "wechat" });

    expect(services.platform.platformName).toBe("wechat");
    expect(services.platform).toBeDefined();
  });

  it("defaults options to an empty object", () => {
    expect(() => createGameServices()).not.toThrow();
    const services = createGameServices();
    expect(services.runtime.apiBaseUrl).toBe("http://127.0.0.1:3000");
  });

  it("backs the default platform with in-memory storage", () => {
    const services = createGameServices({ apiBaseUrl: "http://api.local" });

    services.platform.saveBestScore(12);
    expect(services.platform.loadBestScore()).toBe(12);
  });
});
