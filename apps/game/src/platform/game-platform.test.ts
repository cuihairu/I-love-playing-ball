import { describe, expect, it, vi } from "vitest";

import type { PlatformName, RewardedAdResult } from "@i-love-playing-ball/platform-sdk";

import { createGamePlatform, GamePlatform } from "./game-platform.js";

function createSdkStub(options: { finished?: boolean } = {}) {
  return {
    getPlatformName: vi.fn((): PlatformName => "wechat"),
    login: vi.fn(async () => ({ platform: "wechat" as PlatformName })),
    createRewardedVideoAd: vi.fn(async () => ({
      show: async (): Promise<RewardedAdResult> => ({ finished: options.finished ?? true })
    })),
    createInterstitialAd: vi.fn(async () => ({ show: async () => undefined })),
    share: vi.fn(async () => undefined),
    storage: new Map<string, unknown>(),
    getStorage<T>(key: string): T | null {
      return (this.storage.get(key) as T | undefined) ?? null;
    },
    setStorage<T>(key: string, value: T): void {
      this.storage.set(key, value);
    }
  };
}

describe("GamePlatform", () => {
  it("exposes the sdk platform name", () => {
    const platform = new GamePlatform(createSdkStub());
    expect(platform.platformName).toBe("wechat");
  });

  it("loads zero when no best score was stored", () => {
    const platform = new GamePlatform(createSdkStub());
    expect(platform.loadBestScore()).toBe(0);
  });

  it("saves scores that beat the previous best", () => {
    const sdk = createSdkStub();
    const platform = new GamePlatform(sdk);

    platform.saveBestScore(10);
    platform.saveBestScore(25);
    platform.saveBestScore(20);

    expect(platform.loadBestScore()).toBe(25);
  });

  it("reports whether a rewarded ad finished", async () => {
    const finished = new GamePlatform(createSdkStub({ finished: true }));
    await expect(finished.showReviveAd("revive-unit")).resolves.toBe(true);

    const skipped = new GamePlatform(createSdkStub({ finished: false }));
    await expect(skipped.showReviveAd("revive-unit")).resolves.toBe(false);
  });
});

describe("createGamePlatform", () => {
  it("creates a web platform by default", () => {
    const platform = createGamePlatform();
    expect(platform).toBeInstanceOf(GamePlatform);
    expect(platform.platformName).toBe("web");
  });

  it("wraps the provided sdk", () => {
    const sdk = createSdkStub();
    const platform = createGamePlatform(sdk);

    expect(platform.platformName).toBe("wechat");
    expect(sdk.getPlatformName).toHaveBeenCalled();
  });
});
