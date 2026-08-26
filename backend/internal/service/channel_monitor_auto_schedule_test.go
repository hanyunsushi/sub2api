package service

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strconv"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/pkg/openai_compat"
)

type autoScheduleAccountRepoStub struct {
	accounts       []Account
	locked         map[int64]bool
	calls          []autoScheduleCall
	listedPlatform string
}

type autoScheduleCall struct {
	accountID   int64
	schedulable bool
}

type autoScheduleRuntimeStub struct {
	enabled          bool
	origins          []string
	failureThreshold int
}

func (s autoScheduleRuntimeStub) GetChannelMonitorRuntime(context.Context) ChannelMonitorRuntime {
	return ChannelMonitorRuntime{Enabled: true, Mode: ChannelMonitorModeV1}
}

func (s autoScheduleRuntimeStub) ChannelMonitorAccountAutoScheduleEnabled(context.Context) bool {
	return s.enabled
}

func (s autoScheduleRuntimeStub) ChannelMonitorLocalGatewayOrigins(context.Context) []string {
	return s.origins
}

func (s autoScheduleRuntimeStub) ChannelMonitorAccountAutoScheduleFailureThreshold(context.Context) int {
	return s.failureThreshold
}

func (r *autoScheduleAccountRepoStub) SetSchedulable(_ context.Context, id int64, schedulable bool) error {
	r.calls = append(r.calls, autoScheduleCall{accountID: id, schedulable: schedulable})
	return nil
}

func (r *autoScheduleAccountRepoStub) IsScheduleLocked(_ context.Context, id int64) (bool, error) {
	if r.locked == nil {
		return false, nil
	}
	return r.locked[id], nil
}

func (r *autoScheduleAccountRepoStub) ListByPlatform(_ context.Context, platform string) ([]Account, error) {
	r.listedPlatform = platform
	return r.accounts, nil
}

func (r *autoScheduleAccountRepoStub) GetByIDs(_ context.Context, ids []int64) ([]*Account, error) {
	accountsByID := make(map[int64]Account, len(r.accounts))
	for _, account := range r.accounts {
		accountsByID[account.ID] = account
	}
	out := make([]*Account, 0, len(ids))
	for _, id := range ids {
		account, ok := accountsByID[id]
		if !ok {
			continue
		}
		accountCopy := account
		out = append(out, &accountCopy)
	}
	return out, nil
}

type channelMonitorRepoCreateStub struct {
	created *ChannelMonitor
}

func (r *channelMonitorRepoCreateStub) Create(_ context.Context, m *ChannelMonitor) error {
	copy := *m
	copy.AccountIDs = append([]int64(nil), m.AccountIDs...)
	copy.ID = 101
	r.created = &copy
	m.ID = copy.ID
	return nil
}

func (r *channelMonitorRepoCreateStub) GetByID(context.Context, int64) (*ChannelMonitor, error) {
	panic("unexpected GetByID call")
}

func (r *channelMonitorRepoCreateStub) Update(context.Context, *ChannelMonitor) error {
	panic("unexpected Update call")
}

func (r *channelMonitorRepoCreateStub) Delete(context.Context, int64) error {
	panic("unexpected Delete call")
}

func (r *channelMonitorRepoCreateStub) List(context.Context, ChannelMonitorListParams) ([]*ChannelMonitor, int64, error) {
	panic("unexpected List call")
}

func (r *channelMonitorRepoCreateStub) FindByDuplicateOperationID(context.Context, string) (*ChannelMonitor, error) {
	return nil, nil
}

func (r *channelMonitorRepoCreateStub) ListEnabled(context.Context) ([]*ChannelMonitor, error) {
	panic("unexpected ListEnabled call")
}

func (r *channelMonitorRepoCreateStub) MarkChecked(context.Context, int64, time.Time) error {
	panic("unexpected MarkChecked call")
}

func (r *channelMonitorRepoCreateStub) InsertHistoryBatch(context.Context, []*ChannelMonitorHistoryRow) error {
	panic("unexpected InsertHistoryBatch call")
}

func (r *channelMonitorRepoCreateStub) DeleteHistoryBefore(context.Context, time.Time) (int64, error) {
	panic("unexpected DeleteHistoryBefore call")
}

func (r *channelMonitorRepoCreateStub) ListHistory(context.Context, int64, string, int) ([]*ChannelMonitorHistoryEntry, error) {
	panic("unexpected ListHistory call")
}

func (r *channelMonitorRepoCreateStub) ListLatestPerModel(context.Context, int64) ([]*ChannelMonitorLatest, error) {
	panic("unexpected ListLatestPerModel call")
}

func (r *channelMonitorRepoCreateStub) ComputeAvailability(context.Context, int64, int) ([]*ChannelMonitorAvailability, error) {
	panic("unexpected ComputeAvailability call")
}

func (r *channelMonitorRepoCreateStub) ListLatestForMonitorIDs(context.Context, []int64) (map[int64][]*ChannelMonitorLatest, error) {
	panic("unexpected ListLatestForMonitorIDs call")
}

func (r *channelMonitorRepoCreateStub) ComputeAvailabilityForMonitors(context.Context, []int64, int) (map[int64][]*ChannelMonitorAvailability, error) {
	panic("unexpected ComputeAvailabilityForMonitors call")
}

