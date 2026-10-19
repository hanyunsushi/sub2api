---
title: Console OIDC Backend
updated: 2026-10-19
sources:
  - backend/internal/handler/auth_oidc_console.go
  - backend/internal/handler/auth_oidc_oauth.go
  - backend/internal/handler/auth_oidc_console_test.go
---

# Independent original-site and Console authentication

`oidcConfigForRequest` returns a request-local copy of the existing OIDC configuration. Only the preserved Host `console.kreeper.cc` (optionally port 443) selects `https://console.kreeper.cc/api/kreepai/api/v1/auth/oauth/oidc/callback` and the frontend return `https://console.kreeper.cc/kreepai/auth/oidc/callback`. Other hosts retain the original settings. Arbitrary Origin/forwarded-host headers cannot select an origin.

Start and callback use the same redirect selection, including the authorization-code token exchange. Issuer, Client ID/Secret, subject identity mapping, state/nonce/PKCE validation, account policies and issued tokens retain their original ownership. The adapter does not mutate stored settings or merge project accounts.

Append the Console API callback as a Strict URI in the existing Authentik Provider, keeping the original callback and client configuration. The Console gateway must preserve Host and prefix OAuth/pending/promo cookie paths under `/api/kreepai`, including deletion cookies; deploy the gateway change together with this backend.

Signed local provider tests cover exact token-exchange callback, token issuance, unchanged original configuration and rejection without browser proof. Original OIDC regression tests run alongside these tests. Production health and authorization-start checks do not prove a completed external login.

## See Also

- [OCI Authentik OIDC](../guides/oci-authentik-oidc.md)
- [Wiki Index](../_index.md)
- [Project Authority](../../agent.md)
