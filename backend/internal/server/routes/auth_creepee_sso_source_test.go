package routes

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestAuthRoutesExposeCreepeeSSOEndpoints(t *testing.T) {
	_, filename, _, ok := runtime.Caller(0)
	require.True(t, ok)
	sourcePath := filepath.Join(filepath.Dir(filename), "auth.go")
	source, err := os.ReadFile(sourcePath)
	require.NoError(t, err)

	text := string(source)
	require.Contains(t, text, `auth.POST("/creepee-sso/verify", h.Auth.VerifyCreepeeSSOTicket)`)
	require.Contains(t, text, `authenticated.POST("/auth/creepee-sso/issue", h.Auth.IssueCreepeeSSOTicket)`)
	require.Less(t,
		strings.Index(text, `auth.POST("/creepee-sso/verify"`),
		strings.Index(text, `authenticated := v1.Group("")`),
		"verify endpoint must remain public so the local Bridge can consume tickets without a Sub2 bearer token",
	)
}
