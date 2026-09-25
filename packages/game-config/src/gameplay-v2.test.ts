import { describe, expect, it } from "vitest";

import {
  evaluateMedalRequirement,
  findChannel,
  getChannelMedals,
  getCultivationLevel,
  getDefaultBasketV2Config,
  getDefaultMetaV2Config,
  getDefaultRhythmConfig,
  getLockedChannelNotice,
  getRankByLevel,
  getRhythmFeedbackLine,
  isChannelUnlocked,
  isLimitedMedalAvailable,
  judgeRhythmTiming,
  listEarnedMedals,
  rhythmNoteScore,
  type LimitedMedalConfig,
  type MedalRequirement,
  type MetaV2Config,
  type PlayerStats,
  type RhythmConfig
} from "./gameplay-v2.js";

function emptyStats(overrides: Partial<PlayerStats> = {}): PlayerStats {
  return {
    loginDays: 0,
    streakDays: 0,
    level: 0,
    basketWins: 0,
    perfectTotal: 0,
    perChannel: {},
    ...overrides
  };
}

describe("default config getters", () => {
  it("returns the meta v2 config", () => {
    const config = getDefaultMetaV2Config();

    expect(config.cultivation.maxLevelAchievement).toBe("两年半");
    expect(config.channels.map((channel) => channel.id)).toEqual([
      "sing",
      "dance",
      "rap",
      "basketball"
    ]);
    expect(config.medals.channelMedals.length).toBeGreaterThan(0);
  });

  it("returns the rhythm config", () => {
    const config = getDefaultRhythmConfig();

    expect(config.timing.perfectWindowMs).toBe(80);
    expect(config.timing.goodWindowMs).toBe(160);
    expect(config.scoring.perfect).toBe(100);
    expect(config.gauge.enabled).toBe(false);
  });

  it("returns the basket v2 config", () => {
    const config = getDefaultBasketV2Config();

    expect(config.match.durationSeconds).toBe(60);
    expect(config.versus.npcLadder).toHaveLength(3);
  });

  it("returns deep copies", () => {
    const meta = getDefaultMetaV2Config();
    meta.channels.pop();
    meta.cultivation.ranks.shift();

    expect(getDefaultMetaV2Config().channels).toHaveLength(4);
    expect(getDefaultMetaV2Config().cultivation.ranks).toHaveLength(6);

    const rhythm = getDefaultRhythmConfig();
    rhythm.scoring.perfect = -1;
    expect(getDefaultRhythmConfig().scoring.perfect).toBe(100);

    const basket = getDefaultBasketV2Config();
    basket.versus.npcLadder.length = 0;
    expect(getDefaultBasketV2Config().versus.npcLadder).toHaveLength(3);
  });
});

describe("judgeRhythmTiming", () => {
  const config = getDefaultRhythmConfig();

  it("judges offsets inside the perfect window as perfect", () => {
    expect(judgeRhythmTiming(0, config)).toBe("perfect");
    expect(judgeRhythmTiming(80, config)).toBe("perfect");
    expect(judgeRhythmTiming(-80, config)).toBe("perfect");
  });

  it("judges offsets inside the good window as good", () => {
    expect(judgeRhythmTiming(81, config)).toBe("good");
    expect(judgeRhythmTiming(160, config)).toBe("good");
    expect(judgeRhythmTiming(-160, config)).toBe("good");
  });

  it("judges remaining offsets as miss", () => {
    expect(judgeRhythmTiming(161, config)).toBe("miss");
    expect(judgeRhythmTiming(-1000, config)).toBe("miss");
  });
});

describe("rhythmNoteScore", () => {
  const config = getDefaultRhythmConfig();

  it("returns the miss score without combo bonus", () => {
    expect(rhythmNoteScore("miss", 30, config)).toBe(0);
  });

  it("adds no bonus before 10 combo", () => {
    expect(rhythmNoteScore("perfect", 0, config)).toBe(100);
    expect(rhythmNoteScore("perfect", 9, config)).toBe(100);
    expect(rhythmNoteScore("good", 9, config)).toBe(60);
  });

  it("adds a bonus per 10 combo", () => {
    expect(rhythmNoteScore("perfect", 10, config)).toBe(110);
    expect(rhythmNoteScore("good", 25, config)).toBe(80);
  });

  it("caps the combo bonus", () => {
    expect(rhythmNoteScore("perfect", 100, config)).toBe(150);
  });
});

describe("getRhythmFeedbackLine", () => {
  const config = getDefaultRhythmConfig();

  it("maps each judgement to its feedback copy", () => {
    expect(getRhythmFeedbackLine("perfect", config)).toBe(config.feedback.perfect);
    expect(getRhythmFeedbackLine("good", config)).toBe(config.feedback.good);
    expect(getRhythmFeedbackLine("miss", config)).toBe(config.feedback.miss);
  });
});

