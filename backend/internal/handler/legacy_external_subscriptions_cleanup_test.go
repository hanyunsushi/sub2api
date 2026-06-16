package handler

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestAdminHandlersDoNotWireLegacyExternalSubscriptionHandlers(t *testing.T) {
	paths := []string{
		"handler.go",
		"wire.go",
		filepath.Join("..", "..", "cmd", "server", "wire_gen.go"),
	}

	for _, path := range paths {
		source, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("read %s: %v", path, err)
		}
		text := string(source)
		if !strings.Contains(text, "ExternalSubscription") {
			t.Fatalf("expected unified external subscription handler to remain in %s", path)
		}
		for _, old := range []string{
			"buzzBalanceHandler",
			"tcdmxSubscriptionHandler",
			"qlHazyCoderSubscriptionHandler",
			"xhyapiSubscriptionHandler",
			"pixelSubscriptionHandler",
			"liustSubscriptionHandler",
			"packyCodeSubscriptionHandler",
			"buzzBalanceService",
			"tcdmxSubscriptionService",
			"qlHazyCoderSubscriptionService",
			"xhyapiSubscriptionService",
			"pixelSubscriptionService",
			"liustSubscriptionService",
			"packyCodeSubscriptionService",
		} {
			if strings.Contains(text, old) {
				t.Fatalf("legacy provider-specific external subscription wiring still present in %s: %s", path, old)
			}
		}
	}
}
