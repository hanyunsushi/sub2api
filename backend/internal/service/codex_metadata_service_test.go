package service

import (
	"context"
	"slices"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestCodexMetadataService_UpdateAccountMetadata(t *testing.T) {
	ctx := context.Background()
	repo := newFakeCodexMetadataRepository()
	svc := NewCodexMetadataService(repo)

	got, err := svc.UpdateAccountMetadata(ctx, UpdateCodexAccountMetadataRequest{
		AuthName:    "  account1.json  ",
		GroupID:     codexInt64Ptr(7),
		DisplayName: codexStringPtr("  Prod Account  "),
		Note:        codexStringPtr("  main pool  "),
		LocalTags:   []string{" prod ", "", "critical"},
		Settings:    map[string]any{"proxy_template": "home"},
		SortOrder:   codexIntPtr(3),
	})

	require.NoError(t, err)
	require.Equal(t, "account1.json", got.AuthName)
	require.Equal(t, int64(7), *got.GroupID)
	require.Equal(t, "Prod Account", got.DisplayName)
	require.Equal(t, "main pool", got.Note)
	require.Equal(t, []string{"prod", "critical"}, got.LocalTags)
	require.Equal(t, map[string]any{"proxy_template": "home"}, got.Settings)
	require.Equal(t, 3, got.SortOrder)

	got, err = svc.UpdateAccountMetadata(ctx, UpdateCodexAccountMetadataRequest{
		AuthName: "account1.json",
		Note:     codexStringPtr("updated"),
	})

	require.NoError(t, err)
	require.Equal(t, "updated", got.Note)
	require.Equal(t, "Prod Account", got.DisplayName)
}

func TestCodexMetadataService_UpdateAccountMetadataRejectsBlankAuthName(t *testing.T) {
	ctx := context.Background()
	repo := newFakeCodexMetadataRepository()
	svc := NewCodexMetadataService(repo)

	_, err := svc.UpdateAccountMetadata(ctx, UpdateCodexAccountMetadataRequest{
		AuthName: "   ",
	})

	require.ErrorIs(t, err, ErrCodexAccountMetadataEmpty)
	require.Equal(t, 0, repo.getAccountMetadataCalls)
	require.Equal(t, 0, repo.upsertAccountMetadataCalls)
}

func TestCodexMetadataService_CreateGroupRejectsBlankName(t *testing.T) {
	ctx := context.Background()
	repo := newFakeCodexMetadataRepository()
	svc := NewCodexMetadataService(repo)

	_, err := svc.CreateGroup(ctx, CreateCodexGroupRequest{
		Name: "   ",
	})

	require.ErrorIs(t, err, ErrCodexGroupNameEmpty)
	require.Empty(t, repo.groups)
}

func TestCodexMetadataService_CreateGroupNormalizesDefaults(t *testing.T) {
	ctx := context.Background()
	repo := newFakeCodexMetadataRepository()
	svc := NewCodexMetadataService(repo)

	got, err := svc.CreateGroup(ctx, CreateCodexGroupRequest{
		Name:      "  Production  ",
		Color:     "   ",
		SortOrder: codexIntPtr(4),
	})

	require.NoError(t, err)
	require.Equal(t, "Production", got.Name)
	require.Equal(t, "#d97757", got.Color)
	require.Equal(t, 4, got.SortOrder)
	require.Len(t, repo.groups, 1)
	require.Equal(t, got, repo.groups[0])
}

type fakeCodexMetadataRepository struct {
	groups                     []*CodexGroup
	metadata                   map[string]*CodexAccountMetadata
	getAccountMetadataCalls    int
	upsertAccountMetadataCalls int
}

func newFakeCodexMetadataRepository() *fakeCodexMetadataRepository {
	return &fakeCodexMetadataRepository{
		metadata: make(map[string]*CodexAccountMetadata),
	}
}

func (r *fakeCodexMetadataRepository) ListGroups(ctx context.Context) ([]CodexGroup, error) {
	groups := make([]CodexGroup, 0, len(r.groups))
	for _, group := range r.groups {
		groups = append(groups, *group)
	}
	return groups, nil
}

func (r *fakeCodexMetadataRepository) CreateGroup(ctx context.Context, group *CodexGroup) error {
	r.groups = append(r.groups, cloneCodexGroup(group))
	return nil
}

func (r *fakeCodexMetadataRepository) UpdateGroup(ctx context.Context, group *CodexGroup) error {
	for i, existing := range r.groups {
		if existing.ID == group.ID {
			r.groups[i] = cloneCodexGroup(group)
			return nil
		}
	}
	return ErrCodexGroupNotFound
}

func (r *fakeCodexMetadataRepository) DeleteGroup(ctx context.Context, id int64) error {
	r.groups = slices.DeleteFunc(r.groups, func(group *CodexGroup) bool {
		return group.ID == id
	})
	return nil
}

func (r *fakeCodexMetadataRepository) GetAccountMetadata(ctx context.Context, authName string) (*CodexAccountMetadata, error) {
	r.getAccountMetadataCalls++
	metadata := r.metadata[authName]
	if metadata == nil {
		return nil, nil
	}
	return cloneCodexAccountMetadata(metadata), nil
}

func (r *fakeCodexMetadataRepository) UpsertAccountMetadata(ctx context.Context, metadata *CodexAccountMetadata) error {
	r.upsertAccountMetadataCalls++
	r.metadata[metadata.AuthName] = cloneCodexAccountMetadata(metadata)
	return nil
}

func (r *fakeCodexMetadataRepository) ListAccountMetadata(ctx context.Context) ([]CodexAccountMetadata, error) {
	items := make([]CodexAccountMetadata, 0, len(r.metadata))
	for _, metadata := range r.metadata {
		items = append(items, *cloneCodexAccountMetadata(metadata))
	}
	return items, nil
}

func (r *fakeCodexMetadataRepository) DeleteAccountMetadata(ctx context.Context, authName string) error {
	delete(r.metadata, authName)
	return nil
}

func cloneCodexGroup(group *CodexGroup) *CodexGroup {
	if group == nil {
		return nil
	}
	clone := *group
	return &clone
}

func cloneCodexAccountMetadata(metadata *CodexAccountMetadata) *CodexAccountMetadata {
	if metadata == nil {
		return nil
	}
	clone := *metadata
	if metadata.GroupID != nil {
		groupID := *metadata.GroupID
		clone.GroupID = &groupID
	}
	clone.LocalTags = append([]string(nil), metadata.LocalTags...)
	if metadata.Settings != nil {
		clone.Settings = make(map[string]any, len(metadata.Settings))
		for key, value := range metadata.Settings {
			clone.Settings[key] = value
		}
	}
	return &clone
}

func codexStringPtr(v string) *string {
	return &v
}

func codexIntPtr(v int) *int {
	return &v
}

func codexInt64Ptr(v int64) *int64 {
	return &v
}
