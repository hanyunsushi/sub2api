import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("generate_ai_search_knowledge.py")
spec = importlib.util.spec_from_file_location("generate_ai_search_knowledge", MODULE_PATH)
generator = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(generator)


class GenerateAISearchKnowledgeTest(unittest.TestCase):
    def test_generates_public_knowledge_without_internal_release_details(self):
        source = """
        ## R2 灾备状态
        每天 `03:00` 自动备份，保留策略为 30 天。
        /Users/hinaw/sub2api-src codex/production-running sha256:abc1234567890abcdef
        Cloudflare 账号 d1cf0f9a11253d72f2dde108713d5e76 Secret Access Key
        ## Cloudflare AI Search 状态
        AI Search 搜索框放在公告铃左边，实例 ai-search。
        CPA Codex Buzz TCDMX QLHazyCoder Mimo replace challenge mismatch
        自定义菜单 iframe 跳转 菜单顺序 SVG 图床链接
        """

        markdown = generator.build_markdown(source)

        self.assertIn("每天 03:00 自动生成 PostgreSQL 备份", markdown)
        self.assertIn("右上角有常驻的 `Creepee` 入口", markdown)
        self.assertIn("右侧侧边栏", markdown)
        self.assertIn("助手名称是 `Creepee`", markdown)
        self.assertIn("后台已有 Cloudflare AI Search 连接", markdown)
        self.assertIn("管理端的“立即同步知识库”", markdown)
        self.assertIn("Cloudflare 官方聊天组件承载，基于知识库给出自然语言回答并附带来源", markdown)
        self.assertIn("渠道监控建议优先使用低输出的 `replace` 探针", markdown)
        self.assertIn("challenge mismatch", markdown)
        self.assertIn("QLHazyCoder", markdown)
        self.assertIn("Mimo", markdown)
        self.assertIn("自定义菜单", markdown)
        self.assertIn("SVG 图床链接", markdown)
        self.assertIn("管理员后台提供 Codex/CPA 账号管理能力", markdown)
        self.assertEqual([], generator.validate_public_markdown(markdown))
        self.assertNotIn("/Users/hinaw", markdown)
        self.assertNotIn("sha256:", markdown)
        self.assertNotIn("Secret Access Key", markdown)
        self.assertNotIn("codex/production-running", markdown)
        self.assertNotIn("本机路径", markdown)
        self.assertNotIn("提交记录", markdown)
        self.assertNotIn("镜像信息", markdown)
        self.assertNotIn("部署命令", markdown)
        self.assertNotIn("密钥", markdown)
        self.assertNotIn("凭据", markdown)
        self.assertNotIn("敏感值", markdown)
        self.assertNotIn("API key", markdown)
        self.assertNotIn("API Key", markdown)

    def test_uses_r2_backup_time_not_ai_search_sync_time(self):
        source = """
        ## R2 灾备状态
        每天 `03:00` 自动备份，保留策略为 30 天。

        ## Cloudflare AI Search 状态
        旧方案每日同步由 Codex 自动化执行，计划每天 03:20。
        AI Search 搜索框放在公告铃左边。
        """

        markdown = generator.build_markdown(source)

        self.assertIn("每天 03:00 自动生成 PostgreSQL 备份", markdown)
        self.assertNotIn("每天 03:20 自动生成 PostgreSQL 备份", markdown)
        self.assertIn("每 3 天按用户版知识文档重新上传一次", markdown)


if __name__ == "__main__":
    unittest.main()