func (r *channelMonitorRepoCreateStub) ListRecentHistoryForMonitors(context.Context, []int64, map[int64]string, int) (map[int64][]*ChannelMonitorHistoryEntry, error) {
	panic("unexpected ListRecentHistoryForMonitors call")
}

func (r *channelMonitorRepoCreateStub) UpsertDailyRollupsFor(context.Context, time.Time) (int64, error) {
	panic("unexpected UpsertDailyRollupsFor call")
}

func (r *channelMonitorRepoCreateStub) DeleteRollupsBefore(context.Context, time.Time) (int64, error) {
	panic("unexpected DeleteRollupsBefore call")
}

func (r *channelMonitorRepoCreateStub) LoadAggregationWatermark(context.Context) (*time.Time, error) {
	panic("unexpected LoadAggregationWatermark call")
}

func (r *channelMonitorRepoCreateStub) UpdateAggregationWatermark(context.Context, time.Time) error {
	panic("unexpected UpdateAggregationWatermark call")
}

type channelMonitorRepoRunStub struct {
	monitor *ChannelMonitor
	rows    []*ChannelMonitorHistoryRow
}

func (r *channelMonitorRepoRunStub) Create(context.Context, *ChannelMonitor) error {
	panic("unexpected Create call")
}

func (r *channelMonitorRepoRunStub) GetByID(context.Context, int64) (*ChannelMonitor, error) {
	copy := *r.monitor
	copy.AccountIDs = append([]int64(nil), r.monitor.AccountIDs...)
	return &copy, nil
}

func (r *channelMonitorRepoRunStub) Update(context.Context, *ChannelMonitor) error {
	panic("unexpected Update call")
}

func (r *channelMonitorRepoRunStub) Delete(context.Context, int64) error {
	panic("unexpected Delete call")
}

func (r *channelMonitorRepoRunStub) List(context.Context, ChannelMonitorListParams) ([]*ChannelMonitor, int64, error) {
	panic("unexpected List call")
}

func (r *channelMonitorRepoRunStub) FindByDuplicateOperationID(context.Context, string) (*ChannelMonitor, error) {
	return nil, nil
}

func (r *channelMonitorRepoRunStub) ListEnabled(context.Context) ([]*ChannelMonitor, error) {
	panic("unexpected ListEnabled call")
}

func (r *channelMonitorRepoRunStub) MarkChecked(context.Context, int64, time.Time) error {
	return nil
}

func (r *channelMonitorRepoRunStub) InsertHistoryBatch(_ context.Context, rows []*ChannelMonitorHistoryRow) error {
	r.rows = append([]*ChannelMonitorHistoryRow(nil), rows...)
	return nil
}

func (r *channelMonitorRepoRunStub) DeleteHistoryBefore(context.Context, time.Time) (int64, error) {
	panic("unexpected DeleteHistoryBefore call")
}

func (r *channelMonitorRepoRunStub) ListHistory(context.Context, int64, string, int) ([]*ChannelMonitorHistoryEntry, error) {
	panic("unexpected ListHistory call")
}

func (r *channelMonitorRepoRunStub) ListLatestPerModel(context.Context, int64) ([]*ChannelMonitorLatest, error) {
	panic("unexpected ListLatestPerModel call")
}

func (r *channelMonitorRepoRunStub) ComputeAvailability(context.Context, int64, int) ([]*ChannelMonitorAvailability, error) {
	panic("unexpected ComputeAvailability call")
}

func (r *channelMonitorRepoRunStub) ListLatestForMonitorIDs(context.Context, []int64) (map[int64][]*ChannelMonitorLatest, error) {
	panic("unexpected ListLatestForMonitorIDs call")
}

func (r *channelMonitorRepoRunStub) ComputeAvailabilityForMonitors(context.Context, []int64, int) (map[int64][]*ChannelMonitorAvailability, error) {
	panic("unexpected ComputeAvailabilityForMonitors call")
}

func (r *channelMonitorRepoRunStub) ListRecentHistoryForMonitors(context.Context, []int64, map[int64]string, int) (map[int64][]*ChannelMonitorHistoryEntry, error) {
	panic("unexpected ListRecentHistoryForMonitors call")
}

func (r *channelMonitorRepoRunStub) UpsertDailyRollupsFor(context.Context, time.Time) (int64, error) {
	panic("unexpected UpsertDailyRollupsFor call")
}

func (r *channelMonitorRepoRunStub) DeleteRollupsBefore(context.Context, time.Time) (int64, error) {
	panic("unexpected DeleteRollupsBefore call")
}

func (r *channelMonitorRepoRunStub) LoadAggregationWatermark(context.Context) (*time.Time, error) {
	panic("unexpected LoadAggregationWatermark call")
}

func (r *channelMonitorRepoRunStub) UpdateAggregationWatermark(context.Context, time.Time) error {
	panic("unexpected UpdateAggregationWatermark call")
}

type passthroughEncryptor struct{}

func (passthroughEncryptor) Encrypt(value string) (string, error) { return value, nil }
func (passthroughEncryptor) Decrypt(value string) (string, error) { return value, nil }

