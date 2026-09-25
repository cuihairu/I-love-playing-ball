import { describe, expect, it } from "vitest";

import {
  getDefaultGameplayConfig,
  getEmotionStateByCombo,
  getMissEmotionState,
  type GameplayConfig
} from "./index.js";

describe("getDefaultGameplayConfig", () => {
  it("returns the packaged gameplay v1 config", () => {
    const config = getDefaultGameplayConfig();

    expect(config.game.roundDurationSeconds).toBe(60);
    expect(config.game.reviveDurationSeconds).toBe(15);
    expect(config.game.maxReviveCount).toBe(1);
    expect(config.game.missBreaksCombo).toBe(true);
    expect(config.scoring.normalHit).toBe(2);
    expect(config.scoring.cleanHit).toBe(3);
    expect(config.scoring.perfectShotBonus).toBe(1);
    expect(config.combo.tiers).toHaveLength(3);
    expect(config.emotion.defaultState).toBe("calm");
    expect(config.emotion.states).toHaveLength(4);
    expect(config.ads.rewardedReviveEnabled).toBe(true);
    expect(config.ads.interstitialBetweenRoundsEnabled).toBe(true);
  });

  it("returns a deep copy so callers cannot mutate shared state", () => {
    const first = getDefaultGameplayConfig();
    first.combo.tiers.shift();
    first.emotion.defaultState = "mutated";

    const second = getDefaultGameplayConfig();

    expect(second.combo.tiers).toHaveLength(3);
    expect(second.emotion.defaultState).toBe("calm");
  });
});

describe("getEmotionStateByCombo", () => {
  it("maps combo values onto emotion states by minCombo", () => {
    const config = getDefaultGameplayConfig();

    expect(getEmotionStateByCombo(config, 0)).toBe("calm");
    expect(getEmotionStateByCombo(config, 1)).toBe("happy");
    expect(getEmotionStateByCombo(config, 4)).toBe("happy");
    expect(getEmotionStateByCombo(config, 5)).toBe("hyped");
    expect(getEmotionStateByCombo(config, 99)).toBe("hyped");
  });

  it("ignores miss-triggered states", () => {
    const config = getDefaultGameplayConfig();

    expect(getEmotionStateByCombo(config, 0)).not.toBe("broken");
  });

  it("falls back to the default state when no state matches", () => {
    const config: GameplayConfig = {
      ...getDefaultGameplayConfig(),
      emotion: {
        defaultState: "idle",
        states: [{ name: "happy", minCombo: 10 }]
      }
    };

    expect(getEmotionStateByCombo(config, 5)).toBe("idle");
    expect(getEmotionStateByCombo(config, 10)).toBe("happy");
  });

  it("sorts unsorted states before matching", () => {
    const config: GameplayConfig = {
      ...getDefaultGameplayConfig(),
      emotion: {
        defaultState: "idle",
        states: [
          { name: "hyped", minCombo: 5 },
          { name: "happy", minCombo: 1 }
        ]
      }
    };

    expect(getEmotionStateByCombo(config, 1)).toBe("happy");
    expect(getEmotionStateByCombo(config, 6)).toBe("hyped");
  });
});

describe("getMissEmotionState", () => {
  it("returns the state triggered by a miss", () => {
    expect(getMissEmotionState(getDefaultGameplayConfig())).toBe("broken");
  });

  it("falls back to the default state when no miss trigger exists", () => {
    const config: GameplayConfig = {
      ...getDefaultGameplayConfig(),
      emotion: {
        defaultState: "calm",
        states: [{ name: "happy", minCombo: 1 }]
      }
    };

    expect(getMissEmotionState(config)).toBe("calm");
  });
});
