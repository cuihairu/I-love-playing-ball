package server

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/cui/i-love-playing-ball/apps/backend/internal/leaderboard"
)

func newTestServer(t *testing.T) *Server {
	t.Helper()

	gin.SetMode(gin.TestMode)
	t.Setenv("DATABASE_PATH", filepath.Join(t.TempDir(), "server-test.db"))

	var (
		srv *Server
		err error
	)
	for attempt := 0; attempt < 30; attempt++ {
		srv, err = New()
		if err == nil {
			return srv
		}
		time.Sleep(100 * time.Millisecond)
	}
	t.Fatalf("New() error = %v", err)
	return nil
}

func performRequest(srv *Server, method, path string, body any) *httptest.ResponseRecorder {
	var reader *bytes.Reader
	if body != nil {
		payload, _ := json.Marshal(body)
		reader = bytes.NewReader(payload)
	} else {
		reader = bytes.NewReader(nil)
	}

	var req *http.Request
	if body != nil {
		req = httptest.NewRequest(method, path, reader)
		req.Header.Set("Content-Type", "application/json")
	} else {
		req = httptest.NewRequest(method, path, nil)
	}

	recorder := httptest.NewRecorder()
	srv.engine.ServeHTTP(recorder, req)
	return recorder
}

func TestHandleHealth(t *testing.T) {
	srv := newTestServer(t)

	recorder := performRequest(srv, http.MethodGet, "/health", nil)
	if recorder.Code != http.StatusOK {
		t.Fatalf("GET /health status = %d, want 200", recorder.Code)
	}

	var body struct {
		OK bool `json:"ok"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode health body: %v", err)
	}
	if !body.OK {
		t.Errorf("health body = %s, want ok=true", recorder.Body.String())
	}
}

func TestHandleGameplayConfig(t *testing.T) {
	srv := newTestServer(t)

	recorder := performRequest(srv, http.MethodGet, "/config/game", nil)
	if recorder.Code != http.StatusOK {
		t.Fatalf("GET /config/game status = %d, want 200", recorder.Code)
	}

	var body struct {
		Data struct {
			Game struct {
				RoundDurationSeconds int  `json:"roundDurationSeconds"`
				MissBreaksCombo      bool `json:"missBreaksCombo"`
			} `json:"game"`
			Scoring struct {
				NormalHit int `json:"normalHit"`
			} `json:"scoring"`
			Emotion struct {
				DefaultState string `json:"defaultState"`
			} `json:"emotion"`
		} `json:"data"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode config body: %v", err)
	}

	if body.Data.Game.RoundDurationSeconds != 60 {
		t.Errorf("roundDurationSeconds = %d, want 60", body.Data.Game.RoundDurationSeconds)
	}
	if !body.Data.Game.MissBreaksCombo {
		t.Error("missBreaksCombo = false, want true")
	}
	if body.Data.Scoring.NormalHit != 2 {
		t.Errorf("normalHit = %d, want 2", body.Data.Scoring.NormalHit)
	}
	if body.Data.Emotion.DefaultState != "calm" {
		t.Errorf("defaultState = %q, want calm", body.Data.Emotion.DefaultState)
	}
}

