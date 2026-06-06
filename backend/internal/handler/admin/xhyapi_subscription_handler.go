package admin

import (
	"github.com/Wei-Shaw/sub2api/internal/pkg/response"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
)

type XHYAPISubscriptionHandler struct {
	service *service.XHYAPISubscriptionService
}

func NewXHYAPISubscriptionHandler(service *service.XHYAPISubscriptionService) *XHYAPISubscriptionHandler {
	return &XHYAPISubscriptionHandler{service: service}
}

func (h *XHYAPISubscriptionHandler) GetStatus(c *gin.Context) {
	status, err := h.service.GetStatus(c.Request.Context())
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, status)
}
