package admin

import (
	"github.com/Wei-Shaw/sub2api/internal/pkg/response"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
)

type PackyCodeSubscriptionHandler struct {
	service *service.PackyCodeSubscriptionService
}

func NewPackyCodeSubscriptionHandler(service *service.PackyCodeSubscriptionService) *PackyCodeSubscriptionHandler {
	return &PackyCodeSubscriptionHandler{service: service}
}

func (h *PackyCodeSubscriptionHandler) GetStatus(c *gin.Context) {
	status, err := h.service.GetStatus(c.Request.Context())
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, status)
}
