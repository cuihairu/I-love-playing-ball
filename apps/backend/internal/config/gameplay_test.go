package config

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func gameplayConfigPath(t *testing.T) string {
	t.Helper()

	_, currentFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("resolve test file path")
	}

	return filepath.Join(
		filepath.Dir(currentFile),
		"..", "..", "..", "..",
		"packages", "game-config", "configs", "gameplay.v1.json",
	)
}

func TestLoadGameplayConfig(t *testing.T) {
	cfg, err := LoadGameplayConfig()
	if err != nil {
		t.Fatalf("LoadGameplayConfig() error = %v", err)
	}

	if cfg.Game.RoundDurationSeconds != 60 {
		t.Errorf("RoundDurationSeconds = %d, want 60", cfg.Game.RoundDurationSeconds)
	}
	if cfg.Game.ReviveDurationSeconds != 15 {
		t.Errorf("ReviveDurationSeconds = %d, want 15", cfg.Game.ReviveDurationSeconds)
	}
	if cfg.Game.MaxReviveCount != 1 {
		t.Errorf("MaxReviveCount = %d, want 1", cfg.Game.MaxReviveCount)
	}
	if !cfg.Game.MissBreaksCombo {
		t.Error("MissBreaksCombo = false, want true")
	}

	if cfg.Scoring.NormalHit != 2 {
		t.Errorf("NormalHit = %d, want 2", cfg.Scoring.NormalHit)
	}
	if cfg.Scoring.CleanHit != 3 {
		t.Errorf("CleanHit = %d, want 3", cfg.Scoring.CleanHit)
	}
	if cfg.Scoring.PerfectShotBonus != 1 {
		t.Errorf("PerfectShotBonus = %d, want 1", cfg.Scoring.PerfectShotBonus)
	}

	if len(cfg.Combo.Tiers) != 3 {
		t.Fatalf("ComboTiers length = %d, want 3", len(cfg.Combo.Tiers))
	}
	if cfg.Combo.Tiers[0].Combo != 3 || cfg.Combo.Tiers[0].State != "hot" {
		t.Errorf("first combo tier = %+v, want {3 hot}", cfg.Combo.Tiers[0])
	}
	if cfg.Combo.Tiers[2].Combo != 8 || cfg.Combo.Tiers[2].State != "crazy" {
		t.Errorf("last combo tier = %+v, want {8 crazy}", cfg.Combo.Tiers[2])
	}

	if cfg.Emotion.DefaultState != "calm" {
		t.Errorf("DefaultState = %q, want calm", cfg.Emotion.DefaultState)
	}
	if len(cfg.Emotion.States) != 4 {
		t.Errorf("EmotionStates length = %d, want 4", len(cfg.Emotion.States))
	}

	if !cfg.Ads.RewardedReviveEnabled {
		t.Error("RewardedReviveEnabled = false, want true")
	}
	if !cfg.Ads.InterstitialBetweenRoundsEnabled {
		t.Error("InterstitialBetweenRoundsEnabled = false, want true")
	}
}

func TestLoadGameplayConfigReadError(t *testing.T) {
	configPath := gameplayConfigPath(t)

	backup := configPath + ".testbackup"
	if err := os.Rename(configPath, backup); err != nil {
		t.Skipf("cannot temporarily move gameplay config: %v", err)
	}
	t.Cleanup(func() {
		if err := os.Rename(backup, configPath); err != nil {
			t.Errorf("restore gameplay config: %v", err)
		}
	})

	if _, err := LoadGameplayConfig(); err == nil {
		t.Fatal("LoadGameplayConfig() expected error when config file is missing")
	}
}

func TestLoadGameplayConfigDecodeError(t *testing.T) {
	configPath := gameplayConfigPath(t)

	backup := configPath + ".testbackup"
	if err := os.Rename(configPath, backup); err != nil {
		t.Skipf("cannot temporarily move gameplay config: %v", err)
	}
	t.Cleanup(func() {
		if err := os.Rename(backup, configPath); err != nil {
			t.Errorf("restore gameplay config: %v", err)
		}
	})

	if err := os.WriteFile(configPath, []byte("{not valid json"), 0o644); err != nil {
		t.Fatalf("write invalid config: %v", err)
	}

	if _, err := LoadGameplayConfig(); err == nil {
		t.Fatal("LoadGameplayConfig() expected error when config file is invalid JSON")
	}
}
