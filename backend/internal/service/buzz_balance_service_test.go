package service

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/stretchr/testify/require"
)

func TestBuzzBalanceService_GetBalanceCalculatesRemainingFromBuzzBilling(t *testing.T) {
	var requestedPaths []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPaths = append(requestedPaths, r.URL.Path)
		require.Equal(t, "Bearer buzz-secret", r.Header.Get("Authorization"))

		switch r.URL.Path {
		case "/v1/dashboard/billing/subscription":
			_, _ = w.Write([]byte(`{"soft_limit_usd":100}`))
		case "/v1/dashboard/billing/usage":
			_, _ = w.Write([]byte(`{"total_usage":1234}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyBuzzBalanceEnabled:    "true",
		SettingKeyBuzzBalanceAPIBaseURL: server.URL,
		SettingKeyBuzzBalanceAPIToken:   "buzz-secret",
	}}
	svc := NewBuzzBalanceService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetBalance(context.Background())
	require.NoError(t, err)

	require.True(t, got.Enabled)
	require.True(t, got.Configured)
	require.Equal(t, "USD", got.Currency)
	require.Equal(t, server.URL, got.SiteURL)
	require.InDelta(t, 100, got.Total, 0.0001)
	require.InDelta(t, 12.34, got.Used, 0.0001)
	require.InDelta(t, 87.66, got.Remaining, 0.0001)
	require.NotEmpty(t, got.RefreshedAt)
	require.Equal(t, []string{
		"/v1/dashboard/billing/subscription",
		"/v1/dashboard/billing/usage",
	}, requestedPaths)
}

func TestBuzzBalanceService_GetBalanceSkipsUpstreamWhenUnconfigured(t *testing.T) {
	called := false
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		http.Error(w, "unexpected", http.StatusInternalServerError)
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyBuzzBalanceEnabled:    "true",
		SettingKeyBuzzBalanceAPIBaseURL: server.URL,
	}}
	svc := NewBuzzBalanceService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetBalance(context.Background())
	require.NoError(t, err)

	require.True(t, got.Enabled)
	require.False(t, got.Configured)
	require.False(t, called)
}

type buzzBalanceSettingsRepoStub struct {
	values map[string]string
}

func (s *buzzBalanceSettingsRepoStub) Get(context.Context, string) (*Setting, error) {
	panic("unexpected Get call")
}

func (s *buzzBalanceSettingsRepoStub) GetValue(context.Context, string) (string, error) {
	panic("unexpected GetValue call")
}

func (s *buzzBalanceSettingsRepoStub) Set(context.Context, string, string) error {
	panic("unexpected Set call")
}

func (s *buzzBalanceSettingsRepoStub) GetMultiple(_ context.Context, keys []string) (map[string]string, error) {
	out := make(map[string]string, len(keys))
	for _, key := range keys {
		if value, ok := s.values[key]; ok {
			out[key] = value
		}
	}
	return out, nil
}

func (s *buzzBalanceSettingsRepoStub) SetMultiple(context.Context, map[string]string) error {
	panic("unexpected SetMultiple call")
}

func (s *buzzBalanceSettingsRepoStub) GetAll(context.Context) (map[string]string, error) {
	panic("unexpected GetAll call")
}

func (s *buzzBalanceSettingsRepoStub) Delete(context.Context, string) error {
	panic("unexpected Delete call")
}
