//go:build unit

package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/config"
	middleware2 "github.com/Wei-Shaw/sub2api/internal/server/middleware"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func TestAuthHandlerIssueAndVerifyCreepeeSSOTicket(t *testing.T) {
	gin.SetMode(gin.TestMode)

	user := &service.User{
		ID:           42,
		Email:        "hinaw@example.com",
		Username:     "hinaw",
		Role:         service.RoleAdmin,
		Status:       service.StatusActive,
		Concurrency:  3,
		TokenVersion: 7,
	}
	repo := &userHandlerRepoStub{user: user}
	ticketCache := newCreepeeSSOTestCache()
	authSvc := service.NewAuthService(
		nil,
		repo,
		nil,
		ticketCache,
		&config.Config{JWT: config.JWTConfig{Secret: "0123456789abcdef0123456789abcdef", ExpireHour: 24, RefreshTokenExpireDays: 30}},
		nil,
		nil,
		nil,
		nil,
		nil,
		nil,
		nil,
		nil,
	)
	handler := &AuthHandler{
		authService: authSvc,
		userService: service.NewUserService(repo, nil, nil, nil),
	}

	issueRecorder := httptest.NewRecorder()
	issueCtx, _ := gin.CreateTestContext(issueRecorder)
	issueCtx.Request = httptest.NewRequest(http.MethodPost, "/api/v1/auth/creepee-sso/issue", nil)
	issueCtx.Set(string(middleware2.ContextKeyUser), middleware2.AuthSubject{UserID: user.ID})

	handler.IssueCreepeeSSOTicket(issueCtx)

	require.Equal(t, http.StatusOK, issueRecorder.Code)
	var issueResp struct {
		Code int `json:"code"`
		Data struct {
			Ticket    string `json:"ticket"`
			ExpiresIn int    `json:"expires_in"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(issueRecorder.Body.Bytes(), &issueResp))
	require.Equal(t, 0, issueResp.Code)
	require.Regexp(t, `^cpsso_[A-Za-z0-9_-]+$`, issueResp.Data.Ticket)
	require.Greater(t, issueResp.Data.ExpiresIn, 0)

	verifyRecorder := httptest.NewRecorder()
	verifyCtx, _ := gin.CreateTestContext(verifyRecorder)
	body, err := json.Marshal(map[string]string{"ticket": issueResp.Data.Ticket})
	require.NoError(t, err)
	verifyCtx.Request = httptest.NewRequest(http.MethodPost, "/api/v1/auth/creepee-sso/verify", bytes.NewReader(body))
	verifyCtx.Request.Header.Set("Content-Type", "application/json")

	handler.VerifyCreepeeSSOTicket(verifyCtx)

	require.Equal(t, http.StatusOK, verifyRecorder.Code)
	var verifyResp struct {
		Code int `json:"code"`
		Data struct {
			User map[string]any `json:"user"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(verifyRecorder.Body.Bytes(), &verifyResp))
	require.Equal(t, 0, verifyResp.Code)
	require.Equal(t, float64(user.ID), verifyResp.Data.User["id"])
	require.Equal(t, user.Email, verifyResp.Data.User["email"])
	require.Equal(t, user.Username, verifyResp.Data.User["username"])
	require.Equal(t, user.Role, verifyResp.Data.User["role"])
	require.NotContains(t, verifyResp.Data.User, "access_token")
	require.NotContains(t, verifyResp.Data.User, "refresh_token")

	replayRecorder := httptest.NewRecorder()
	replayCtx, _ := gin.CreateTestContext(replayRecorder)
	replayCtx.Request = httptest.NewRequest(http.MethodPost, "/api/v1/auth/creepee-sso/verify", bytes.NewReader(body))
	replayCtx.Request.Header.Set("Content-Type", "application/json")

	handler.VerifyCreepeeSSOTicket(replayCtx)

	require.Equal(t, http.StatusUnauthorized, replayRecorder.Code)
}

type creepeeSSOTestCache struct {
	tickets map[string]*service.BridgeSSOTicketData
}

func newCreepeeSSOTestCache() *creepeeSSOTestCache {
	return &creepeeSSOTestCache{tickets: make(map[string]*service.BridgeSSOTicketData)}
}

func (s *creepeeSSOTestCache) StoreRefreshToken(context.Context, string, *service.RefreshTokenData, time.Duration) error {
	return nil
}

func (s *creepeeSSOTestCache) GetRefreshToken(context.Context, string) (*service.RefreshTokenData, error) {
	return nil, service.ErrRefreshTokenNotFound
}

func (s *creepeeSSOTestCache) DeleteRefreshToken(context.Context, string) error { return nil }

func (s *creepeeSSOTestCache) DeleteUserRefreshTokens(context.Context, int64) error { return nil }

func (s *creepeeSSOTestCache) DeleteTokenFamily(context.Context, string) error { return nil }

func (s *creepeeSSOTestCache) AddToUserTokenSet(context.Context, int64, string, time.Duration) error {
	return nil
}

func (s *creepeeSSOTestCache) AddToFamilyTokenSet(context.Context, string, string, time.Duration) error {
	return nil
}

func (s *creepeeSSOTestCache) GetUserTokenHashes(context.Context, int64) ([]string, error) {
	return nil, nil
}

func (s *creepeeSSOTestCache) GetFamilyTokenHashes(context.Context, string) ([]string, error) {
	return nil, nil
}

func (s *creepeeSSOTestCache) IsTokenInFamily(context.Context, string, string) (bool, error) {
	return false, nil
}

func (s *creepeeSSOTestCache) StoreBridgeSSOTicket(_ context.Context, tokenHash string, data *service.BridgeSSOTicketData, _ time.Duration) error {
	cloned := *data
	s.tickets[tokenHash] = &cloned
	return nil
}

func (s *creepeeSSOTestCache) ConsumeBridgeSSOTicket(_ context.Context, tokenHash string) (*service.BridgeSSOTicketData, error) {
	data, ok := s.tickets[tokenHash]
	if !ok {
		return nil, service.ErrRefreshTokenNotFound
	}
	delete(s.tickets, tokenHash)
	cloned := *data
	return &cloned, nil
}
