package service

import (
	"context"
	"strings"
	"time"

	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
)

const defaultCodexGroupColor = "#d97757"

var (
	ErrCodexGroupNotFound        = infraerrors.NotFound("CODEX_GROUP_NOT_FOUND", "codex group not found")
	ErrCodexGroupExists          = infraerrors.Conflict("CODEX_GROUP_EXISTS", "codex group name already exists")
	ErrCodexAccountMetadataEmpty = infraerrors.BadRequest("CODEX_ACCOUNT_METADATA_EMPTY", "auth name is required")
	ErrCodexGroupNameEmpty       = infraerrors.BadRequest("CODEX_GROUP_NAME_EMPTY", "group name is required")
)

type CodexGroup struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	SortOrder int       `json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CodexAccountMetadata struct {
	ID          int64          `json:"id"`
	AuthName    string         `json:"auth_name"`
	GroupID     *int64         `json:"group_id,omitempty"`
	DisplayName string         `json:"display_name"`
	Note        string         `json:"note"`
	LocalTags   []string       `json:"local_tags"`
	Settings    map[string]any `json:"settings"`
	SortOrder   int            `json:"sort_order"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

type CodexMetadataRepository interface {
	ListGroups(ctx context.Context) ([]CodexGroup, error)
	CreateGroup(ctx context.Context, group *CodexGroup) error
	UpdateGroup(ctx context.Context, group *CodexGroup) error
	DeleteGroup(ctx context.Context, id int64) error
	GetAccountMetadata(ctx context.Context, authName string) (*CodexAccountMetadata, error)
	UpsertAccountMetadata(ctx context.Context, metadata *CodexAccountMetadata) error
	ListAccountMetadata(ctx context.Context) ([]CodexAccountMetadata, error)
	DeleteAccountMetadata(ctx context.Context, authName string) error
}

type CodexMetadataService struct {
	repo CodexMetadataRepository
}

type CreateCodexGroupRequest struct {
	Name      string `json:"name"`
	Color     string `json:"color"`
	SortOrder *int   `json:"sort_order"`
}

type UpdateCodexAccountMetadataRequest struct {
	AuthName    string         `json:"auth_name"`
	GroupID     *int64         `json:"group_id"`
	DisplayName *string        `json:"display_name"`
	Note        *string        `json:"note"`
	LocalTags   []string       `json:"local_tags"`
	Settings    map[string]any `json:"settings"`
	SortOrder   *int           `json:"sort_order"`
}

func NewCodexMetadataService(repo CodexMetadataRepository) *CodexMetadataService {
	return &CodexMetadataService{repo: repo}
}

func (s *CodexMetadataService) CreateGroup(ctx context.Context, req CreateCodexGroupRequest) (*CodexGroup, error) {
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return nil, ErrCodexGroupNameEmpty
	}

	color := strings.TrimSpace(req.Color)
	if color == "" {
		color = defaultCodexGroupColor
	}

	group := &CodexGroup{
		Name:  name,
		Color: color,
	}
	if req.SortOrder != nil {
		group.SortOrder = *req.SortOrder
	}

	if err := s.repo.CreateGroup(ctx, group); err != nil {
		return nil, err
	}
	return group, nil
}

func (s *CodexMetadataService) UpdateAccountMetadata(ctx context.Context, req UpdateCodexAccountMetadataRequest) (*CodexAccountMetadata, error) {
	authName := strings.TrimSpace(req.AuthName)
	if authName == "" {
		return nil, ErrCodexAccountMetadataEmpty
	}

	metadata, err := s.repo.GetAccountMetadata(ctx, authName)
	if err != nil {
		return nil, err
	}
	if metadata == nil {
		metadata = &CodexAccountMetadata{
			AuthName:  authName,
			LocalTags: []string{},
			Settings:  map[string]any{},
		}
	}

	metadata.AuthName = authName
	if req.GroupID != nil {
		metadata.GroupID = req.GroupID
	}
	if req.DisplayName != nil {
		metadata.DisplayName = strings.TrimSpace(*req.DisplayName)
	}
	if req.Note != nil {
		metadata.Note = strings.TrimSpace(*req.Note)
	}
	if req.LocalTags != nil {
		metadata.LocalTags = normalizeCodexLocalTags(req.LocalTags)
	}
	if metadata.LocalTags == nil {
		metadata.LocalTags = []string{}
	}
	if req.Settings != nil {
		metadata.Settings = req.Settings
	}
	if metadata.Settings == nil {
		metadata.Settings = map[string]any{}
	}
	if req.SortOrder != nil {
		metadata.SortOrder = *req.SortOrder
	}

	if err := s.repo.UpsertAccountMetadata(ctx, metadata); err != nil {
		return nil, err
	}
	return metadata, nil
}

func normalizeCodexLocalTags(tags []string) []string {
	normalized := make([]string, 0, len(tags))
	for _, tag := range tags {
		tag = strings.TrimSpace(tag)
		if tag != "" {
			normalized = append(normalized, tag)
		}
	}
	return normalized
}
