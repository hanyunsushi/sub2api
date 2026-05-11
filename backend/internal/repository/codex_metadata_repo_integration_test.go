//go:build integration

package repository

import (
	"context"
	"testing"

	dbent "github.com/Wei-Shaw/sub2api/ent"
	"github.com/Wei-Shaw/sub2api/ent/codexaccountmetadata"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/stretchr/testify/suite"
)

type CodexMetadataRepositorySuite struct {
	suite.Suite
	ctx    context.Context
	client *dbent.Client
	repo   service.CodexMetadataRepository
}

func (s *CodexMetadataRepositorySuite) SetupTest() {
	s.ctx = context.Background()
	tx := testEntTx(s.T())
	s.client = tx.Client()
	s.repo = NewCodexMetadataRepository(s.client)
}

func TestCodexMetadataRepository(t *testing.T) {
	suite.Run(t, new(CodexMetadataRepositorySuite))
}

func (s *CodexMetadataRepositorySuite) TestCreateGroupAndListGroupsOrdered() {
	gamma := &service.CodexGroup{Name: "Gamma", Color: "#333333", SortOrder: 20}
	alpha := &service.CodexGroup{Name: "Alpha", Color: "#111111", SortOrder: 10}
	beta := &service.CodexGroup{Name: "Beta", Color: "#222222", SortOrder: 10}

	s.Require().NoError(s.repo.CreateGroup(s.ctx, gamma))
	s.Require().NoError(s.repo.CreateGroup(s.ctx, alpha))
	s.Require().NoError(s.repo.CreateGroup(s.ctx, beta))
	s.Require().NotZero(alpha.ID)
	s.Require().NotZero(alpha.CreatedAt)
	s.Require().NotZero(alpha.UpdatedAt)

	groups, err := s.repo.ListGroups(s.ctx)
	s.Require().NoError(err)
	s.Require().Len(groups, 3)
	s.Require().Equal([]string{"Alpha", "Beta", "Gamma"}, []string{
		groups[0].Name,
		groups[1].Name,
		groups[2].Name,
	})
	s.Require().Equal([]int{10, 10, 20}, []int{
		groups[0].SortOrder,
		groups[1].SortOrder,
		groups[2].SortOrder,
	})
}

func (s *CodexMetadataRepositorySuite) TestUpsertAccountMetadataCreatesThenUpdatesSingleRow() {
	group := &service.CodexGroup{Name: "Prod", Color: "#d97757", SortOrder: 0}
	s.Require().NoError(s.repo.CreateGroup(s.ctx, group))

	first := &service.CodexAccountMetadata{
		AuthName:    "account1.json",
		GroupID:     &group.ID,
		DisplayName: "Account One",
		Note:        "first",
		LocalTags:   []string{"prod", "critical"},
		Settings:    map[string]any{"proxy_template": "home"},
		SortOrder:   5,
	}
	s.Require().NoError(s.repo.UpsertAccountMetadata(s.ctx, first))
	s.Require().NotZero(first.ID)
	s.Require().NotZero(first.CreatedAt)
	s.Require().NotZero(first.UpdatedAt)

	second := &service.CodexAccountMetadata{
		AuthName:    "account1.json",
		GroupID:     &group.ID,
		DisplayName: "Account One Updated",
		Note:        "second",
		LocalTags:   []string{"prod"},
		Settings:    map[string]any{"proxy_template": "office"},
		SortOrder:   7,
	}
	s.Require().NoError(s.repo.UpsertAccountMetadata(s.ctx, second))
	s.Require().Equal(first.ID, second.ID)

	rows, err := s.client.CodexAccountMetadata.Query().
		Where(codexaccountmetadata.AuthNameEQ("account1.json")).
		All(s.ctx)
	s.Require().NoError(err)
	s.Require().Len(rows, 1)

	got, err := s.repo.GetAccountMetadata(s.ctx, "account1.json")
	s.Require().NoError(err)
	s.Require().NotNil(got)
	s.Require().Equal(first.ID, got.ID)
	s.Require().Equal("Account One Updated", got.DisplayName)
	s.Require().Equal("second", got.Note)
	s.Require().Equal([]string{"prod"}, got.LocalTags)
	s.Require().Equal("office", got.Settings["proxy_template"])
	s.Require().Equal(7, got.SortOrder)
}

func (s *CodexMetadataRepositorySuite) TestUpsertAccountMetadataClearsGroupID() {
	group := &service.CodexGroup{Name: "Prod", Color: "#d97757", SortOrder: 0}
	s.Require().NoError(s.repo.CreateGroup(s.ctx, group))

	metadata := &service.CodexAccountMetadata{
		AuthName:  "account-clear.json",
		GroupID:   &group.ID,
		LocalTags: []string{},
		Settings:  map[string]any{},
	}
	s.Require().NoError(s.repo.UpsertAccountMetadata(s.ctx, metadata))

	metadata.GroupID = nil
	s.Require().NoError(s.repo.UpsertAccountMetadata(s.ctx, metadata))

	got, err := s.repo.GetAccountMetadata(s.ctx, "account-clear.json")
	s.Require().NoError(err)
	s.Require().NotNil(got)
	s.Require().Nil(got.GroupID)
}

func (s *CodexMetadataRepositorySuite) TestDeleteGroupSetsAccountMetadataGroupIDNull() {
	group := &service.CodexGroup{Name: "Delete Me", Color: "#d97757", SortOrder: 0}
	s.Require().NoError(s.repo.CreateGroup(s.ctx, group))

	metadata := &service.CodexAccountMetadata{
		AuthName:  "account-delete-group.json",
		GroupID:   &group.ID,
		LocalTags: []string{},
		Settings:  map[string]any{},
	}
	s.Require().NoError(s.repo.UpsertAccountMetadata(s.ctx, metadata))

	s.Require().NoError(s.repo.DeleteGroup(s.ctx, group.ID))

	got, err := s.repo.GetAccountMetadata(s.ctx, "account-delete-group.json")
	s.Require().NoError(err)
	s.Require().NotNil(got)
	s.Require().Nil(got.GroupID)
}
