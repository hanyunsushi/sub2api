package routes

import (
	"os"
	"strings"
	"testing"
)

func TestAdminRoutesOnlyExposeUnifiedExternalSubscriptionEndpoints(t *testing.T) {
	source, err := os.ReadFile("admin.go")
	if err != nil {
		t.Fatalf("read admin routes source: %v", err)
	}
	text := string(source)

	if !strings.Contains(text, `registerExternalSubscriptionRoutes(admin, h)`) {
		t.Fatalf("expected unified external subscription route registration to remain")
	}
	if !strings.Contains(text, `admin.Group("/external-subscriptions")`) {
		t.Fatalf("expected unified /admin/external-subscriptions route group to remain")
	}

	for _, old := range []string{
		"registerBuzzBalanceRoutes",
		"registerTCDMXSubscriptionRoutes",
		"registerQLHazyCoderSubscriptionRoutes",
		"registerXHYAPISubscriptionRoutes",
		"registerPixelSubscriptionRoutes",
		"registerLiustSubscriptionRoutes",
		"registerPackyCodeSubscriptionRoutes",
		`admin.Group("/buzz")`,
		`admin.Group("/tcdmx")`,
		`admin.Group("/qlhazycoder")`,
		`admin.Group("/xhyapi")`,
		`admin.Group("/pixel")`,
		`admin.Group("/liust")`,
		`admin.Group("/packycode")`,
		".BuzzBalance.",
		".TCDMXSubscription.",
		".QLHazyCoderSubscription.",
		".XHYAPISubscription.",
		".PixelSubscription.",
		".LiustSubscription.",
		".PackyCodeSubscription.",
	} {
		if strings.Contains(text, old) {
			t.Fatalf("legacy provider-specific external subscription route surface still present: %s", old)
		}
	}
}
