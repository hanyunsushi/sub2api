//go:build unit

package service

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestLegacyAuthEmailFallbacksUseAnthropicEmailShell(t *testing.T) {
	svc := &EmailService{}
	checks := []struct {
		name     string
		body     string
		expected []string
	}{
		{
			name: "verification code",
			body: svc.buildVerifyCodeEmailBody("123456", "Sub2API"),
			expected: []string{
				"Email verification code",
				"class=\"email-code\"",
				"123456",
			},
		},
		{
			name: "password reset",
			body: svc.buildPasswordResetEmailBody("https://example.com/reset?token=abc", "Sub2API"),
			expected: []string{
				"密码重置",
				"class=\"button\"",
				"style=\"text-decoration:none!important;color:#faf9f5!important;display:inline-block;",
				"https://example.com/reset?token=abc",
			},
		},
		{
			name: "notification email verify",
			body: buildNotifyVerifyEmailBody("654321", "Sub2API"),
			expected: []string{
				"通知邮箱验证",
				"class=\"email-code\"",
				"654321",
			},
		},
	}

	for _, check := range checks {
		t.Run(check.name, func(t *testing.T) {
			require.Contains(t, check.body, "background: #faf9f5")
			require.Contains(t, check.body, "background: #f0eee6")
			require.Contains(t, check.body, "#c96442")
			require.Contains(t, check.body, "a.button:link")
			require.Contains(t, check.body, "a.button:hover")
			require.Contains(t, check.body, "text-decoration: none !important")
			require.Contains(t, check.body, "text-decoration:none!important;color:#faf9f5!important;display:inline-block")
			require.NotContains(t, check.body, "linear-gradient")
			require.NotContains(t, check.body, "#667eea")
			require.NotContains(t, check.body, "#764ba2")
			require.NotContains(t, check.body, "box-shadow: 0 2px 8px")
			require.NotContains(t, check.body, "%!")
			for _, expected := range check.expected {
				require.Contains(t, check.body, expected)
			}
		})
	}
}

func TestAnthropicEmailBodyEscapesShellLabelsOnly(t *testing.T) {
	body := buildAnthropicEmailBody(`Site <Admin>`, `Title <One>`, `<p>trusted content</p>`)
	require.Contains(t, body, `Site &lt;Admin&gt;`)
	require.Contains(t, body, `Title &lt;One&gt;`)
	require.Contains(t, body, `<p>trusted content</p>`)
	require.Equal(t, 1, strings.Count(body, `<div class="email-canvas">`))
}
