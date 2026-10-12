//go:build unit

package service

import (
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestBuildNotifyVerifyEmailBodyKeepsOfficialCopyAndEscapesValues(t *testing.T) {
	body := buildNotifyVerifyEmailBody(`123<456`, `</h1><script>alert("x")</script>`)

	require.NotContains(t, body, `<script>`)
	require.Contains(t, body, `&lt;script&gt;`)
	require.Contains(t, body, `123&lt;456`)
	require.Contains(t, body, `background: linear-gradient(135deg`)
	require.Contains(t, body, `通知邮箱验证码 / Notification Email Verification`)
	require.Contains(t, body, `If you did not request this code, please ignore this email.`)
	require.Contains(t, body, `此邮件由系统自动发送，请勿回复。`)
	require.Contains(t, body, fmt.Sprintf(`此验证码将在 <strong>%d 分钟</strong>后失效。`, int(verifyCodeTTL/time.Minute)))
	require.Contains(t, body, fmt.Sprintf(`This code will expire in <strong>%d minutes</strong>.`, int(verifyCodeTTL/time.Minute)))
	require.True(t, strings.Contains(body, `&lt;/h1&gt;`))
}