func TestChannelMonitorCreateAutoBindsAllMatchingAccountsWhenNoAccountIDsProvided(t *testing.T) {
	monitorRepo := &channelMonitorRepoCreateStub{}
	accountRepo := &autoScheduleAccountRepoStub{
		accounts: []Account{
			{ID: 91, Name: "GPT-RawChat", Platform: PlatformOpenAI},
			{ID: 92, Name: "GPT-RawChat", Platform: PlatformOpenAI},
			{ID: 93, Name: "GPT-Other", Platform: PlatformOpenAI},
		},
	}
	svc := NewChannelMonitorService(monitorRepo, passthroughEncryptor{})
	svc.SetAccountScheduleAutomation(accountRepo, channelMonitorScheduleAutomationFunc(func(context.Context) bool {
		return true
	}))

	created, err := svc.Create(context.Background(), ChannelMonitorCreateParams{
		Name:            " GPT-RawChat ",
		Provider:        PlatformOpenAI,
		Endpoint:        "https://example.com",
		APIKey:          "monitor-key",
		PrimaryModel:    "gpt-5",
		Enabled:         true,
		IntervalSeconds: 60,
	})
	if err != nil {
		t.Fatalf("create monitor: %v", err)
	}

	if accountRepo.listedPlatform != PlatformOpenAI {
		t.Fatalf("expected account options to use provider %q, got %q", PlatformOpenAI, accountRepo.listedPlatform)
	}
	want := []int64{91, 92}
	if !equalInt64Slices(created.AccountIDs, want) {
		t.Fatalf("expected created monitor account_ids=%v, got %v", want, created.AccountIDs)
	}
	if monitorRepo.created == nil || !equalInt64Slices(monitorRepo.created.AccountIDs, want) {
		t.Fatalf("expected persisted monitor account_ids=%v, got %+v", want, monitorRepo.created)
	}
}

func TestChannelMonitorAutoScheduleDisablesLinkedAccountOnFailedResult(t *testing.T) {
	repo := &autoScheduleAccountRepoStub{}
	svc := NewChannelMonitorService(nil, nil)
	svc.SetAccountScheduleAutomation(repo, autoScheduleRuntimeStub{enabled: true, failureThreshold: 1})
	accountID := int64(42)
	monitor := &ChannelMonitor{ID: 7, AccountID: &accountID}

	svc.applyAccountAutoSchedule(context.Background(), monitor, []*CheckResult{
		{Model: "claude-sonnet", Status: "operational"},
		{Model: "claude-opus", Status: "failed"},
	})

	if len(repo.calls) != 1 {
		t.Fatalf("expected one schedulable update, got %d", len(repo.calls))
	}
	if repo.calls[0].accountID != accountID || repo.calls[0].schedulable {
		t.Fatalf("expected account %d schedulable=false, got %+v", accountID, repo.calls[0])
	}
}

func TestChannelMonitorAutoScheduleWaitsForDefaultFailureThreshold(t *testing.T) {
	repo := &autoScheduleAccountRepoStub{}
	svc := NewChannelMonitorService(nil, nil)
	svc.SetAccountScheduleAutomation(repo, autoScheduleRuntimeStub{enabled: true})
	accountID := int64(48)
	monitor := &ChannelMonitor{ID: 14, AccountID: &accountID}
	results := []*CheckResult{{Model: "gpt-5", Status: MonitorStatusFailed}}

	svc.applyAccountAutoSchedule(context.Background(), monitor, results)
	if len(repo.calls) != 1 {
		t.Fatalf("expected first failure to keep account schedulable, got %d updates", len(repo.calls))
	}
	if repo.calls[0].accountID != accountID || !repo.calls[0].schedulable {
		t.Fatalf("expected first failure to keep account %d schedulable=true, got %+v", accountID, repo.calls[0])
	}

	svc.applyAccountAutoSchedule(context.Background(), monitor, results)
	want := []autoScheduleCall{
		{accountID: accountID, schedulable: true},
		{accountID: accountID, schedulable: false},
	}
	if !equalAutoScheduleCalls(repo.calls, want) {
		t.Fatalf("expected second consecutive failure to disable account, got %+v", repo.calls)
	}
}

func TestChannelMonitorAutoScheduleSuccessResetsFailureThreshold(t *testing.T) {
	repo := &autoScheduleAccountRepoStub{}
	svc := NewChannelMonitorService(nil, nil)
	svc.SetAccountScheduleAutomation(repo, autoScheduleRuntimeStub{enabled: true})
	accountID := int64(49)
	monitor := &ChannelMonitor{ID: 15, AccountID: &accountID}

	svc.applyAccountAutoSchedule(context.Background(), monitor, []*CheckResult{{Model: "gpt-5", Status: MonitorStatusFailed}})
	svc.applyAccountAutoSchedule(context.Background(), monitor, []*CheckResult{{Model: "gpt-5", Status: MonitorStatusOperational}})
	svc.applyAccountAutoSchedule(context.Background(), monitor, []*CheckResult{{Model: "gpt-5", Status: MonitorStatusFailed}})

	want := []autoScheduleCall{
		{accountID: accountID, schedulable: true},
		{accountID: accountID, schedulable: true},
		{accountID: accountID, schedulable: true},
	}
	if !equalAutoScheduleCalls(repo.calls, want) {
		t.Fatalf("expected success to reset failure count, got %+v", repo.calls)
	}
}

