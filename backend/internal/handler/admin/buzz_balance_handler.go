package admin

import (
	"github.com/Wei-Shaw/sub2api/internal/pkg/response"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
)

type BuzzBalanceHandler struct {
	service *service.BuzzBalanceService
}

func NewBuzzBalanceHandler(service *service.BuzzBalanceService) *BuzzBalanceHandler {
	return &BuzzBalanceHandler{service: service}
}

func (h *BuzzBalanceHandler) GetBalance(c *gin.Context) {
	balance, err := h.service.GetBalance(c.Request.Context())
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, balance)
}
