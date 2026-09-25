import gameplayConfigJson from "../configs/gameplay.v1.json";

export * from "./gameplay-v2.js";

export type EmotionTrigger = "combo" | "miss";

export interface GameRulesConfig {
  roundDurationSeconds: number;
  reviveDurationSeconds: number;
  maxReviveCount: number;
  missBreaksCombo: boolean;
}

export interface ScoringConfig {
  normalHit: number;
  cleanHit: number;
  perfectShotBonus: number;
}

export interface ComboTierConfig {
  combo: number;
  state: string;
}

export interface EmotionStateConfig {
  name: string;
  minCombo: number;
  trigger?: EmotionTrigger;
}

export interface EmotionConfig {
  defaultState: string;
  states: EmotionStateConfig[];
}

export interface AdsConfig {
  rewardedReviveEnabled: boolean;
  interstitialBetweenRoundsEnabled: boolean;
}

export interface GameplayConfig {
  game: GameRulesConfig;
  scoring: ScoringConfig;
  combo: {
    tiers: ComboTierConfig[];
  };
  emotion: EmotionConfig;
  ads: AdsConfig;
}

const gameplayConfig = gameplayConfigJson as GameplayConfig;

export function getDefaultGameplayConfig(): GameplayConfig {
  return structuredClone(gameplayConfig);
}

export function getEmotionStateByCombo(config: GameplayConfig, combo: number): string {
  const matchedState = [...config.emotion.states]
    .filter((state) => state.trigger !== "miss")
    .sort((left, right) => left.minCombo - right.minCombo)
    .reduce<string>((current, state) => {
      if (combo >= state.minCombo) {
        return state.name;
      }

      return current;
    }, config.emotion.defaultState);

  return matchedState;
}

export function getMissEmotionState(config: GameplayConfig): string {
  return (
    config.emotion.states.find((state) => state.trigger === "miss")?.name ??
    config.emotion.defaultState
  );
}