func TestChannelMonitorAutoScheduleByAccountResultsWaitsForDefaultFailureThreshold(t *testing.T) {
	repo := &autoScheduleAccountRepoStub{}
	svc := NewChannelMonitorService(nil, nil)
	svc.SetAccountScheduleAutomation(repo, autoScheduleRuntimeStub{enabled: true})
	accountID := int64(50)
	results := map[int64][]*CheckResult{
		accountID: {{Model: "gpt-5", Status: MonitorStatusError}},
	}

	svc.applyAccountAutoScheduleByAccountResults(context.Background(), 16, results)
	svc.applyAccountAutoScheduleByAccountResults(context.Background(), 16, results)

	want := []autoScheduleCall{
		{accountID: accountID, schedulable: true},
		{accountID: accountID, schedulable: false},
	}
	if !equalAutoScheduleCalls(repo.calls, want) {
		t.Fatalf("expected per-account second consecutive failure to disable account, got %+v", repo.calls)
	}
}

func TestChannelMonitorAutoScheduleKeepsLinkedAccountForLocalGatewayCapacity503(t *testing.T) {
	repo := &autoScheduleAccountRepoStub{}
	svc := NewChannelMonitorService(nil, nil)
	svc.SetAccountScheduleAutomation(repo, autoScheduleRuntimeStub{enabled: true, origins: []string{"https://ai.example.com"}})
	accountID := int64(46)
	monitor := &ChannelMonitor{
		ID:        12,
		Endpoint:  "https://ai.example.com",
		AccountID: &accountID,
	}

	svc.applyAccountAutoSchedule(context.Background(), monitor, []*CheckResult{
		{
			Model:   "openrouter/free",
			Status:  MonitorStatusError,
			Message: `upstream HTTP 503: {"error":{"message":"Service temporarily unavailable","type":"api_error"}}`,
		},
	})

	if len(repo.calls) != 1 {
		t.Fatalf("expected one schedulable update, got %d", len(repo.calls))
	}
	if repo.calls[0].accountID != accountID || !repo.calls[0].schedulable {
		t.Fatalf("expected local gateway capacity 503 to keep account %d schedulable=true, got %+v", accountID, repo.calls[0])
	}
}

func TestChannelMonitorAutoScheduleStillDisablesLinkedAccountForExternal503(t *testing.T) {
	repo := &autoScheduleAccountRepoStub{}
	svc := NewChannelMonitorService(nil, nil)
	svc.SetAccountScheduleAutomation(repo, autoScheduleRuntimeStub{enabled: true, origins: []string{"https://ai.example.com"}, failureThreshold: 1})
	accountID := int64(47)
	monitor := &ChannelMonitor{ID: 13, Endpoint: "https://openrouter.ai", AccountID: &accountID}

	svc.applyAccountAutoSchedule(context.Background(), monitor, []*CheckResult{
		{
			Model:   "openrouter/free",
			Status:  MonitorStatusError,
			Message: `upstream HTTP 503: {"error":{"message":"Service temporarily unavailable","type":"api_error"}}`,
		},
	})

	if len(repo.calls) != 1 {
		t.Fatalf("expected one schedulable update, got %d", len(repo.calls))
	}
	if repo.calls[0].accountID != accountID || repo.calls[0].schedulable {
		t.Fatalf("expected external upstream 503 to set account %d schedulable=false, got %+v", accountID, repo.calls[0])
	}
}

func TestChannelMonitorAutoScheduleEnablesLinkedAccountWhenResultsRecover(t *testing.T) {
	repo := &autoScheduleAccountRepoStub{}
	svc := NewChannelMonitorService(nil, nil)
	svc.SetAccountScheduleAutomation(repo, channelMonitorScheduleAutomationFunc(func(context.Context) bool {
		return true
	}))
	accountID := int64(43)
	monitor := &ChannelMonitor{ID: 8, AccountID: &accountID}

	svc.applyAccountAutoSchedule(context.Background(), monitor, []*CheckResult{
		{Model: "claude-sonnet", Status: "operational"},
		{Model: "claude-haiku", Status: "degraded"},
	})

	if len(repo.calls) != 1 {
		t.Fatalf("expected one schedulable update, got %d", len(repo.calls))
	}
	if repo.calls[0].accountID != accountID || !repo.calls[0].schedulable {
		t.Fatalf("expected account %d schedulable=true, got %+v", accountID, repo.calls[0])
	}
}

func TestChannelMonitorAutoScheduleUpdatesAllSavedAccountIDs(t *testing.T) {
	repo := &autoScheduleAccountRepoStub{}
	svc := NewChannelMonitorService(nil, nil)
	svc.SetAccountScheduleAutomation(repo, autoScheduleRuntimeStub{enabled: true, failureThreshold: 1})

	svc.applyAccountAutoSchedule(context.Background(), &ChannelMonitor{
		ID:         18,
		AccountIDs: []int64{81, 82},
	}, []*CheckResult{
		{Model: "gpt-5", Status: "failed"},
	})

	want := []autoScheduleCall{
		{accountID: 81, schedulable: false},
		{accountID: 82, schedulable: false},
	}
	if !equalAutoScheduleCalls(repo.calls, want) {
		t.Fatalf("expected saved account updates %+v, got %+v", want, repo.calls)
	}
}

