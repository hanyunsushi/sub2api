# 字体来源与打包状态

| 字体 | 实际版权/许可证据 | 来源 |
| --- | --- | --- |
| Fraunces | 青舟原静态文件内嵌Copyright2020 The Fraunces Project Authors，保留于source-reference；复用包更正为Google Fonts固定来源真实变量100–900，随附Fraunces-GoogleFonts-OFL.txt原文Copyright2018；旧Fraunces-OFL.txt保留原声明，不改写年份 | [来源](https://github.com/undercasetype/Fraunces) |
| Source Han Serif CN VF | 内嵌©2017–2024 Adobe / Reserved Font Name Source；项目随附OFL-1.1.txt原样 | [来源](https://github.com/adobe-fonts/source-han-serif) |
| Inter variable | 内嵌©2016 Inter Project Authors / Rasmus Andersson / OFL1.1；项目OFL原样 | [来源](https://github.com/rsms/inter) |
| Resource Han Rounded CN三字重 | 内嵌©2018–2019 Cyano Hao，portions2014/2015/2018 Adobe；明确OFL1.1；官方LICENSE.md与OFL-License.txt随附 | [来源](https://github.com/CyanoHao/Resource-Han-Rounded) |
| Courier Prime Regular/Bold | Copyright 2015 The Courier Prime Project Authors；SIL OFL1.1，OFL.txt随附；实际weight400/700 | [固定来源](https://github.com/google/fonts/tree/7204f5a9b1e530633e00c67bd4954ceb7d8c2483/ofl/courierprime) |
| Amazon Ember Mono（遗留独立HTML模板回退名） | 前端已使用实际打包的Courier Prime；此名称仍只存在于独立Go HTML模板回退栈，无文件/face，不属于已提供字体 | [AWS等宽规范](https://cloudscape.design/foundation/visual-foundation/typography/) |

四个中英字体角色不变；原Fraunces静态500文件保存于source-reference，复用包同路径提供已验证的同family真变量，其余五个文件沿用青舟字节；Courier Prime两个文件从固定Google Fonts提交取得并核对Git blob和SHA，许可独立保留；字重映射见typography.md。保留全部版权/许可，不把这些字体改名为自有字体。

Courier Prime的两个原始字体文件同时随青舟前端与复用包提供，字节和OFL声明保持；125.53%字面适配只由CSS @font-face size-adjust执行，不修改、重命名字体，也不新增中英正文字体角色。
