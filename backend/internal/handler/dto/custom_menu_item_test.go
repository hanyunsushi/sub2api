package dto

import "testing"

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
