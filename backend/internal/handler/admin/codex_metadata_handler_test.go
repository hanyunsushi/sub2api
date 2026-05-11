package admin

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func newCodexMetadataHandlerTestRouter() (*gin.Engine, *service.CodexMetadataService) {
	gin.SetMode(gin.TestMode)
	repo := newCodexMetadataHandlerRepo()
	svc := service.NewCodexMetadataService(repo)
	handler := NewCodexMetadataHandler(svc)

	r := gin.New()
	codex := r.Group("/api/v1/admin/codex")
	{
		codex.GET("/groups", handler.ListGroups)
		codex.POST("/groups", handler.CreateGroup)
		codex.PUT("/groups/:id", handler.UpdateGroup)
		codex.DELETE("/groups/:id", handler.DeleteGroup)
		codex.GET("/accounts/metadata", handler.ListAccountMetadata)
		codex.PUT("/accounts/:auth_name/metadata", handler.UpdateAccountMetadata)
		codex.DELETE("/accounts/:auth_name/metadata", handler.DeleteAccountMetadata)
	}
	return r, svc
}

func TestCodexMetadataHandler_GroupEndpoints(t *testing.T) {
	r, _ := newCodexMetadataHandlerTestRouter()

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/codex/groups", bytes.NewBufferString(`{"name":" Prod ","color":" #d97757 ","sort_order":2}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)

	var created responseEnvelope
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &created))
	require.Equal(t, 0, created.Code)
	require.Contains(t, string(created.Data), `"name":"Prod"`)

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/api/v1/admin/codex/groups", nil)
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)
	require.Contains(t, w.Body.String(), `"Prod"`)

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPut, "/api/v1/admin/codex/groups/1", bytes.NewBufferString(`{"name":" Updated ","sort_order":5}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)
	require.Contains(t, w.Body.String(), `"Updated"`)

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodDelete, "/api/v1/admin/codex/groups/1", nil)
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)
}

func TestCodexMetadataHandler_InvalidGroupID(t *testing.T) {
	r, _ := newCodexMetadataHandlerTestRouter()

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPut, "/api/v1/admin/codex/groups/bad", bytes.NewBufferString(`{"name":"Updated"}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	require.Equal(t, http.StatusBadRequest, w.Code)
}

func TestCodexMetadataHandler_AccountMetadataEndpoints(t *testing.T) {
	r, _ := newCodexMetadataHandlerTestRouter()

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPut, "/api/v1/admin/codex/accounts/account1.json/metadata", bytes.NewBufferString(`{
		"auth_name":"ignored.json",
		"display_name":" Prod Account ",
		"note":" main ",
		"local_tags":[" prod ",""],
		"settings":{"proxy_template":"home"},
		"sort_order":3
	}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)
	require.Contains(t, w.Body.String(), `"auth_name":"account1.json"`)
	require.Contains(t, w.Body.String(), `"display_name":"Prod Account"`)

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/api/v1/admin/codex/accounts/metadata", nil)
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)
	require.Contains(t, w.Body.String(), `"auth_name":"account1.json"`)

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodDelete, "/api/v1/admin/codex/accounts/account1.json/metadata", nil)
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)
}

func TestCodexMetadataHandler_InvalidJSON(t *testing.T) {
	r, _ := newCodexMetadataHandlerTestRouter()

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/codex/groups", bytes.NewBufferString(`{bad-json`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	require.Equal(t, http.StatusBadRequest, w.Code)
}

type codexMetadataHandlerRepo struct {
	nextGroupID int64
	groups      map[int64]*service.CodexGroup
	metadata    map[string]*service.CodexAccountMetadata
}

func newCodexMetadataHandlerRepo() *codexMetadataHandlerRepo {
	return &codexMetadataHandlerRepo{
		nextGroupID: 1,
		groups:      make(map[int64]*service.CodexGroup),
		metadata:    make(map[string]*service.CodexAccountMetadata),
	}
}

func (r *codexMetadataHandlerRepo) ListGroups(ctx context.Context) ([]service.CodexGroup, error) {
	groups := make([]service.CodexGroup, 0, len(r.groups))
	for _, group := range r.groups {
		groups = append(groups, *cloneHandlerCodexGroup(group))
	}
	return groups, nil
}

func (r *codexMetadataHandlerRepo) CreateGroup(ctx context.Context, group *service.CodexGroup) error {
	group.ID = r.nextGroupID
	r.nextGroupID++
	r.groups[group.ID] = cloneHandlerCodexGroup(group)
	return nil
}

func (r *codexMetadataHandlerRepo) UpdateGroup(ctx context.Context, group *service.CodexGroup) error {
	if _, ok := r.groups[group.ID]; !ok {
		return service.ErrCodexGroupNotFound
	}
	r.groups[group.ID] = cloneHandlerCodexGroup(group)
	return nil
}

func (r *codexMetadataHandlerRepo) DeleteGroup(ctx context.Context, id int64) error {
	delete(r.groups, id)
	return nil
}

func (r *codexMetadataHandlerRepo) GetAccountMetadata(ctx context.Context, authName string) (*service.CodexAccountMetadata, error) {
	metadata := r.metadata[authName]
	if metadata == nil {
		return nil, nil
	}
	return cloneHandlerCodexAccountMetadata(metadata), nil
}

func (r *codexMetadataHandlerRepo) UpsertAccountMetadata(ctx context.Context, metadata *service.CodexAccountMetadata) error {
	r.metadata[metadata.AuthName] = cloneHandlerCodexAccountMetadata(metadata)
	return nil
}

func (r *codexMetadataHandlerRepo) ListAccountMetadata(ctx context.Context) ([]service.CodexAccountMetadata, error) {
	items := make([]service.CodexAccountMetadata, 0, len(r.metadata))
	for _, metadata := range r.metadata {
		items = append(items, *cloneHandlerCodexAccountMetadata(metadata))
	}
	return items, nil
}

func (r *codexMetadataHandlerRepo) DeleteAccountMetadata(ctx context.Context, authName string) error {
	delete(r.metadata, authName)
	return nil
}

func cloneHandlerCodexGroup(group *service.CodexGroup) *service.CodexGroup {
	if group == nil {
		return nil
	}
	clone := *group
	return &clone
}

func cloneHandlerCodexAccountMetadata(metadata *service.CodexAccountMetadata) *service.CodexAccountMetadata {
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
