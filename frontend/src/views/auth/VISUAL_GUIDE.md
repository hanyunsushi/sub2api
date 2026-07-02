# Authentication Views Visual Guide

This guide is the implementation contract for login, registration, callback, and setup-style authentication screens. It follows the local Claude / Anthropic design-system package, not the old default SaaS theme.

## Layout Contract

Authentication screens use `AuthLayout` with a calm centered form. The page surface is the Anthropic paper ladder:

- Page background: `#faf9f5`.
- Auth panel: `#f0eee6` or inherited paper surface.
- Raised fields and inline blocks: `#e8e6dc` only when hierarchy needs it.
- Border: warm hairline such as `#d1cfc5` or a low-opacity foreground hairline.
- Shadow: none for ordinary cards; floating overlays may use only `0 4px 24px rgba(0, 0, 0, 0.05)`.

Do not use gradient hero backgrounds, neon glow, blue brand fills, white card stacks, or thick shadows for authentication pages.

## Visual Structure

```
┌─────────────────────────────────────────────┐
│                                             │
│        Sub2API brand mark / product name    │
│        calm supporting sentence             │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ warm paper form panel                │   │
│  │ labels / fields / inline state       │   │
│  │ Slate primary action                 │   │
│  └─────────────────────────────────────┘   │
│                                             │
│        footer text link with underline      │
│                                             │
└─────────────────────────────────────────────┘
```

The form should feel like a quiet paper workbench. Preserve clear labels, direct error messages, and 44px minimum touch targets.

## Color Tokens

- Foreground and primary action: `#141413`.
- Primary hover: `#3d3d3a`.
- Muted text: `#5e5d59`.
- Quiet metadata: `#87867f`.
- Focus ring: `#2c84db`, only for keyboard `:focus-visible` and switch active states.
- Clay accent: `#d97757`, only for a small status dot or rare high-signal accent.
- Success: `#6ea100` with a low-saturation pale surface.
- Warning: `#d1a24a` with a warm pale surface.
- Error: `#bf4d43` with `#fff1f0` or `#ebcece` support surfaces.

Do not treat focus blue as the brand color. Do not use colored mouse-open borders on select, menu, or password visibility controls.

## Typography

- Body: `Anthropic Sans`, then native system sans fallbacks.
- Display / product copy: `Anthropic Serif` for Latin, with native Chinese serif fallback only when the screen uses editorial copy.
- Mono: `Anthropic Mono` for codes, token snippets, dates, and numeric identifiers.
- Form labels: 12-14px, medium weight, no excessive uppercase.
- Headings: sentence case, direct wording, no marketing filler.

## Inputs

Inputs use warm paper or transparent surfaces. The default state is low chrome:

```css
border: 1px solid var(--anthropic-border-subtle);
background: var(--anthropic-page);
color: var(--anthropic-fg);
box-shadow: none;
```

Keyboard focus uses:

```css
outline: 2px solid #2c84db;
outline-offset: 2px;
```

Mouse hover and open states should not become blue. Validation errors use error semantics, not a second brand color.

## Buttons and Links

Primary submit buttons use Slate:

```css
background: #141413;
color: #faf9f5;
```

Hover darkens to `#3d3d3a` and uses the shared double-ring model from `examples/details-buttons-links.html`. Secondary actions are paper or transparent buttons with a weak border and the same ring model. Links inherit text color and underline on hover; they are not default colored links.

## States

- Loading: disable the submit button, keep the label specific, and use either a subtle spinner or skeleton that inherits current text color.
- Error: inline field message plus one concise banner when needed. Do not use playful wording.
- Success: direct confirmation; no exclamation marks.
- Disabled: preserve contrast and cursor semantics.

## Motion

- Color and underline transitions: about 0.2s.
- Overlay and panel transitions: opacity / transform only, about 0.25s.
- Respect `prefers-reduced-motion: reduce`.

## Checklist

- [ ] Page uses paper ladder, not gradients.
- [ ] Panel is not a white card with thick shadow.
- [ ] Primary action is Slate, not a blue or Clay button.
- [ ] Focus blue appears only on keyboard focus or switch active.
- [ ] Links use underline hover, not default colored link styling.
- [ ] Error, warning, success, and info use semantic state colors.
- [ ] Text, buttons, and fields stay readable at mobile widths.