describe("getCultivationLevel", () => {
  const config = getDefaultMetaV2Config();

  it("resolves the level from day thresholds", () => {
    expect(getCultivationLevel(config, 0)).toBe(0);
    expect(getCultivationLevel(config, 2)).toBe(0);
    expect(getCultivationLevel(config, 3)).toBe(1);
    expect(getCultivationLevel(config, 7)).toBe(2);
    expect(getCultivationLevel(config, 15)).toBe(3);
    expect(getCultivationLevel(config, 730)).toBe(10);
    expect(getCultivationLevel(config, 10000)).toBe(10);
  });
});

describe("getRankByLevel", () => {
  const config = getDefaultMetaV2Config();

  it("resolves the highest rank at or below the level", () => {
    expect(getRankByLevel(config, 0)).toBe("练习生");
    expect(getRankByLevel(config, 1)).toBe("练习生");
    expect(getRankByLevel(config, 2)).toBe("外门弟子");
    expect(getRankByLevel(config, 5)).toBe("内门弟子");
    expect(getRankByLevel(config, 10)).toBe("宗主亲传");
    expect(getRankByLevel(config, 99)).toBe("宗主亲传");
  });

  it("sorts unsorted ranks before matching", () => {
    const shuffled: MetaV2Config = {
      ...getDefaultMetaV2Config(),
      cultivation: {
        ...getDefaultMetaV2Config().cultivation,
        ranks: [
          { level: 6, name: "真传弟子" },
          { level: 0, name: "练习生" },
          { level: 2, name: "外门弟子" }
        ]
      }
    };

    expect(getRankByLevel(shuffled, 2)).toBe("外门弟子");
    expect(getRankByLevel(shuffled, 7)).toBe("真传弟子");
  });
});

describe("findChannel", () => {
  const config = getDefaultMetaV2Config();

  it("finds a channel by id", () => {
    const channel = findChannel(config, "basketball");
    expect(channel?.name).toBe("篮球");
    expect(channel?.mode).toBe("basket");
  });

  it("returns null for unknown ids", () => {
    expect(findChannel(config, "golf")).toBeNull();
  });
});

describe("isChannelUnlocked", () => {
  const config = getDefaultMetaV2Config();

  it("unlocks channels once the level reaches unlockLevel", () => {
    expect(isChannelUnlocked(config, "sing", 0)).toBe(true);
    expect(isChannelUnlocked(config, "dance", 5)).toBe(false);
    expect(isChannelUnlocked(config, "dance", 6)).toBe(true);
    expect(isChannelUnlocked(config, "rap", 9)).toBe(true);
  });

  it("keeps unknown channels locked", () => {
    expect(isChannelUnlocked(config, "golf", 99)).toBe(false);
  });
});

describe("getLockedChannelNotice", () => {
  const config = getDefaultMetaV2Config();

  it("returns a notice for cultivating channels", () => {
    const notice = getLockedChannelNotice(config, "dance");
    expect(notice).toContain("两年半");
    expect(notice).toContain("跳");

    const rapNotice = getLockedChannelNotice(config, "rap");
    expect(rapNotice).toContain("rap");
  });

  it("returns null for open or unknown channels", () => {
    expect(getLockedChannelNotice(config, "sing")).toBeNull();
    expect(getLockedChannelNotice(config, "basketball")).toBeNull();
    expect(getLockedChannelNotice(config, "golf")).toBeNull();
  });
});

describe("getChannelMedals", () => {
  const config = getDefaultMetaV2Config();

  it("filters medals by channel", () => {
    const medals = getChannelMedals(config, "sing");
    expect(medals).toHaveLength(3);
    expect(medals.every((medal) => medal.channel === "sing")).toBe(true);
  });

  it("returns an empty list for unknown channels", () => {
    expect(getChannelMedals(config, "golf")).toEqual([]);
  });
});

describe("isLimitedMedalAvailable", () => {
  it("compares the iso date against the deadline", () => {
    const medal: LimitedMedalConfig = { id: "x", name: "x", requirement: { type: "login", target: 1 }, availableUntil: "2026-09-30" };

    expect(isLimitedMedalAvailable(medal, "2026-01-01")).toBe(true);
    expect(isLimitedMedalAvailable(medal, "2026-09-30")).toBe(true);
    expect(isLimitedMedalAvailable(medal, "2026-10-01")).toBe(false);
  });
});

