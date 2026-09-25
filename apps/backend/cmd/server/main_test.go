package main

import (
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"testing"
)

// The main function blocks on listening or terminates via log.Fatalf, so the
// scenarios below always re-execute the test binary in a child process.
const scenarioEnv = "IKUN_TEST_MAIN_SCENARIO"

func TestMainFunction(t *testing.T) {
	if scenario := os.Getenv(scenarioEnv); scenario != "" {
		main()
		return
	}

	t.Run("RunFailsOnOccupiedPort", func(t *testing.T) {
		listener, err := net.Listen("tcp", "127.0.0.1:0")
		if err != nil {
			t.Skipf("cannot reserve port: %v", err)
		}
		defer listener.Close()

		port := strings.TrimPrefix(listener.Addr().String(), "127.0.0.1:")
		exitCode := runMainScenario(t, map[string]string{
			"PORT":          port,
			"DATABASE_PATH": filepath.Join(t.TempDir(), "app.db"),
		})

		if exitCode != 1 {
			t.Errorf("exit code = %d, want 1 (listen failure)", exitCode)
		}
	})

	t.Run("DefaultsToPort3000WhenEnvEmpty", func(t *testing.T) {
		listener, err := net.Listen("tcp", "127.0.0.1:3000")
		if err != nil {
			t.Skipf("port 3000 already in use elsewhere: %v", err)
		}
		defer listener.Close()

		exitCode := runMainScenario(t, map[string]string{
			"PORT":          "",
			"DATABASE_PATH": filepath.Join(t.TempDir(), "app.db"),
		})

		if exitCode != 1 {
			t.Errorf("exit code = %d, want 1 (listen failure on :3000)", exitCode)
		}
	})

	t.Run("ServerCreationFailure", func(t *testing.T) {
		listener, err := net.Listen("tcp", "127.0.0.1:0")
		if err != nil {
			t.Skipf("cannot reserve port: %v", err)
		}
		defer listener.Close()

		port := strings.TrimPrefix(listener.Addr().String(), "127.0.0.1:")

		blocker := t.TempDir()
		blockerFile := blocker + "/blocker"
		if err := os.WriteFile(blockerFile, []byte("x"), 0o644); err != nil {
			t.Fatalf("write blocker: %v", err)
		}

		exitCode := runMainScenario(t, map[string]string{
			"PORT":          port,
			"DATABASE_PATH": blockerFile + "/app.db",
		})

		if exitCode != 1 {
			t.Errorf("exit code = %d, want 1 (server creation failure)", exitCode)
		}
	})
}

func runMainScenario(t *testing.T, env map[string]string) int {
	t.Helper()

	cmd := exec.Command(os.Args[0], "-test.run=TestMainFunction", "-test.v")
	cmd.Env = os.Environ()
	for key, value := range env {
		cmd.Env = append(cmd.Env, key+"="+value)
	}
	cmd.Env = append(cmd.Env, scenarioEnv+"=1")

	output, err := cmd.Output()
	if err == nil {
		t.Logf("main exited without error, output: %s", output)
		return 0
	}

	exitErr, ok := err.(*exec.ExitError)
	if !ok {
		t.Fatalf("run child process: %v (output: %s)", err, output)
	}

	if status, ok := exitErr.Sys().(syscall.WaitStatus); ok && status.Signaled() {
		t.Fatalf("child process terminated by signal: %v", status)
	}

	return exitErr.ExitCode()
}
