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
        CPA Codex Buzz TCDMX
        """

        markdown = generator.build_markdown(source)

        self.assertIn("每天 03:00 自动生成 PostgreSQL 备份", markdown)
        self.assertIn("右上角有常驻的 `ask ai` 搜索框", markdown)
        self.assertIn("每 3 天按用户版知识文档重新上传一次", markdown)
        self.assertIn("后端会根据最高相关知识块生成简短回答", markdown)
        self.assertIn("管理员后台提供 Codex/CPA 账号管理能力", markdown)
        self.assertEqual([], generator.validate_public_markdown(markdown))
        self.assertNotIn("/Users/hinaw", markdown)
        self.assertNotIn("sha256:", markdown)
        self.assertNotIn("Secret Access Key", markdown)
        self.assertNotIn("codex/production-running", markdown)

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