func TestChannelMonitorRunCheckUsesBoundAPIKeyAccountWhenSchedulableFalse(t *testing.T) {
	swapMonitorClientsForAutoScheduleTest(t)

	var localGatewayCalls atomic.Int32
	localGateway := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		localGatewayCalls.Add(1)
		w.WriteHeader(http.StatusServiceUnavailable)
		_, _ = w.Write([]byte(`{"error":{"message":"no available accounts","type":"api_error"}}`))
	}))
	t.Cleanup(localGateway.Close)

	var upstreamAuth atomic.Value
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		upstreamAuth.Store(r.Header.Get("Authorization"))
		defer func() { _ = r.Body.Close() }()
		var body map[string]any
		_ = json.NewDecoder(r.Body).Decode(&body)
		answer := answerFromMonitorAutoScheduleOpenAIRequest(body)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"choices": []map[string]any{{"message": map[string]any{"content": answer}}},
		})
	}))
	t.Cleanup(upstream.Close)

	accountID := int64(8)
	accountRepo := &autoScheduleAccountRepoStub{
		accounts: []Account{
			{
				ID:          accountID,
				Name:        "OpenRouter-free",
				Platform:    PlatformOpenAI,
				Type:        AccountTypeAPIKey,
				Status:      StatusActive,
				Schedulable: false,
				Credentials: map[string]any{
					"api_key":  "real-upstream-key",
					"base_url": upstream.URL,
				},
			},
		},
	}
	svc := NewChannelMonitorService(nil, nil)
	svc.SetAccountScheduleAutomation(accountRepo, channelMonitorScheduleAutomationFunc(func(context.Context) bool {
		return true
	}))

	results := svc.runChecksConcurrent(context.Background(), &ChannelMonitor{
		ID:              7,
		Name:            "OpenRouter-free",
		Provider:        MonitorProviderOpenAI,
		Endpoint:        localGateway.URL,
		APIKey:          "local-sub2api-key",
		PrimaryModel:    "openrouter/free",
		AccountIDs:      []int64{accountID},
		APIMode:         MonitorAPIModeChatCompletions,
		IntervalSeconds: 60,
	})

	if len(results) != 1 {
		t.Fatalf("expected one check result, got %d", len(results))
	}
	if results[0].Status != MonitorStatusOperational {
		t.Fatalf("expected bound schedulable=false account to be probed directly, got status=%s message=%q", results[0].Status, results[0].Message)
	}
	if localGatewayCalls.Load() != 0 {
		t.Fatalf("expected local gateway not to be called, got %d calls", localGatewayCalls.Load())
	}
	if got, _ := upstreamAuth.Load().(string); got != "Bearer real-upstream-key" {
		t.Fatalf("expected upstream request to use bound account API key, got %q", got)
	}
}

func TestChannelMonitorRunCheckReportsBoundAccountErrorWithoutGatewayFallback(t *testing.T) {
	swapMonitorClientsForAutoScheduleTest(t)

	var localGatewayCalls atomic.Int32
	localGateway := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		localGatewayCalls.Add(1)
		w.WriteHeader(http.StatusServiceUnavailable)
		_, _ = w.Write([]byte(`{"error":{"message":"Service temporarily unavailable","type":"api_error"}}`))
	}))
	t.Cleanup(localGateway.Close)

	accountID := int64(12)
	accountRepo := &autoScheduleAccountRepoStub{
		accounts: []Account{
			{
				ID:           accountID,
				Name:         "Mimo",
				Platform:     PlatformOpenAI,
				Type:         AccountTypeAPIKey,
				Status:       StatusError,
				ErrorMessage: "Authentication failed (401): Invalid API Key",
				Credentials: map[string]any{
					"api_key":  "invalid-upstream-key",
					"base_url": "https://upstream.example.com",
				},
			},
		},
	}
	monitor := &ChannelMonitor{
		ID:              2,
		Name:            "Mimo",
		Provider:        MonitorProviderOpenAI,
		Endpoint:        localGateway.URL,
		APIKey:          "local-sub2api-key",
		PrimaryModel:    "mimo-v2.5",
		AccountIDs:      []int64{accountID},
		APIMode:         MonitorAPIModeChatCompletions,
		IntervalSeconds: 60,
	}
	monitorRepo := &channelMonitorRepoRunStub{monitor: monitor}
	svc := NewChannelMonitorService(monitorRepo, passthroughEncryptor{})
	svc.SetAccountScheduleAutomation(accountRepo, autoScheduleRuntimeStub{enabled: true, failureThreshold: 1})

	results, err := svc.RunCheck(context.Background(), monitor.ID)
	if err != nil {
		t.Fatalf("run check: %v", err)
	}

	if len(results) != 1 {
		t.Fatalf("expected one check result, got %d", len(results))
	}
	if results[0].Status != MonitorStatusError {
		t.Fatalf("expected bound account error status, got %s", results[0].Status)
	}
	if !strings.Contains(results[0].Message, "401") || !strings.Contains(results[0].Message, "Invalid API Key") {
		t.Fatalf("expected stored bound account error, got %q", results[0].Message)
	}
	if localGatewayCalls.Load() != 0 {
		t.Fatalf("expected local gateway not to be called, got %d calls", localGatewayCalls.Load())
	}
	wantScheduleCalls := []autoScheduleCall{{accountID: accountID, schedulable: false}}
	if !equalAutoScheduleCalls(accountRepo.calls, wantScheduleCalls) {
		t.Fatalf("expected bound account to be unscheduled, got %+v", accountRepo.calls)
	}
	if len(monitorRepo.rows) != 1 || !strings.Contains(monitorRepo.rows[0].Message, "401") {
		t.Fatalf("expected stored 401 in monitor history, got %+v", monitorRepo.rows)
	}
}

