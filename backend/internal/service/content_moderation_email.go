package service

import (
	"fmt"
	"html"
	"strings"
	"time"
)

func buildContentModerationViolationEmailBody(siteName string, log *ContentModerationLog, cfg *ContentModerationConfig) string {
	if log == nil {
		return ""
	}
	userName := strings.TrimSpace(log.UserEmail)
	if userName == "" && log.UserID != nil {
		userName = fmt.Sprintf("UID %d", *log.UserID)
	}
	threshold := cfg.BanThreshold
	if threshold <= 0 {
		threshold = defaultContentModerationBanThreshold
	}
	statusBlock := ""
	if log.AutoBanned {
		statusBlock = `<div class="email-state">账户当前处于封禁状态，所有 API 请求将被拒绝</div>`
	}
	content := fmt.Sprintf(`
<p>尊敬的用户 <strong>%s</strong>，您的 API 请求在内容审计中触发平台风控策略。详情如下。</p>
<div class="email-block email-danger">
  <h2>触发详情</h2>
  <table class="email-table">
    <tr><td>触发时间</td><td>%s</td></tr>
    <tr><td>触发来源</td><td>内容审核</td></tr>
    <tr><td>所属分组</td><td>%s</td></tr>
    <tr><td>命中类别</td><td>%s / %.3f</td></tr>
    <tr><td>累计触发次数</td><td>%d 次（阈值 %d）</td></tr>
  </table>
</div>
%s`,
		html.EscapeString(userName),
		html.EscapeString(time.Now().Format("2006-01-02 15:04:05")),
		html.EscapeString(defaultContentModerationString(log.GroupName, "-")),
		html.EscapeString(defaultContentModerationString(log.HighestCategory, "-")),
		log.HighestScore,
		log.ViolationCount,
		threshold,
		statusBlock,
	)
	return buildAnthropicEmailBody(siteName, "账户触发内容审计规则", content)
}

func buildContentModerationAccountDisabledEmailBody(siteName string, log *ContentModerationLog, cfg *ContentModerationConfig) string {
	if log == nil {
		return ""
	}
	userName := strings.TrimSpace(log.UserEmail)
	if userName == "" && log.UserID != nil {
		userName = fmt.Sprintf("UID %d", *log.UserID)
	}
	threshold := cfg.BanThreshold
	if threshold <= 0 {
		threshold = defaultContentModerationBanThreshold
	}
	content := fmt.Sprintf(`
<p>尊敬的用户 <strong>%s</strong>，您的账户在计数周期内多次触发平台风控策略，系统已自动禁用该账户。详情如下。</p>
<div class="email-block email-danger">
  <h2>封禁详情</h2>
  <table class="email-table">
    <tr><td>封禁时间</td><td>%s</td></tr>
    <tr><td>触发来源</td><td>内容审核</td></tr>
    <tr><td>所属分组</td><td>%s</td></tr>
    <tr><td>命中类别</td><td>%s / %.3f</td></tr>
    <tr><td>累计触发次数</td><td>%d 次（阈值 %d）</td></tr>
  </table>
</div>
<div class="email-state">账户当前处于封禁状态，所有 API 请求将被拒绝</div>
<p>如需申诉或恢复账号，请联系平台管理员处理。</p>`,
		html.EscapeString(userName),
		html.EscapeString(time.Now().Format("2006-01-02 15:04:05")),
		html.EscapeString(defaultContentModerationString(log.GroupName, "-")),
		html.EscapeString(defaultContentModerationString(log.HighestCategory, "-")),
		log.HighestScore,
		log.ViolationCount,
		threshold,
	)
	return buildAnthropicEmailBody(siteName, "账户已被自动禁用", content)
}

func defaultContentModerationString(value string, fallback string) string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	return strings.TrimSpace(value)
}

// buildCyberPolicyNoticeEmailBody 是 cyber_policy 通知邮件的内置兜底正文，
// 当 notification email 模板渲染失败时使用（与 sendViolationEmail 的兜底同理）。
func buildCyberPolicyNoticeEmailBody(siteName string, log *ContentModerationLog) string {
	if log == nil {
		return ""
	}
	userName := strings.TrimSpace(log.UserEmail)
	if userName == "" && log.UserID != nil {
		userName = fmt.Sprintf("UID %d", *log.UserID)
	}
	content := fmt.Sprintf(`
<p>尊敬的用户 <strong>%s</strong>，您的请求被上游网络安全策略（cyber policy）拦截。</p>
<div class="email-block email-danger">
  <table class="email-table">
    <tr><td>触发时间</td><td>%s</td></tr>
    <tr><td>模型</td><td>%s</td></tr>
    <tr><td>上游说明</td><td>%s</td></tr>
  </table>
</div>
<p>如认为系误判，可调整请求措辞后重试，或申请获得授权的安全访问权限。</p>`,
		html.EscapeString(userName),
		html.EscapeString(log.CreatedAt.Format("2006-01-02 15:04:05")),
		html.EscapeString(defaultContentModerationString(log.Model, "-")),
		html.EscapeString(defaultContentModerationString(log.Error, "-")),
	)
	return buildAnthropicEmailBody(siteName, "请求被网络安全策略拦截", content)
}
