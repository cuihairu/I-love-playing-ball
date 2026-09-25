package leaderboard

import (
	"fmt"
	"path/filepath"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func openTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	dsn := filepath.Join(t.TempDir(), "leaderboard-test.db")
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{
		Logger: logger.Discard,
	})
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("resolve underlying sql.DB: %v", err)
	}
	t.Cleanup(func() {
		if err := sqlDB.Close(); err != nil {
			t.Errorf("close test database: %v", err)
		}
	})

	return db
}

func TestNewStoreSeedsDemoEntries(t *testing.T) {
	store, err := NewStore(openTestDB(t))
	if err != nil {
		t.Fatalf("NewStore() error = %v", err)
	}

	entries, err := store.List(0)
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}

	if len(entries) != 2 {
		t.Fatalf("seeded entries = %d, want 2", len(entries))
	}
	if entries[0].PlayerID != "demo-1" || entries[0].PlayerName != "鸡你太投" || entries[0].Score != 28 {
		t.Errorf("top seeded entry = %+v", entries[0])
	}
	if entries[1].PlayerID != "demo-2" || entries[1].PlayerName != "空心小鸡" || entries[1].Score != 22 {
		t.Errorf("second seeded entry = %+v", entries[1])
	}
}

func TestNewStoreDoesNotReseedExistingTable(t *testing.T) {
	db := openTestDB(t)

	store, err := NewStore(db)
	if err != nil {
		t.Fatalf("first NewStore() error = %v", err)
	}

	if _, err := store.Submit(SubmitRequest{PlayerID: "p1", PlayerName: "player", Score: 99}); err != nil {
		t.Fatalf("Submit() error = %v", err)
	}

	reopened, err := NewStore(db)
	if err != nil {
		t.Fatalf("second NewStore() error = %v", err)
	}

	entries, err := reopened.List(0)
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}

	if len(entries) != 3 {
		t.Fatalf("entries after reopen = %d, want 3 (no reseed)", len(entries))
	}
}

func TestListOrdersByScoreDescThenCreatedAtAsc(t *testing.T) {
	store, err := NewStore(openTestDB(t))
	if err != nil {
		t.Fatalf("NewStore() error = %v", err)
	}

	base := time.Now().UTC().Add(-time.Hour)
	seedRows := []Entry{
		{PlayerID: "a", PlayerName: "a", Score: 10, CreatedAt: base},
		{PlayerID: "b", PlayerName: "b", Score: 50, CreatedAt: base.Add(time.Minute)},
		{PlayerID: "c", PlayerName: "c", Score: 50, CreatedAt: base.Add(2 * time.Minute)},
		{PlayerID: "d", PlayerName: "d", Score: 30, CreatedAt: base.Add(3 * time.Minute)},
	}
	for i := range seedRows {
		if err := store.db.Create(&seedRows[i]).Error; err != nil {
			t.Fatalf("seed row: %v", err)
		}
	}

	entries, err := store.List(0)
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}

	var gotIDs []string
	for _, entry := range entries {
		gotIDs = append(gotIDs, entry.PlayerID)
	}

	wantIDs := []string{"b", "c", "d", "demo-1", "demo-2", "a"}
	if len(gotIDs) != len(wantIDs) {
		t.Fatalf("entries = %v, want %v", gotIDs, wantIDs)
	}
	for i := range wantIDs {
		if gotIDs[i] != wantIDs[i] {
			t.Fatalf("entries = %v, want %v (score DESC, created_at ASC)", gotIDs, wantIDs)
		}
	}
}

func TestListAppliesPositiveLimit(t *testing.T) {
	store, err := NewStore(openTestDB(t))
	if err != nil {
		t.Fatalf("NewStore() error = %v", err)
	}

	entries, err := store.List(1)
	if err != nil {
		t.Fatalf("List(1) error = %v", err)
	}

	if len(entries) != 1 {
		t.Fatalf("List(1) returned %d entries, want 1", len(entries))
	}
	if entries[0].Score != 28 {
		t.Errorf("top entry score = %d, want 28", entries[0].Score)
	}
}

func TestSubmitPersistsEntry(t *testing.T) {
	store, err := NewStore(openTestDB(t))
	if err != nil {
		t.Fatalf("NewStore() error = %v", err)
	}

	before := time.Now().UTC().Add(-time.Minute)
	entry, err := store.Submit(SubmitRequest{PlayerID: "ikun-1", PlayerName: "练习时长两年半", Score: 42})
	if err != nil {
		t.Fatalf("Submit() error = %v", err)
	}

	if entry.ID == 0 {
		t.Error("expected persisted entry to receive an ID")
	}
	if entry.PlayerID != "ikun-1" || entry.PlayerName != "练习时长两年半" || entry.Score != 42 {
		t.Errorf("returned entry = %+v", entry)
	}
	if entry.CreatedAt.Before(before) {
		t.Errorf("CreatedAt = %v, want a timestamp close to now", entry.CreatedAt)
	}

	entries, err := store.List(0)
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}

	found := false
	for _, e := range entries {
		if e.PlayerID == "ikun-1" && e.Score == 42 {
			found = true
		}
	}
	if !found {
		t.Error("submitted entry not returned by List()")
	}
}

func TestListErrorAfterClose(t *testing.T) {
	db := openTestDB(t)

	store, err := NewStore(db)
	if err != nil {
		t.Fatalf("NewStore() error = %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("resolve underlying sql.DB: %v", err)
	}
	if err := sqlDB.Close(); err != nil {
		t.Fatalf("close database: %v", err)
	}

	if _, err := store.List(0); err == nil {
		t.Fatal("List() expected error after database is closed")
	}
}

func TestSubmitErrorAfterClose(t *testing.T) {
	db := openTestDB(t)

	store, err := NewStore(db)
	if err != nil {
		t.Fatalf("NewStore() error = %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("resolve underlying sql.DB: %v", err)
	}
	if err := sqlDB.Close(); err != nil {
		t.Fatalf("close database: %v", err)
	}

	if _, err := store.Submit(SubmitRequest{PlayerID: "x", PlayerName: "x", Score: 1}); err == nil {
		t.Fatal("Submit() expected error after database is closed")
	}
}

func TestNewStoreFailsOnClosedDatabase(t *testing.T) {
	db := openTestDB(t)

	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("resolve underlying sql.DB: %v", err)
	}
	if err := sqlDB.Close(); err != nil {
		t.Fatalf("close database: %v", err)
	}

	if _, err := NewStore(db); err == nil {
		t.Fatal("NewStore() expected error on closed database")
	}
}

func TestIsNotFound(t *testing.T) {
	if !IsNotFound(gorm.ErrRecordNotFound) {
		t.Error("IsNotFound(gorm.ErrRecordNotFound) = false, want true")
	}

	wrapped := fmt.Errorf("wrap: %w", gorm.ErrRecordNotFound)
	if !IsNotFound(wrapped) {
		t.Error("IsNotFound(wrapped ErrRecordNotFound) = false, want true")
	}

	if IsNotFound(fmt.Errorf("some other error")) {
		t.Error("IsNotFound(other error) = true, want false")
	}
}
