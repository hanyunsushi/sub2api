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
	forceRefresh := c.Query("refresh") == "1" || c.Query("force") == "1"
	statuses, err := h.service.GetStatuses(c.Request.Context(), service.ExternalSubscriptionStatusOptions{
		ForceRefresh: forceRefresh,
	})
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, statuses)
}

func (h *ExternalSubscriptionConfigHandler) GetDisplayStatusesSnapshot(c *gin.Context) {
	statuses, err := h.service.GetDisplayStatusesSnapshot(c.Request.Context())
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, statuses)
}

func (h *ExternalSubscriptionConfigHandler) GetAccountQuotaProgressSettings(c *gin.Context) {
	settings, err := h.service.GetAccountQuotaProgressSettings(c.Request.Context())
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, gin.H{"settings": settings})
}

func (h *ExternalSubscriptionConfigHandler) UpdateAccountQuotaProgressSettings(c *gin.Context) {
	var req struct {
		Settings map[string]service.ExternalSubscriptionAccountQuotaProgressPreference `json:"settings"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	if req.Settings == nil {
		req.Settings = map[string]service.ExternalSubscriptionAccountQuotaProgressPreference{}
	}
	settings, err := h.service.UpdateAccountQuotaProgressSettings(c.Request.Context(), req.Settings)
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, gin.H{"settings": settings})
}