func TestHandleLeaderboardList(t *testing.T) {
	srv := newTestServer(t)

	recorder := performRequest(srv, http.MethodGet, "/leaderboard", nil)
	if recorder.Code != http.StatusOK {
		t.Fatalf("GET /leaderboard status = %d, want 200", recorder.Code)
	}

	var body struct {
		Data []leaderboard.Entry `json:"data"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode leaderboard body: %v", err)
	}

	if len(body.Data) < 2 {
		t.Fatalf("leaderboard entries = %d, want at least 2 seeded", len(body.Data))
	}

	for i := 1; i < len(body.Data); i++ {
		if body.Data[i].Score > body.Data[i-1].Score {
			t.Fatalf("leaderboard not ordered by score desc: %v", body.Data)
		}
	}
}

func TestHandleLeaderboardSubmitSuccess(t *testing.T) {
	srv := newTestServer(t)

	recorder := performRequest(srv, http.MethodPost, "/leaderboard/submit", map[string]any{
		"playerId":   "ikun-1",
		"playerName": "练习时长两年半",
		"score":      35,
	})
	if recorder.Code != http.StatusCreated {
		t.Fatalf("POST /leaderboard/submit status = %d, want 201, body = %s", recorder.Code, recorder.Body.String())
	}

	var body struct {
		Data struct {
			PlayerID   string `json:"playerId"`
			PlayerName string `json:"playerName"`
			Score      int    `json:"score"`
		} `json:"data"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode submit body: %v", err)
	}

	if body.Data.PlayerID != "ikun-1" || body.Data.Score != 35 {
		t.Errorf("submitted entry = %+v", body.Data)
	}

	listRecorder := performRequest(srv, http.MethodGet, "/leaderboard", nil)
	var listBody struct {
		Data []leaderboard.Entry `json:"data"`
	}
	if err := json.Unmarshal(listRecorder.Body.Bytes(), &listBody); err != nil {
		t.Fatalf("decode leaderboard body: %v", err)
	}
	if listBody.Data[0].PlayerID != "ikun-1" {
		t.Errorf("top entry playerId = %q, want ikun-1", listBody.Data[0].PlayerID)
	}
}

func TestHandleLeaderboardSubmitInvalidJSON(t *testing.T) {
	srv := newTestServer(t)

	req := httptest.NewRequest(http.MethodPost, "/leaderboard/submit", bytes.NewReader([]byte("not json")))
	req.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	srv.engine.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400, body = %s", recorder.Code, recorder.Body.String())
	}
}

func TestHandleLeaderboardSubmitValidation(t *testing.T) {
	srv := newTestServer(t)

	cases := []struct {
		name    string
		payload map[string]any
	}{
		{"missing player id", map[string]any{"playerName": "p", "score": 1}},
		{"missing player name", map[string]any{"playerId": "p", "score": 1}},
		{"negative score", map[string]any{"playerId": "p", "playerName": "p", "score": -1}},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			recorder := performRequest(srv, http.MethodPost, "/leaderboard/submit", tc.payload)
			if recorder.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400, body = %s", recorder.Code, recorder.Body.String())
			}
		})
	}
}

func TestHandleLeaderboardErrorsWithBrokenStore(t *testing.T) {
	dsn := filepath.Join(t.TempDir(), "broken.db")
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{
		Logger: logger.Discard,
	})
	if err != nil {
		t.Fatalf("open database: %v", err)
	}

	brokenStore, err := leaderboard.NewStore(db)
	if err != nil {
		t.Fatalf("create store: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("resolve underlying sql.DB: %v", err)
	}
	if err := sqlDB.Close(); err != nil {
		t.Fatalf("close database: %v", err)
	}

	srv := newTestServer(t)
	srv.leaderboardStore = brokenStore

	recorder := performRequest(srv, http.MethodGet, "/leaderboard", nil)
	if recorder.Code != http.StatusInternalServerError {
		t.Fatalf("GET /leaderboard status = %d, want 500", recorder.Code)
	}

	submitRecorder := performRequest(srv, http.MethodPost, "/leaderboard/submit", map[string]any{
		"playerId": "p", "playerName": "p", "score": 5,
	})
	if submitRecorder.Code != http.StatusInternalServerError {
		t.Fatalf("POST /leaderboard/submit status = %d, want 500", submitRecorder.Code)
	}
}

func TestRegisterRoutesSetsExpectedRoutes(t *testing.T) {
	srv := newTestServer(t)

	found := make(map[string]bool)
	for _, route := range srv.engine.Routes() {
		found[route.Method+" "+route.Path] = true
	}

	expected := []string{
		"GET /health",
		"GET /config/game",
		"GET /leaderboard",
		"POST /leaderboard/submit",
	}
	for _, route := range expected {
		if !found[route] {
			t.Errorf("route %q not registered", route)
		}
	}
}