func TestChannelMonitorBoundOpenAIAccountHonorsV1BaseURL(t *testing.T) {
	swapMonitorClientsForAutoScheduleTest(t)

	var upstreamPath atomic.Value
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		upstreamPath.Store(r.URL.Path)
		if r.URL.Path != providerOpenAIPath {
			w.WriteHeader(http.StatusNotFound)
			_, _ = w.Write([]byte(`{"error":{"message":"wrong path"}}`))
			return
		}
		defer func() { _ = r.Body.Close() }()
		var body map[string]any
		_ = json.NewDecoder(r.Body).Decode(&body)
		answer := answerFromMonitorAutoScheduleOpenAIRequest(body)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"choices": []map[string]any{{"message": map[string]any{"content": answer}}},
		})
	}))
	t.Cleanup(upstream.Close)

	accountID := int64(18)
	accountRepo := &autoScheduleAccountRepoStub{
		accounts: []Account{
			{
				ID:          accountID,
				Platform:    PlatformOpenAI,
				Type:        AccountTypeAPIKey,
				Status:      StatusActive,
				Schedulable: false,
				Credentials: map[string]any{
					"api_key":  "real-upstream-key",
					"base_url": upstream.URL + "/v1",
				},
			},
		},
	}
	svc := NewChannelMonitorService(nil, nil)
	svc.SetAccountScheduleAutomation(accountRepo, channelMonitorScheduleAutomationFunc(func(context.Context) bool {
		return true
	}))

	results := svc.runChecksConcurrent(context.Background(), &ChannelMonitor{
		ID:              17,
		Provider:        MonitorProviderOpenAI,
		Endpoint:        "https://ai.example.com",
		APIKey:          "local-sub2api-key",
		PrimaryModel:    "openrouter/free",
		AccountIDs:      []int64{accountID},
		APIMode:         MonitorAPIModeChatCompletions,
		IntervalSeconds: 60,
	})

	if len(results) != 1 || results[0].Status != MonitorStatusOperational {
		t.Fatalf("expected /v1 base_url probe to succeed, got %+v", results)
	}
	if got, _ := upstreamPath.Load().(string); got != providerOpenAIPath {
		t.Fatalf("expected upstream path %q, got %q", providerOpenAIPath, got)
	}
}

func TestChannelMonitorBoundOpenAIAccountFollowsResponsesCapability(t *testing.T) {
	swapMonitorClientsForAutoScheduleTest(t)

	var upstreamPath atomic.Value
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		upstreamPath.Store(r.URL.Path)
		if r.URL.Path != "/codex"+providerOpenAIResponsesPath {
			w.WriteHeader(http.StatusNotFound)
			_, _ = w.Write([]byte("Not Found"))
			return
		}
		defer func() { _ = r.Body.Close() }()
		var body map[string]any
		_ = json.NewDecoder(r.Body).Decode(&body)
		answer := answerFromMonitorAutoScheduleOpenAIRequest(body)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"output": []map[string]any{{
				"type": "message",
				"content": []map[string]any{{
					"type": "output_text",
					"text": answer,
				}},
			}},
		})
	}))
	t.Cleanup(upstream.Close)

	accountID := int64(29)
	accountRepo := &autoScheduleAccountRepoStub{
		accounts: []Account{
			{
				ID:          accountID,
				Platform:    PlatformOpenAI,
				Type:        AccountTypeAPIKey,
				Status:      StatusActive,
				Schedulable: false,
				Credentials: map[string]any{
					"api_key":  "rawchat-key",
					"base_url": upstream.URL + "/codex",
				},
				Extra: map[string]any{
					openai_compat.ExtraKeyResponsesSupported: true,
				},
			},
		},
	}
	svc := NewChannelMonitorService(nil, nil)
	svc.SetAccountScheduleAutomation(accountRepo, channelMonitorScheduleAutomationFunc(func(context.Context) bool {
		return true
	}))

	results := svc.runChecksConcurrent(context.Background(), &ChannelMonitor{
		ID:               14,
		Provider:         MonitorProviderOpenAI,
		Endpoint:         "https://ai.example.com",
		APIKey:           "local-sub2api-key",
		PrimaryModel:     "gpt-5.4-mini",
		AccountIDs:       []int64{accountID},
		APIMode:          MonitorAPIModeChatCompletions,
		BodyOverrideMode: MonitorBodyOverrideModeReplace,
		BodyOverride:     map[string]any{"model": "gpt-5.4-mini", "messages": []any{map[string]any{"role": "user", "content": "Respond with exactly: ok"}}, "stream": false},
		IntervalSeconds:  60,
	})

	if len(results) != 1 || results[0].Status != MonitorStatusOperational {
		if len(results) == 1 {
			t.Fatalf("expected responses-capable bound account probe to succeed, got status=%s message=%q", results[0].Status, results[0].Message)
		}
		t.Fatalf("expected one responses-capable bound account probe result, got %d", len(results))
	}
	if got, _ := upstreamPath.Load().(string); got != "/codex"+providerOpenAIResponsesPath {
		t.Fatalf("expected responses-capable bound account to use responses path, got %q", got)
	}
}

