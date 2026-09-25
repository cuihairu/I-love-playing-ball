import { describe, expect, it } from "vitest";

import {
  createPlatformSdk,
  MemoryPlatformSdk,
  type PlatformSdk
} from "./index.js";

describe("createPlatformSdk", () => {
  it("defaults to the web platform", () => {
    expect(createPlatformSdk().getPlatformName()).toBe("web");
  });

  it("honours the requested platform name", () => {
    expect(createPlatformSdk("wechat").getPlatformName()).toBe("wechat");
    expect(createPlatformSdk("douyin").getPlatformName()).toBe("douyin");
    expect(createPlatformSdk("unknown").getPlatformName()).toBe("unknown");
  });
});

describe("MemoryPlatformSdk", () => {
  it("exposes the platform name from the constructor", () => {
    expect(new MemoryPlatformSdk("wechat").getPlatformName()).toBe("wechat");
    expect(new MemoryPlatformSdk().getPlatformName()).toBe("web");
  });

  it("logs in with the platform identity only", async () => {
    const sdk: PlatformSdk = new MemoryPlatformSdk("douyin");
    const result = await sdk.login();

    expect(result.platform).toBe("douyin");
    expect(result.userId).toBeUndefined();
    expect(result.token).toBeUndefined();
  });

  it("creates rewarded ads that never finish", async () => {
    const sdk = createPlatformSdk("web");
    const ad = await sdk.createRewardedVideoAd("ad-unit-1");

    await expect(ad.show()).resolves.toEqual({ finished: false });
  });

  it("creates interstitial ads that resolve without effect", async () => {
    const sdk = createPlatformSdk("web");
    const ad = await sdk.createInterstitialAd("ad-unit-2");

    await expect(ad.show()).resolves.toBeUndefined();
  });

  it("shares without throwing", async () => {
    const sdk = createPlatformSdk("web");

    await expect(
      sdk.share({ title: "全民制作人们大家好", imageUrl: "https://example.com/a.png", query: "from=game" })
    ).resolves.toBeUndefined();
  });

  it("stores and loads values by key", () => {
    const sdk = new MemoryPlatformSdk();

    sdk.setStorage("game:best-score", 28);
    expect(sdk.getStorage<number>("game:best-score")).toBe(28);

    sdk.setStorage("game:profile", { name: "ikun" });
    expect(sdk.getStorage<{ name: string }>("game:profile")).toEqual({ name: "ikun" });
  });

  it("returns null for unknown keys", () => {
    const sdk = new MemoryPlatformSdk();

    expect(sdk.getStorage("missing")).toBeNull();
  });

  it("overwrites previous values for the same key", () => {
    const sdk = new MemoryPlatformSdk();

    sdk.setStorage("score", 1);
    sdk.setStorage("score", 2);

    expect(sdk.getStorage<number>("score")).toBe(2);
  });
});
