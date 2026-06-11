package service

import (
	"context"
	"testing"
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

func TestChannelMonitorAutoScheduleMatchesAccountsByMonitorNameWhenNoAccountIDIsLinked(t *testing.T) {
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

	if repo.listedPlatform != PlatformOpenAI {
		t.Fatalf("expected accounts to be listed by monitor provider %q, got %q", PlatformOpenAI, repo.listedPlatform)
	}
	if len(repo.calls) != 1 {
		t.Fatalf("expected one name-matched schedulable update, got %+v", repo.calls)
	}
	if repo.calls[0].accountID != 51 || repo.calls[0].schedulable {
		t.Fatalf("expected name-matched account 51 schedulable=false, got %+v", repo.calls[0])
	}
}

func TestChannelMonitorAutoScheduleDoesNothingWhenNoAccountNameMatches(t *testing.T) {
	repo := &autoScheduleAccountRepoStub{
		accounts: []Account{
			{ID: 61, Name: "GPT-QLhazycoder", Platform: PlatformOpenAI},
		},
	}
	svc := NewChannelMonitorService(nil, nil)
	svc.SetAccountScheduleAutomation(repo, channelMonitorScheduleAutomationFunc(func(context.Context) bool {
		return true
	}))

	svc.applyAccountAutoSchedule(context.Background(), &ChannelMonitor{
		ID:       12,
		Name:     "GPT-Missing",
		Provider: PlatformOpenAI,
	}, []*CheckResult{
		{Model: "gpt-5", Status: "failed"},
	})

	if len(repo.calls) != 0 {
		t.Fatalf("expected no schedulable updates without a name match, got %+v", repo.calls)
	}
}

func TestChannelMonitorAutoScheduleUpdatesAllAccountsWithMatchingMonitorName(t *testing.T) {
	repo := &autoScheduleAccountRepoStub{
		accounts: []Account{
			{ID: 71, Name: "GPT-RawChat", Platform: PlatformOpenAI},
			{ID: 72, Name: "GPT-RawChat", Platform: PlatformOpenAI},
		},
	}
	svc := NewChannelMonitorService(nil, nil)
	svc.SetAccountScheduleAutomation(repo, channelMonitorScheduleAutomationFunc(func(context.Context) bool {
		return true
	}))

	svc.applyAccountAutoSchedule(context.Background(), &ChannelMonitor{
		ID:       13,
		Name:     "GPT-RawChat",
		Provider: PlatformOpenAI,
	}, []*CheckResult{
		{Model: "gpt-5", Status: "failed"},
	})

	if len(repo.calls) != 2 {
		t.Fatalf("expected both name-matched accounts to be updated, got %+v", repo.calls)
	}
	if repo.calls[0] != (autoScheduleCall{accountID: 71, schedulable: false}) ||
		repo.calls[1] != (autoScheduleCall{accountID: 72, schedulable: false}) {
		t.Fatalf("unexpected name-matched updates: %+v", repo.calls)
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
