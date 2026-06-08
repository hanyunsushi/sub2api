package admin

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func setupAccountRateMultiplierRouter() (*gin.Engine, *stubAdminService) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	adminSvc := newStubAdminService()
	handler := NewAccountHandler(adminSvc, nil, nil, nil, nil, nil, nil, nil, nil, nil, nil, nil, nil)
	router.PUT("/api/v1/admin/accounts/:id/rate-multiplier", handler.UpdateRateMultiplier)
	return router, adminSvc
}

func TestAccountHandlerUpdateRateMultiplierOnlyUpdatesRateMultiplier(t *testing.T) {
	router, adminSvc := setupAccountRateMultiplierRouter()

	raw, err := json.Marshal(map[string]any{
		"rate_multiplier": 1.25,
	})
	require.NoError(t, err)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPut, "/api/v1/admin/accounts/42/rate-multiplier", bytes.NewReader(raw))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(rec, req)

	require.Equal(t, http.StatusOK, rec.Code)
	require.Equal(t, []int64{42}, adminSvc.updatedAccountIDs)
	require.Len(t, adminSvc.updatedAccounts, 1)
	require.NotNil(t, adminSvc.updatedAccounts[0].RateMultiplier)
	require.InDelta(t, 1.25, *adminSvc.updatedAccounts[0].RateMultiplier, 0.0001)
	require.Empty(t, adminSvc.updatedAccounts[0].Name)
	require.Nil(t, adminSvc.updatedAccounts[0].Credentials)
	require.Nil(t, adminSvc.updatedAccounts[0].Extra)
	require.Nil(t, adminSvc.updatedAccounts[0].GroupIDs)

	var payload struct {
		Data struct {
			ID             int64    `json:"id"`
			RateMultiplier *float64 `json:"rate_multiplier"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &payload))
	require.Equal(t, int64(42), payload.Data.ID)
	require.NotNil(t, payload.Data.RateMultiplier)
	require.InDelta(t, 1.25, *payload.Data.RateMultiplier, 0.0001)
}

func TestAccountHandlerUpdateRateMultiplierRejectsMissingOrNegativeValue(t *testing.T) {
	t.Run("missing", func(t *testing.T) {
		router, adminSvc := setupAccountRateMultiplierRouter()

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodPut, "/api/v1/admin/accounts/42/rate-multiplier", bytes.NewReader([]byte(`{}`)))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)

		require.Equal(t, http.StatusBadRequest, rec.Code)
		require.Empty(t, adminSvc.updatedAccounts)
	})

	t.Run("negative", func(t *testing.T) {
		router, adminSvc := setupAccountRateMultiplierRouter()

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodPut, "/api/v1/admin/accounts/42/rate-multiplier", bytes.NewReader([]byte(`{"rate_multiplier":-0.1}`)))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)

		require.Equal(t, http.StatusBadRequest, rec.Code)
		require.Empty(t, adminSvc.updatedAccounts)
	})
}
