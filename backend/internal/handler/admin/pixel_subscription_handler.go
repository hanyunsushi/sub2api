package admin

import (
	"github.com/Wei-Shaw/sub2api/internal/pkg/response"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
)

type PixelSubscriptionHandler struct {
	service *service.PixelSubscriptionService
}

func NewPixelSubscriptionHandler(service *service.PixelSubscriptionService) *PixelSubscriptionHandler {
	return &PixelSubscriptionHandler{service: service}
}

func (h *PixelSubscriptionHandler) GetStatus(c *gin.Context) {
	status, err := h.service.GetStatus(c.Request.Context())
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, status)
}
