package admin

import (
	"github.com/Wei-Shaw/sub2api/internal/pkg/response"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
)

type TCDMXSubscriptionHandler struct {
	service *service.TCDMXSubscriptionService
}

func NewTCDMXSubscriptionHandler(service *service.TCDMXSubscriptionService) *TCDMXSubscriptionHandler {
	return &TCDMXSubscriptionHandler{service: service}
}

func (h *TCDMXSubscriptionHandler) GetStatus(c *gin.Context) {
	status, err := h.service.GetStatus(c.Request.Context())
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, status)
}