describe("evaluateMedalRequirement", () => {
  it("evaluates login day requirements", () => {
    const requirement: MedalRequirement = { type: "login", target: 2 };
    expect(evaluateMedalRequirement(requirement, emptyStats({ loginDays: 2 }))).toBe(true);
    expect(evaluateMedalRequirement(requirement, emptyStats({ loginDays: 1 }))).toBe(false);
  });

  it("evaluates streak day requirements", () => {
    const requirement: MedalRequirement = { type: "streakDays", target: 3 };
    expect(evaluateMedalRequirement(requirement, emptyStats({ streakDays: 3 }))).toBe(true);
    expect(evaluateMedalRequirement(requirement, emptyStats({ streakDays: 2 }))).toBe(false);
  });

  it("evaluates level requirements", () => {
    const requirement: MedalRequirement = { type: "level", target: 10 };
    expect(evaluateMedalRequirement(requirement, emptyStats({ level: 10 }))).toBe(true);
    expect(evaluateMedalRequirement(requirement, emptyStats({ level: 9 }))).toBe(false);
  });

  it("evaluates basket win requirements", () => {
    const requirement: MedalRequirement = { type: "basketWins", target: 5 };
    expect(evaluateMedalRequirement(requirement, emptyStats({ basketWins: 5 }))).toBe(true);
    expect(evaluateMedalRequirement(requirement, emptyStats({ basketWins: 4 }))).toBe(false);
  });

  it("evaluates perfect total requirements", () => {
    const requirement: MedalRequirement = { type: "perfectTotal", target: 200 };
    expect(evaluateMedalRequirement(requirement, emptyStats({ perfectTotal: 200 }))).toBe(true);
    expect(evaluateMedalRequirement(requirement, emptyStats({ perfectTotal: 199 }))).toBe(false);
  });

  it("evaluates channel play requirements", () => {
    const requirement: MedalRequirement = { type: "channelPlays", target: 3, channel: "sing" };

    expect(
      evaluateMedalRequirement(requirement, emptyStats({ perChannel: { sing: { plays: 3, bestCombo: 0, bestScore: 0 } } }))
    ).toBe(true);
    expect(
      evaluateMedalRequirement(requirement, emptyStats({ perChannel: { sing: { plays: 2, bestCombo: 0, bestScore: 0 } } }))
    ).toBe(false);
  });

  it("evaluates channel combo requirements", () => {
    const requirement: MedalRequirement = { type: "channelBestCombo", target: 20, channel: "sing" };

    expect(
      evaluateMedalRequirement(requirement, emptyStats({ perChannel: { sing: { plays: 1, bestCombo: 20, bestScore: 0 } } }))
    ).toBe(true);
    expect(
      evaluateMedalRequirement(requirement, emptyStats({ perChannel: { sing: { plays: 1, bestCombo: 19, bestScore: 0 } } }))
    ).toBe(false);
  });

  it("rejects channel requirements without channel stats", () => {
    expect(
      evaluateMedalRequirement({ type: "channelPlays", target: 1, channel: "dance" }, emptyStats())
    ).toBe(false);
    expect(
      evaluateMedalRequirement({ type: "channelBestCombo", target: 1, channel: "dance" }, emptyStats())
    ).toBe(false);
    expect(
      evaluateMedalRequirement({ type: "channelPlays", target: 1 }, emptyStats())
    ).toBe(false);
  });
});

describe("listEarnedMedals", () => {
  const config = getDefaultMetaV2Config();

  it("returns nothing for a fresh player", () => {
    expect(listEarnedMedals(config, emptyStats())).toEqual([]);
  });

  it("collects channel and meme medals once requirements are met", () => {
    const stats = emptyStats({
      loginDays: 1,
      level: 10,
      basketWins: 10,
      perfectTotal: 200,
      streakDays: 3,
      perChannel: {
        sing: { plays: 3, bestCombo: 40, bestScore: 100 },
        basketball: { plays: 3, bestCombo: 0, bestScore: 100 }
      }
    });

    const earned = listEarnedMedals(config, stats, "2026-01-01");
    const ids = earned.map((medal) => medal.id);

    expect(ids).toContain("sing-bronze");
    expect(ids).toContain("sing-silver");
    expect(ids).toContain("sing-gold");
    expect(ids).toContain("basketball-bronze");
    expect(ids).toContain("basketball-silver");
    expect(ids).toContain("basketball-gold");
    expect(ids).toContain("first-audience");
    expect(ids).toContain("producers");
    expect(ids).toContain("hei-killer");
    expect(ids).toContain("oil-pancake");
    expect(ids).toContain("lawyer-letter");
    expect(ids).toContain("two-and-half-years");

    const goldMedal = earned.find((medal) => medal.id === "sing-gold");
    expect(goldMedal?.tier).toBe("gold");
    expect(goldMedal?.limited).toBe(false);
  });

  it("includes limited medals only while available", () => {
    const stats = emptyStats({ loginDays: 1 });

    const beforeDeadline = listEarnedMedals(config, stats, "2026-09-01");
    expect(beforeDeadline.map((medal) => medal.id)).toContain("sect-master-visit");
    expect(beforeDeadline.find((medal) => medal.id === "sect-master-visit")?.limited).toBe(true);

    const afterDeadline = listEarnedMedals(config, stats, "2026-10-01");
    expect(afterDeadline.map((medal) => medal.id)).not.toContain("sect-master-visit");
  });

  it("skips the availability check when no date is provided", () => {
    const stats = emptyStats({ loginDays: 1 });
    const earned = listEarnedMedals(config, stats);

    expect(earned.map((medal) => medal.id)).toContain("sect-master-visit");
    expect(earned.map((medal) => medal.id)).toContain("first-audience");
  });
});
