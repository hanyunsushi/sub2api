package service

import (
	"context"
	"testing"
)

type autoScheduleAccountRepoStub struct {
	locked map[int64]bool
	calls  []autoScheduleCall
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

func TestChannelMonitorAutoScheduleDoesNothingWithoutLinkedAccount(t *testing.T) {
	repo := &autoScheduleAccountRepoStub{}
	svc := NewChannelMonitorService(nil, nil)
	svc.SetAccountScheduleAutomation(repo, channelMonitorScheduleAutomationFunc(func(context.Context) bool {
		return true
	}))

	svc.applyAccountAutoSchedule(context.Background(), &ChannelMonitor{ID: 10}, []*CheckResult{
		{Model: "claude-sonnet", Status: "failed"},
	})

	if len(repo.calls) != 0 {
		t.Fatalf("expected no schedulable updates without account binding, got %+v", repo.calls)
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
