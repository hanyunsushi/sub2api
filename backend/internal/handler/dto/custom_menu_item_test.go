package dto

import (
	"encoding/json"
	"testing"
)

func TestParseCustomMenuItems_OpenModeRoundTrip(t *testing.T) {
	items := ParseCustomMenuItems(`[{"id":"docs","label":"Docs","icon_svg":"","url":"https://example.com","visibility":"user","sort_order":0,"open_mode":"redirect"}]`)

	if len(items) != 1 {
		t.Fatalf("expected one custom menu item, got %d", len(items))
	}
	if items[0].OpenMode != "redirect" {
		t.Fatalf("expected redirect open mode, got %q", items[0].OpenMode)
	}
}

func TestParseCustomMenuItems_LegacyItemHasBlankOpenMode(t *testing.T) {
	items := ParseCustomMenuItems(`[{"id":"legacy","label":"Legacy","icon_svg":"","url":"https://example.com","visibility":"user","sort_order":0}]`)

	if len(items) != 1 {
		t.Fatalf("expected one custom menu item, got %d", len(items))
	}
	if items[0].OpenMode != "" {
		t.Fatalf("expected blank legacy open mode before frontend/default normalization, got %q", items[0].OpenMode)
	}
}

func TestCustomMenuItemVisibilityAndOpenButtonRoundTrip(t *testing.T) {
	raw := `[{"id":"docs","url":"https://example.com","visibility":"user","open_mode":"redirect","hide_open_button":true},{"id":"admin","visibility":"admin","hide_open_button":true}]`
	items := ParseUserVisibleMenuItems(raw)
	if len(items) != 1 || !items[0].HideOpenButton || items[0].OpenMode != "redirect" {
		t.Fatalf("user menu flags were not preserved: %+v", items)
	}
	encoded, err := json.Marshal(items)
	if err != nil {
		t.Fatal(err)
	}
	decoded := ParseCustomMenuItems(string(encoded))
	if len(decoded) != 1 || !decoded[0].HideOpenButton || decoded[0].OpenMode != "redirect" {
		t.Fatalf("menu flags did not round trip: %+v", decoded)
	}
}
