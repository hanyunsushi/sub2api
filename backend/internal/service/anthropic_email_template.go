package service

import (
	"html"
	"strings"
)

func buildAnthropicEmailBody(siteName, title, content string) string {
	return buildAnthropicEmailBodyRaw(
		html.EscapeString(strings.TrimSpace(siteName)),
		html.EscapeString(strings.TrimSpace(title)),
		strings.TrimSpace(content),
	)
}

func buildAnthropicEmailBodyRaw(siteName, title, content string) string {
	if strings.TrimSpace(siteName) == "" {
		siteName = defaultSiteName
	}
	return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background: #faf9f5; color: #141413; font-family: "Anthropic Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", Arial, sans-serif; }
    .email-shell { padding: 32px 16px; }
    .email-canvas { max-width: 680px; margin: 0 auto; overflow: hidden; background: #faf9f5; border: 1px solid #d1cfc5; border-radius: 16px; }
    .email-head { padding: 34px; background: #f0eee6; border-bottom: 1px solid rgba(20, 19, 19, 0.08); }
    .email-kicker { display: inline-block; color: #5e5d59; font-size: 13px; font-weight: 500; line-height: 20px; }
    .email-dot { display: inline-block; width: 8px; height: 8px; margin-right: 8px; border-radius: 999px; background: #c96442; vertical-align: 1px; }
    h1 { margin: 14px 0 0; color: #141413; font-family: Georgia, "Times New Roman", "Songti SC", SimSun, serif; font-size: 44px; font-weight: 500; line-height: 0.98; letter-spacing: 0; }
    h2 { margin: 0 0 12px; color: #141413; font-size: 18px; font-weight: 500; line-height: 1.35; }
    p { margin: 0 0 16px; }
    a { color: #141413; text-decoration: underline; text-underline-offset: 0.18em; }
    .email-body { padding: 34px; color: #141413; font-size: 15px; line-height: 1.7; }
    .email-block { margin: 22px 0; padding: 20px; background: #f0eee6; border: 1px solid rgba(20, 19, 19, 0.08); border-radius: 12px; }
    .email-code { display: block; width: max-content; max-width: 100%; margin: 22px auto; padding: 18px 26px; background: #f0eee6; border: 1px solid #d1cfc5; border-radius: 12px; color: #141413; font-family: "Anthropic Mono", "JetBrains Mono", SFMono-Regular, Menlo, Consolas, monospace; font-size: 36px; font-weight: 500; line-height: 1; letter-spacing: 8px; text-align: center; }
    .button, a.button, a.button:link, a.button:visited, a.button:hover, a.button:active { display: inline-block; margin: 12px 0 18px; padding: 12px 20px; background: #141413; border: 1px solid #141413; border-radius: 8px; color: #faf9f5 !important; font-weight: 500; line-height: 1.2; text-decoration: none !important; text-underline-offset: 0; }
    a.button:hover { background: #3d3d3a; color: #faf9f5 !important; text-decoration: none !important; }
    .button-secondary { background: transparent; color: #141413 !important; border-color: #141413; }
    .muted { color: #5e5d59; font-size: 13px; line-height: 1.6; }
    .email-warning { background: #fff9ef; border-color: #ffedcc; }
    .email-danger { background: #fff1f0; border-color: #ebcece; }
    .email-state { margin-top: 22px; padding: 16px 18px; border-radius: 10px; background: #fff1f0; border: 1px solid #ebcece; color: #9b3e36; font-size: 15px; font-weight: 600; line-height: 1.6; text-align: center; }
    .email-table { width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.5; }
    .email-table td { padding: 12px 0; border-bottom: 1px solid rgba(20, 19, 19, 0.08); vertical-align: top; }
    .email-table tr:last-child td { border-bottom: 0; }
    .email-table td:first-child { width: 42%; color: #5e5d59; }
    .email-table td:last-child { color: #141413; font-weight: 500; }
    .email-footer { padding: 24px 34px; background: #faf9f5; border-top: 1px solid rgba(20, 19, 19, 0.08); color: #87867f; font-size: 13px; line-height: 1.6; }
    @media (max-width: 640px) {
      .email-shell { padding: 18px 0; }
      .email-canvas { border-left: 0; border-right: 0; border-radius: 0; }
      .email-head, .email-body, .email-footer { padding-left: 22px; padding-right: 22px; }
      h1 { font-size: 36px; }
      .email-code { width: auto; font-size: 30px; letter-spacing: 6px; }
    }
  </style>
</head>
<body>
  <div class="email-shell">
    <div class="email-canvas">
      <div class="email-head">
        <span class="email-kicker"><span class="email-dot"></span>` + siteName + `</span>
        <h1>` + title + `</h1>
      </div>
      <div class="email-body">` + content + `</div>
      <div class="email-footer">This email was sent by ` + siteName + `. Please do not reply directly.</div>
    </div>
  </div>
</body>
</html>`
}

// BuildAnthropicEmailBody returns the shared Anthropic-style HTML shell used by
// admin test email and legacy fallback email bodies.
func BuildAnthropicEmailBody(siteName, title, content string) string {
	return buildAnthropicEmailBody(siteName, title, content)
}
