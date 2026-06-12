package service

import (
	"context"
	"testing"
	"time"
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
	enabled bool
	origins []string
}

func (s autoScheduleRuntimeStub) ChannelMonitorAccountAutoScheduleEnabled(context.Context) bool {
	return s.enabled
}

func (s autoScheduleRuntimeStub) ChannelMonitorLocalGatewayOrigins(context.Context) []string {
	return s.origins
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
	svc.SetAccountScheduleAutomation(repo, channelMonitorScheduleAutomationFunc(func(context.Context) bool {
		return true
	}))
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
	svc.SetAccountScheduleAutomation(repo, autoScheduleRuntimeStub{enabled: true, origins: []string{"https://ai.example.com"}})
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
	svc.SetAccountScheduleAutomation(repo, channelMonitorScheduleAutomationFunc(func(context.Context) bool {
		return true
	}))

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
