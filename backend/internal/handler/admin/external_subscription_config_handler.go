package admin

import (
	"github.com/Wei-Shaw/sub2api/internal/pkg/response"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
)

type ExternalSubscriptionConfigHandler struct {
	service *service.ExternalSubscriptionConfigService
}

func NewExternalSubscriptionConfigHandler(service *service.ExternalSubscriptionConfigService) *ExternalSubscriptionConfigHandler {
	return &ExternalSubscriptionConfigHandler{service: service}
}

func (h *ExternalSubscriptionConfigHandler) ListProviders(c *gin.Context) {
	providers, err := h.service.ListProviders(c.Request.Context())
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, providers)
}

func (h *ExternalSubscriptionConfigHandler) CreateProvider(c *gin.Context) {
	var req service.ExternalSubscriptionProviderInput
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	provider, err := h.service.CreateProvider(c.Request.Context(), req)
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Created(c, provider)
}

func (h *ExternalSubscriptionConfigHandler) UpdateProvider(c *gin.Context) {
	var req service.ExternalSubscriptionProviderInput
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	provider, err := h.service.UpdateProvider(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, provider)
}

func (h *ExternalSubscriptionConfigHandler) DeleteProvider(c *gin.Context) {
	if err := h.service.DeleteProvider(c.Request.Context(), c.Param("id")); err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, gin.H{"deleted": true})
}

func (h *ExternalSubscriptionConfigHandler) GetStatuses(c *gin.Context) {
	statuses, err := h.service.GetStatuses(c.Request.Context())
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, statuses)
}
