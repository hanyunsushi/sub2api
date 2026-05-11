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
	client := clientFromContext(ctx, r.client)
	groups, err := client.CodexGroup.Query().
		Order(codexgroup.BySortOrder(), codexgroup.ByName(), codexgroup.ByID()).
		All(ctx)
	if err != nil {
		return nil, err
	}
	return codexGroupEntitiesToService(groups), nil
}

func (r *codexMetadataRepository) CreateGroup(ctx context.Context, group *service.CodexGroup) error {
	client := clientFromContext(ctx, r.client)
	created, err := client.CodexGroup.Create().
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
	client := clientFromContext(ctx, r.client)
	updated, err := client.CodexGroup.UpdateOneID(group.ID).
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
	client := clientFromContext(ctx, r.client)
	if err := client.CodexGroup.DeleteOneID(id).Exec(ctx); err != nil {
		if dbent.IsNotFound(err) {
			return service.ErrCodexGroupNotFound
		}
		return err
	}
	return nil
}

func (r *codexMetadataRepository) GetAccountMetadata(ctx context.Context, authName string) (*service.CodexAccountMetadata, error) {
	client := clientFromContext(ctx, r.client)
	metadata, err := client.CodexAccountMetadata.Query().
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
	client := clientFromContext(ctx, r.client)
	localTags := metadata.LocalTags
	if localTags == nil {
		localTags = []string{}
	}
	settings := metadata.Settings
	if settings == nil {
		settings = map[string]any{}
	}

	upsert := client.CodexAccountMetadata.Create().
		SetAuthName(metadata.AuthName).
		SetNillableGroupID(metadata.GroupID).
		SetDisplayName(metadata.DisplayName).
		SetNote(metadata.Note).
		SetLocalTags(localTags).
		SetSettings(settings).
		SetSortOrder(metadata.SortOrder).
		OnConflictColumns(codexaccountmetadata.FieldAuthName).
		UpdateUpdatedAt().
		UpdateDisplayName().
		UpdateNote().
		UpdateLocalTags().
		UpdateSettings().
		UpdateSortOrder()
	if metadata.GroupID == nil {
		upsert.ClearGroupID()
	} else {
		upsert.UpdateGroupID()
	}

	id, err := upsert.ID(ctx)
	if err != nil {
		return translateCodexMetadataAccountWriteError(err)
	}

	updated, err := client.CodexAccountMetadata.Query().
		Where(codexaccountmetadata.IDEQ(id)).
		Only(ctx)
	if err != nil {
		return err
	}
	*metadata = codexAccountMetadataEntityToService(updated)
	return nil
}

func (r *codexMetadataRepository) ListAccountMetadata(ctx context.Context) ([]service.CodexAccountMetadata, error) {
	client := clientFromContext(ctx, r.client)
	rows, err := client.CodexAccountMetadata.Query().
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
	client := clientFromContext(ctx, r.client)
	_, err := client.CodexAccountMetadata.Delete().
		Where(codexaccountmetadata.AuthNameEQ(authName)).
		Exec(ctx)
	return err
}

func translateCodexMetadataAccountWriteError(err error) error {
	if isForeignKeyConstraintViolation(err) {
		return service.ErrCodexGroupNotFound.WithCause(err)
	}
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
