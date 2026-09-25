package storage

import (
	"os"
	"path/filepath"
	"testing"
)

func TestResolveDatabasePathUsesExplicitPath(t *testing.T) {
	const explicit = "/tmp/ikunball/app.db"

	path, err := resolveDatabasePath(explicit)
	if err != nil {
		t.Fatalf("resolveDatabasePath() error = %v", err)
	}

	if path != explicit {
		t.Errorf("resolveDatabasePath() = %q, want %q", path, explicit)
	}
}

func TestResolveDatabasePathDefaultsToRepoDataFile(t *testing.T) {
	path, err := resolveDatabasePath("")
	if err != nil {
		t.Fatalf("resolveDatabasePath() error = %v", err)
	}

	if path == "" {
		t.Fatal("resolveDatabasePath() returned empty path, want default path")
	}

	if filepath.Base(path) != "app.db" {
		t.Errorf("resolveDatabasePath() = %q, want path ending with app.db", path)
	}

	if filepath.Base(filepath.Dir(path)) != "data" {
		t.Errorf("resolveDatabasePath() = %q, want parent directory named data", path)
	}
}

func TestOpenSQLiteCreatesMissingDirectories(t *testing.T) {
	databasePath := filepath.Join(t.TempDir(), "nested", "deeper", "test.db")

	db, err := OpenSQLite(databasePath)
	if err != nil {
		t.Fatalf("OpenSQLite() error = %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("db.DB() error = %v", err)
	}
	defer sqlDB.Close()

	if info, err := os.Stat(databasePath); err != nil {
		t.Fatalf("expected database file to be created: %v", err)
	} else if info.IsDir() {
		t.Fatal("expected database path to be a file")
	}
}

func TestOpenSQLiteFailsWhenParentIsFile(t *testing.T) {
	blocker := filepath.Join(t.TempDir(), "blocker")
	if err := os.WriteFile(blocker, []byte("not a directory"), 0o644); err != nil {
		t.Fatalf("failed to write blocker file: %v", err)
	}

	db, err := OpenSQLite(filepath.Join(blocker, "app.db"))
	if err == nil {
		sqlDB, _ := db.DB()
		if sqlDB != nil {
			defer sqlDB.Close()
		}
		t.Fatal("OpenSQLite() expected error when parent path is a file")
	}
}
