package dto

import (
	"encoding/json"
	"testing"
)

func TestCustomMenuItemVisibilityAndOpenButtonRoundTrip(t *testing.T) {
	raw := `[{"id":"docs","url":"https://example.com","visibility":"user","hide_open_button":true},{"id":"admin","visibility":"admin","hide_open_button":true}]`
	items := ParseUserVisibleMenuItems(raw)
	if len(items) != 1 || !items[0].HideOpenButton {
		t.Fatalf("user menu flags were not preserved: %+v", items)
	}
	encoded, err := json.Marshal(items)
	if err != nil {
		t.Fatal(err)
	}
	decoded := ParseCustomMenuItems(string(encoded))
	if len(decoded) != 1 || !decoded[0].HideOpenButton {
		t.Fatalf("menu flags did not round trip: %+v", decoded)
	}
}