func TestChannelMonitorBoundOpenAIAccountFollowsChatCompletionsCapability(t *testing.T) {
	swapMonitorClientsForAutoScheduleTest(t)

	var upstreamPath atomic.Value
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		upstreamPath.Store(r.URL.Path)
		if r.URL.Path != providerOpenAIPath {
			w.WriteHeader(http.StatusNotFound)
			_, _ = w.Write([]byte("Not Found"))
			return
		}
		defer func() { _ = r.Body.Close() }()
		var body map[string]any
		_ = json.NewDecoder(r.Body).Decode(&body)
		answer := answerFromMonitorAutoScheduleOpenAIRequest(body)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"choices": []map[string]any{{"message": map[string]any{"content": answer}}},
		})
	}))
	t.Cleanup(upstream.Close)

	accountID := int64(30)
	accountRepo := &autoScheduleAccountRepoStub{
		accounts: []Account{
			{
				ID:       accountID,
				Platform: PlatformOpenAI,
				Type:     AccountTypeAPIKey,
				Status:   StatusActive,
				Credentials: map[string]any{
					"api_key":  "chat-only-key",
					"base_url": upstream.URL,
				},
				Extra: map[string]any{
					openai_compat.ExtraKeyResponsesSupported: false,
				},
			},
		},
	}
	svc := NewChannelMonitorService(nil, nil)
	svc.SetAccountScheduleAutomation(accountRepo, channelMonitorScheduleAutomationFunc(func(context.Context) bool {
		return true
	}))

	results := svc.runChecksConcurrent(context.Background(), &ChannelMonitor{
		ID:              15,
		Provider:        MonitorProviderOpenAI,
		Endpoint:        "https://ai.example.com",
		APIKey:          "local-sub2api-key",
		PrimaryModel:    "gpt-5.4-mini",
		AccountIDs:      []int64{accountID},
		APIMode:         MonitorAPIModeResponses,
		IntervalSeconds: 60,
	})

	if len(results) != 1 || results[0].Status != MonitorStatusOperational {
		if len(results) == 1 {
			t.Fatalf("expected chat-capable bound account probe to succeed, got status=%s message=%q", results[0].Status, results[0].Message)
		}
		t.Fatalf("expected one chat-capable bound account probe result, got %d", len(results))
	}
	if got, _ := upstreamPath.Load().(string); got != providerOpenAIPath {
		t.Fatalf("expected chat-capable bound account to use chat completions path, got %q", got)
	}
}

