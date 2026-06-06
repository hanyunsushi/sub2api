package admin

import (
	"github.com/Wei-Shaw/sub2api/internal/pkg/response"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
)

type LiustSubscriptionHandler struct {
	service *service.LiustSubscriptionService
}

func NewLiustSubscriptionHandler(service *service.LiustSubscriptionService) *LiustSubscriptionHandler {
	return &LiustSubscriptionHandler{service: service}
}

func (h *LiustSubscriptionHandler) GetStatus(c *gin.Context) {
	status, err := h.service.GetStatus(c.Request.Context())
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, status)
}
