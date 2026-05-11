package repository

import (
	"context"

	dbent "github.com/Wei-Shaw/sub2api/ent"
	"github.com/Wei-Shaw/sub2api/ent/codexaccountmetadata"
	"github.com/Wei-Shaw/sub2api/ent/codexgroup"
	"github.com/Wei-Shaw/sub2api/internal/service"
)

type codexMetadataRepository struct {
	client *dbent.Client
}

func NewCodexMetadataRepository(client *dbent.Client) service.CodexMetadataRepository {
	return &codexMetadataRepository{client: client}
}

func (r *codexMetadataRepository) ListGroups(ctx context.Context) ([]service.CodexGroup, error) {
	groups, err := r.client.CodexGroup.Query().
		Order(codexgroup.BySortOrder(), codexgroup.ByName(), codexgroup.ByID()).
		All(ctx)
	if err != nil {
		return nil, err
	}
	return codexGroupEntitiesToService(groups), nil
}

func (r *codexMetadataRepository) CreateGroup(ctx context.Context, group *service.CodexGroup) error {
	created, err := r.client.CodexGroup.Create().
		SetName(group.Name).
		SetColor(group.Color).
		SetSortOrder(group.SortOrder).
		Save(ctx)
	if err != nil {
		if dbent.IsConstraintError(err) {
			return service.ErrCodexGroupExists
		}
		return err
	}
	*group = codexGroupEntityToService(created)
	return nil
}

func (r *codexMetadataRepository) UpdateGroup(ctx context.Context, group *service.CodexGroup) error {
	updated, err := r.client.CodexGroup.UpdateOneID(group.ID).
		SetName(group.Name).
		SetColor(group.Color).
		SetSortOrder(group.SortOrder).
		Save(ctx)
	if err != nil {
		if dbent.IsNotFound(err) {
			return service.ErrCodexGroupNotFound
		}
		if dbent.IsConstraintError(err) {
			return service.ErrCodexGroupExists
		}
		return err
	}
	*group = codexGroupEntityToService(updated)
	return nil
}

func (r *codexMetadataRepository) DeleteGroup(ctx context.Context, id int64) error {
	if err := r.client.CodexGroup.DeleteOneID(id).Exec(ctx); err != nil {
		if dbent.IsNotFound(err) {
			return service.ErrCodexGroupNotFound
		}
		return err
	}
	return nil
}

func (r *codexMetadataRepository) GetAccountMetadata(ctx context.Context, authName string) (*service.CodexAccountMetadata, error) {
	metadata, err := r.client.CodexAccountMetadata.Query().
		Where(codexaccountmetadata.AuthNameEQ(authName)).
		Only(ctx)
	if err != nil {
		if dbent.IsNotFound(err) {
			return nil, nil
		}
		return nil, err
	}
	out := codexAccountMetadataEntityToService(metadata)
	return &out, nil
}

func (r *codexMetadataRepository) UpsertAccountMetadata(ctx context.Context, metadata *service.CodexAccountMetadata) error {
	existing, err := r.client.CodexAccountMetadata.Query().
		Where(codexaccountmetadata.AuthNameEQ(metadata.AuthName)).
		Only(ctx)
	if err != nil && !dbent.IsNotFound(err) {
		return err
	}

	localTags := metadata.LocalTags
	if localTags == nil {
		localTags = []string{}
	}
	settings := metadata.Settings
	if settings == nil {
		settings = map[string]any{}
	}

	if dbent.IsNotFound(err) {
		created, createErr := r.client.CodexAccountMetadata.Create().
			SetAuthName(metadata.AuthName).
			SetNillableGroupID(metadata.GroupID).
			SetDisplayName(metadata.DisplayName).
			SetNote(metadata.Note).
			SetLocalTags(localTags).
			SetSettings(settings).
			SetSortOrder(metadata.SortOrder).
			Save(ctx)
		if createErr != nil {
			return createErr
		}
		*metadata = codexAccountMetadataEntityToService(created)
		return nil
	}

	update := r.client.CodexAccountMetadata.UpdateOneID(existing.ID).
		SetDisplayName(metadata.DisplayName).
		SetNote(metadata.Note).
		SetLocalTags(localTags).
		SetSettings(settings).
		SetSortOrder(metadata.SortOrder)
	if metadata.GroupID == nil {
		update.ClearGroupID()
	} else {
		update.SetGroupID(*metadata.GroupID)
	}

	updated, err := update.Save(ctx)
	if err != nil {
		return err
	}
	*metadata = codexAccountMetadataEntityToService(updated)
	return nil
}

func (r *codexMetadataRepository) ListAccountMetadata(ctx context.Context) ([]service.CodexAccountMetadata, error) {
	rows, err := r.client.CodexAccountMetadata.Query().
		Order(codexaccountmetadata.BySortOrder(), codexaccountmetadata.ByAuthName(), codexaccountmetadata.ByID()).
		All(ctx)
	if err != nil {
		return nil, err
	}

	out := make([]service.CodexAccountMetadata, 0, len(rows))
	for _, row := range rows {
		out = append(out, codexAccountMetadataEntityToService(row))
	}
	return out, nil
}

func (r *codexMetadataRepository) DeleteAccountMetadata(ctx context.Context, authName string) error {
	_, err := r.client.CodexAccountMetadata.Delete().
		Where(codexaccountmetadata.AuthNameEQ(authName)).
		Exec(ctx)
	return err
}

func codexGroupEntityToService(group *dbent.CodexGroup) service.CodexGroup {
	return service.CodexGroup{
		ID:        group.ID,
		Name:      group.Name,
		Color:     group.Color,
		SortOrder: group.SortOrder,
		CreatedAt: group.CreatedAt,
		UpdatedAt: group.UpdatedAt,
	}
}

func codexGroupEntitiesToService(groups []*dbent.CodexGroup) []service.CodexGroup {
	out := make([]service.CodexGroup, 0, len(groups))
	for _, group := range groups {
		out = append(out, codexGroupEntityToService(group))
	}
	return out
}

func codexAccountMetadataEntityToService(metadata *dbent.CodexAccountMetadata) service.CodexAccountMetadata {
	localTags := metadata.LocalTags
	if localTags == nil {
		localTags = []string{}
	}
	settings := metadata.Settings
	if settings == nil {
		settings = map[string]any{}
	}
	return service.CodexAccountMetadata{
		ID:          metadata.ID,
		AuthName:    metadata.AuthName,
		GroupID:     metadata.GroupID,
		DisplayName: metadata.DisplayName,
		Note:        metadata.Note,
		LocalTags:   localTags,
		Settings:    settings,
		SortOrder:   metadata.SortOrder,
		CreatedAt:   metadata.CreatedAt,
		UpdatedAt:   metadata.UpdatedAt,
	}
}