func TestChannelMonitorRunCheckAutoSchedulesBoundAccountsIndividually(t *testing.T) {
	swapMonitorClientsForAutoScheduleTest(t)

	successUpstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() { _ = r.Body.Close() }()
		var body map[string]any
		_ = json.NewDecoder(r.Body).Decode(&body)
		answer := answerFromMonitorAutoScheduleOpenAIRequest(body)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"choices": []map[string]any{{"message": map[string]any{"content": answer}}},
		})
	}))
	t.Cleanup(successUpstream.Close)

	failedUpstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"error":{"message":"bad key"}}`))
	}))
	t.Cleanup(failedUpstream.Close)

	monitor := &ChannelMonitor{
		ID:              9,
		Provider:        MonitorProviderOpenAI,
		Endpoint:        "https://ai.example.com",
		APIKey:          "local-sub2api-key",
		PrimaryModel:    "openrouter/free",
		AccountIDs:      []int64{81, 82},
		APIMode:         MonitorAPIModeChatCompletions,
		IntervalSeconds: 60,
	}
	monitorRepo := &channelMonitorRepoRunStub{monitor: monitor}
	accountRepo := &autoScheduleAccountRepoStub{
		accounts: []Account{
			{
				ID:          81,
				Platform:    PlatformOpenAI,
				Type:        AccountTypeAPIKey,
				Status:      StatusActive,
				Schedulable: false,
				Credentials: map[string]any{"api_key": "ok-key", "base_url": successUpstream.URL},
			},
			{
				ID:          82,
				Platform:    PlatformOpenAI,
				Type:        AccountTypeAPIKey,
				Status:      StatusActive,
				Schedulable: false,
				Credentials: map[string]any{"api_key": "bad-key", "base_url": failedUpstream.URL},
			},
		},
	}
	svc := NewChannelMonitorService(monitorRepo, passthroughEncryptor{})
	svc.SetAccountScheduleAutomation(accountRepo, autoScheduleRuntimeStub{enabled: true, failureThreshold: 1})

	results, err := svc.RunCheck(context.Background(), monitor.ID)
	if err != nil {
		t.Fatalf("run check: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected one merged result, got %d", len(results))
	}
	if results[0].Status != MonitorStatusError {
		t.Fatalf("expected merged monitor result to expose worst bound account status, got %s", results[0].Status)
	}
	want := []autoScheduleCall{
		{accountID: 81, schedulable: true},
		{accountID: 82, schedulable: false},
	}
	if !equalAutoScheduleCalls(accountRepo.calls, want) {
		t.Fatalf("expected per-account schedule updates %+v, got %+v", want, accountRepo.calls)
	}
	if len(monitorRepo.rows) != 1 || monitorRepo.rows[0].Status != MonitorStatusError {
		t.Fatalf("expected merged error history row, got %+v", monitorRepo.rows)
	}
}

func TestChannelMonitorAutoScheduleDoesNothingWhenGlobalSettingIsDisabled(t *testing.T) {
	repo := &autoScheduleAccountRepoStub{}
	svc := NewChannelMonitorService(nil, nil)
	svc.SetAccountScheduleAutomation(repo, channelMonitorScheduleAutomationFunc(func(context.Context) bool {
		return false
	}))
	accountID := int64(44)
	monitor := &ChannelMonitor{ID: 9, AccountID: &accountID}

	svc.applyAccountAutoSchedule(context.Background(), monitor, []*CheckResult{
		{Model: "claude-sonnet", Status: "error"},
	})

	if len(repo.calls) != 0 {
		t.Fatalf("expected no schedulable updates when automation is disabled, got %+v", repo.calls)
	}
}

func TestChannelMonitorAutoScheduleDoesNotMatchAccountsByNameAfterCreation(t *testing.T) {
	repo := &autoScheduleAccountRepoStub{
		accounts: []Account{
			{ID: 51, Name: "GPT-QLhazycoder", Platform: PlatformOpenAI},
			{ID: 52, Name: "GPT-PixelAPI", Platform: PlatformOpenAI},
		},
	}
	svc := NewChannelMonitorService(nil, nil)
	svc.SetAccountScheduleAutomation(repo, channelMonitorScheduleAutomationFunc(func(context.Context) bool {
		return true
	}))

	svc.applyAccountAutoSchedule(context.Background(), &ChannelMonitor{
		ID:       10,
		Name:     " GPT-QLhazycoder ",
		Provider: PlatformOpenAI,
	}, []*CheckResult{
		{Model: "gpt-5", Status: "failed"},
	})

	if repo.listedPlatform != "" {
		t.Fatalf("expected no account lookup after monitor creation, got platform %q", repo.listedPlatform)
	}
	if len(repo.calls) != 0 {
		t.Fatalf("expected no dynamic name-matched updates after creation, got %+v", repo.calls)
	}
}

func TestChannelMonitorAutoScheduleDoesNothingWhenNoAccountNameMatches(t *testing.T) {
	monitorRepo := &channelMonitorRepoCreateStub{}
	accountRepo := &autoScheduleAccountRepoStub{
		accounts: []Account{
			{ID: 61, Name: "GPT-QLhazycoder", Platform: PlatformOpenAI},
		},
	}
	svc := NewChannelMonitorService(monitorRepo, passthroughEncryptor{})
	svc.SetAccountScheduleAutomation(accountRepo, channelMonitorScheduleAutomationFunc(func(context.Context) bool {
		return true
	}))

	created, err := svc.Create(context.Background(), ChannelMonitorCreateParams{
		Name:            "GPT-Missing",
		Provider:        PlatformOpenAI,
		Endpoint:        "https://example.com",
		APIKey:          "monitor-key",
		PrimaryModel:    "gpt-5",
		Enabled:         true,
		IntervalSeconds: 60,
	})
	if err != nil {
		t.Fatalf("create monitor: %v", err)
	}
	if accountRepo.listedPlatform != PlatformOpenAI {
		t.Fatalf("expected account options to use provider %q, got %q", PlatformOpenAI, accountRepo.listedPlatform)
	}
	if len(created.AccountIDs) != 0 {
		t.Fatalf("expected no create-time account_ids when names do not match, got %v", created.AccountIDs)
	}
}

func TestChannelMonitorAutoScheduleDoesNothingWhenLinkedAccountIsScheduleLocked(t *testing.T) {
	accountID := int64(45)
	repo := &autoScheduleAccountRepoStub{locked: map[int64]bool{accountID: true}}
	svc := NewChannelMonitorService(nil, nil)
	svc.SetAccountScheduleAutomation(repo, channelMonitorScheduleAutomationFunc(func(context.Context) bool {
		return true
	}))
	monitor := &ChannelMonitor{ID: 11, AccountID: &accountID}

	svc.applyAccountAutoSchedule(context.Background(), monitor, []*CheckResult{
		{Model: "claude-sonnet", Status: "failed"},
	})

	if len(repo.calls) != 0 {
		t.Fatalf("expected no schedulable updates for locked account, got %+v", repo.calls)
	}
}

func swapMonitorClientsForAutoScheduleTest(t *testing.T) {
	t.Helper()
	origClient := monitorHTTPClient
	origPingClient := monitorPingHTTPClient
	monitorHTTPClient = &http.Client{Timeout: 5 * time.Second}
	monitorPingHTTPClient = &http.Client{Timeout: 5 * time.Second}
	t.Cleanup(func() {
		monitorHTTPClient = origClient
		monitorPingHTTPClient = origPingClient
	})
}

var monitorAutoScheduleChallengeRegex = regexp.MustCompile(`Q: (\d+) ([+-]) (\d+) = \?\nA:$`)

func answerFromMonitorAutoScheduleOpenAIRequest(body map[string]any) string {
	prompt := ""
	if messages, ok := body["messages"].([]any); ok && len(messages) > 0 {
		if msg, ok := messages[0].(map[string]any); ok {
			prompt, _ = msg["content"].(string)
		}
	}
	if strings.TrimSpace(prompt) == "" {
		prompt, _ = body["input"].(string)
	}
	matches := monitorAutoScheduleChallengeRegex.FindStringSubmatch(prompt)
	if len(matches) != 4 {
		return "0"
	}
	left, _ := strconv.Atoi(matches[1])
	right, _ := strconv.Atoi(matches[3])
	if strings.TrimSpace(matches[2]) == "+" {
		return strconv.Itoa(left + right)
	}
	return strconv.Itoa(left - right)
}

func equalInt64Slices(left, right []int64) bool {
	if len(left) != len(right) {
		return false
	}
	for index := range left {
		if left[index] != right[index] {
			return false
		}
	}
	return true
}

func equalAutoScheduleCalls(left, right []autoScheduleCall) bool {
	if len(left) != len(right) {
		return false
	}
	for index := range left {
		if left[index] != right[index] {
			return false
		}
	}
	return true
}
