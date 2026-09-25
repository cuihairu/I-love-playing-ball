import metaConfigJson from "../configs/meta.v2.json";
import rhythmConfigJson from "../configs/gameplay.v2.rhythm.json";
import basketConfigJson from "../configs/gameplay.v2.basket.json";

export type ChannelMode = "rhythm" | "basket";

export type ChannelStatus = "open" | "cultivating";

export interface ChannelConfig {
  id: string;
  name: string;
  mode: ChannelMode;
  unlockLevel: number;
  status: ChannelStatus;
}

export type MedalTier = "bronze" | "silver" | "gold";

export type MedalRequirementType =
  | "login"
  | "streakDays"
  | "level"
  | "channelPlays"
  | "channelBestCombo"
  | "basketWins"
  | "perfectTotal";

export interface MedalRequirement {
  type: MedalRequirementType;
  target: number;
  channel?: string;
}

export interface ChannelMedalConfig {
  id: string;
  channel: string;
  tier: MedalTier;
  name: string;
  requirement: MedalRequirement;
}

export interface MemeMedalConfig {
  id: string;
  name: string;
  requirement: MedalRequirement;
}

export interface LimitedMedalConfig extends MemeMedalConfig {
  availableUntil: string;
}

export interface MedalsConfig {
  channelMedals: ChannelMedalConfig[];
  memeMedals: MemeMedalConfig[];
  limited: LimitedMedalConfig[];
}

export interface RankConfig {
  level: number;
  name: string;
}

export interface CultivationConfig {
  dayUnitLabel: string;
  maxLevelAchievement: string;
  levelDaysThresholds: number[];
  ranks: RankConfig[];
}

export interface MetaV2Config {
  cultivation: CultivationConfig;
  channels: ChannelConfig[];
  medals: MedalsConfig;
}

export interface RhythmTimingConfig {
  perfectWindowMs: number;
  goodWindowMs: number;
  leadInSeconds: number;
}

export interface RhythmScoringConfig {
  perfect: number;
  good: number;
  miss: number;
  comboBonusPer10: number;
  comboBonusCap: number;
}

export interface RhythmFeedbackConfig {
  perfect: string;
  good: string;
  miss: string;
}

export interface RhythmGaugeConfig {
  enabled: boolean;
  missLimit: number;
}

export interface RhythmConfig {
  timing: RhythmTimingConfig;
  scoring: RhythmScoringConfig;
  feedback: RhythmFeedbackConfig;
  gauge: RhythmGaugeConfig;
}

export interface BasketComboTierBonus {
  combo: number;
  bonus: number;
  state: string;
}

export interface BasketScoringV2Config {
  normalHit: number;
  cleanHit: number;
  perfectShotBonus: number;
  comboTiers: BasketComboTierBonus[];
}

export interface BasketMatchV2Config {
  durationSeconds: number;
  overtimeSeconds: number;
  maxOvertimeCount: number;
  missBreaksCombo: boolean;
}

export interface BasketNpcLadderEntry {
  rank: number;
  name: string;
  targetScore: number;
}

export interface BasketVersusConfig {
  npcLadder: BasketNpcLadderEntry[];
}

export interface BasketV2Config {
  match: BasketMatchV2Config;
  scoring: BasketScoringV2Config;
  versus: BasketVersusConfig;
}

export interface PlayerStats {
  loginDays: number;
  streakDays: number;
  level: number;
  basketWins: number;
  perfectTotal: number;
  perChannel: Record<string, { plays: number; bestCombo: number; bestScore: number }>;
}

const metaConfig = metaConfigJson as MetaV2Config;
const rhythmConfig = rhythmConfigJson as RhythmConfig;
const basketConfig = basketConfigJson as BasketV2Config;

export function getDefaultMetaV2Config(): MetaV2Config {
  return structuredClone(metaConfig);
}

export function getDefaultRhythmConfig(): RhythmConfig {
  return structuredClone(rhythmConfig);
}

export function getDefaultBasketV2Config(): BasketV2Config {
  return structuredClone(basketConfig);
}

export type RhythmJudgement = "perfect" | "good" | "miss";

export function judgeRhythmTiming(offsetMs: number, config: RhythmConfig): RhythmJudgement {
  const absoluteOffsetMs = Math.abs(offsetMs);
  if (absoluteOffsetMs <= config.timing.perfectWindowMs) {
    return "perfect";
  }

  if (absoluteOffsetMs <= config.timing.goodWindowMs) {
    return "good";
  }

  return "miss";
}

