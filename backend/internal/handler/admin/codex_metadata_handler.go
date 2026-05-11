package admin

import (
	"net/url"
	"strconv"

	"github.com/Wei-Shaw/sub2api/internal/pkg/response"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
)

type CodexMetadataHandler struct {
	service *service.CodexMetadataService
}

func NewCodexMetadataHandler(service *service.CodexMetadataService) *CodexMetadataHandler {
	return &CodexMetadataHandler{service: service}
}

func (h *CodexMetadataHandler) ListGroups(c *gin.Context) {
	groups, err := h.service.ListGroups(c.Request.Context())
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, groups)
}

func (h *CodexMetadataHandler) CreateGroup(c *gin.Context) {
	var req service.CreateCodexGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	group, err := h.service.CreateGroup(c.Request.Context(), req)
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, group)
}

func (h *CodexMetadataHandler) UpdateGroup(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid group ID")
		return
	}

	var req service.CreateCodexGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	group, err := h.service.UpdateGroup(c.Request.Context(), id, req)
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, group)
}

func (h *CodexMetadataHandler) DeleteGroup(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid group ID")
		return
	}

	if err := h.service.DeleteGroup(c.Request.Context(), id); err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, gin.H{"message": "Codex group deleted successfully"})
}

func (h *CodexMetadataHandler) ListAccountMetadata(c *gin.Context) {
	items, err := h.service.ListAccountMetadata(c.Request.Context())
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, items)
}

func (h *CodexMetadataHandler) UpdateAccountMetadata(c *gin.Context) {
	authName, err := url.PathUnescape(c.Param("auth_name"))
	if err != nil {
		response.BadRequest(c, "Invalid auth name")
		return
	}

	var req service.UpdateCodexAccountMetadataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}
	req.AuthName = authName

	metadata, err := h.service.UpdateAccountMetadata(c.Request.Context(), req)
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, metadata)
}

func (h *CodexMetadataHandler) DeleteAccountMetadata(c *gin.Context) {
	authName, err := url.PathUnescape(c.Param("auth_name"))
	if err != nil {
		response.BadRequest(c, "Invalid auth name")
		return
	}

	if err := h.service.DeleteAccountMetadata(c.Request.Context(), authName); err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, gin.H{"message": "Codex account metadata deleted successfully"})
}
