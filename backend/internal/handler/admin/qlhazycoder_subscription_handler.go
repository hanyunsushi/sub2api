package admin

import (
	"github.com/Wei-Shaw/sub2api/internal/pkg/response"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
)

type QLHazyCoderSubscriptionHandler struct {
	service *service.QLHazyCoderSubscriptionService
}

func NewQLHazyCoderSubscriptionHandler(service *service.QLHazyCoderSubscriptionService) *QLHazyCoderSubscriptionHandler {
	return &QLHazyCoderSubscriptionHandler{service: service}
}

func (h *QLHazyCoderSubscriptionHandler) GetStatus(c *gin.Context) {
	status, err := h.service.GetStatus(c.Request.Context())
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, status)
}