export function rhythmNoteScore(
  judgement: RhythmJudgement,
  combo: number,
  config: RhythmConfig
): number {
  if (judgement === "miss") {
    return config.scoring.miss;
  }

  const comboBonus = Math.min(
    Math.floor(combo / 10) * config.scoring.comboBonusPer10,
    config.scoring.comboBonusCap
  );

  return (
    (judgement === "perfect" ? config.scoring.perfect : config.scoring.good) + comboBonus
  );
}

export function getRhythmFeedbackLine(judgement: RhythmJudgement, config: RhythmConfig): string {
  if (judgement === "perfect") {
    return config.feedback.perfect;
  }

  if (judgement === "good") {
    return config.feedback.good;
  }

  return config.feedback.miss;
}

export function getCultivationLevel(config: MetaV2Config, totalDays: number): number {
  const thresholds = config.cultivation.levelDaysThresholds;
  let level = 0;
  for (let index = 0; index < thresholds.length; index += 1) {
    if (totalDays >= thresholds[index]) {
      level = index;
    }
  }

  return level;
}

export function getRankByLevel(config: MetaV2Config, level: number): string {
  const sortedRanks = [...config.cultivation.ranks].sort((left, right) => left.level - right.level);
  let rankName = sortedRanks[0]?.name ?? config.cultivation.ranks[0].name;
  for (const rank of sortedRanks) {
    if (level >= rank.level) {
      rankName = rank.name;
    }
  }

  return rankName;
}

export function findChannel(config: MetaV2Config, channelId: string): ChannelConfig | null {
  return config.channels.find((channel) => channel.id === channelId) ?? null;
}

export function isChannelUnlocked(config: MetaV2Config, channelId: string, level: number): boolean {
  const channel = findChannel(config, channelId);
  if (!channel) {
    return false;
  }

  return level >= channel.unlockLevel;
}

export function getLockedChannelNotice(config: MetaV2Config, channelId: string): string | null {
  const channel = findChannel(config, channelId);
  if (!channel || channel.status !== "cultivating") {
    return null;
  }

  return `此艺尚未修炼两年半,${channel.name}渠道敬请期待`;
}

export function getChannelMedals(config: MetaV2Config, channelId: string): ChannelMedalConfig[] {
  return config.medals.channelMedals.filter((medal) => medal.channel === channelId);
}

export function isLimitedMedalAvailable(
  medal: LimitedMedalConfig,
  todayIso: string
): boolean {
  return todayIso <= medal.availableUntil;
}

export function evaluateMedalRequirement(
  requirement: MedalRequirement,
  stats: PlayerStats
): boolean {
  if (requirement.type === "login") {
    return stats.loginDays >= requirement.target;
  }

  if (requirement.type === "streakDays") {
    return stats.streakDays >= requirement.target;
  }

  if (requirement.type === "level") {
    return stats.level >= requirement.target;
  }

  if (requirement.type === "basketWins") {
    return stats.basketWins >= requirement.target;
  }

  if (requirement.type === "perfectTotal") {
    return stats.perfectTotal >= requirement.target;
  }

  const channelStats = requirement.channel
    ? stats.perChannel[requirement.channel]
    : undefined;

  if (!channelStats) {
    return false;
  }

  if (requirement.type === "channelPlays") {
    return channelStats.plays >= requirement.target;
  }

  return channelStats.bestCombo >= requirement.target;
}

export interface EarnedMedal {
  id: string;
  name: string;
  tier?: MedalTier;
  limited: boolean;
}

export function listEarnedMedals(
  config: MetaV2Config,
  stats: PlayerStats,
  todayIso?: string
): EarnedMedal[] {
  const earned: EarnedMedal[] = [];

  for (const medal of config.medals.channelMedals) {
    if (evaluateMedalRequirement(medal.requirement, stats)) {
      earned.push({ id: medal.id, name: medal.name, tier: medal.tier, limited: false });
    }
  }

  for (const medal of config.medals.memeMedals) {
    if (evaluateMedalRequirement(medal.requirement, stats)) {
      earned.push({ id: medal.id, name: medal.name, limited: false });
    }
  }

  for (const medal of config.medals.limited) {
    if (todayIso && !isLimitedMedalAvailable(medal, todayIso)) {
      continue;
    }

    if (evaluateMedalRequirement(medal.requirement, stats)) {
      earned.push({ id: medal.id, name: medal.name, limited: true });
    }
  }

  return earned;
}
