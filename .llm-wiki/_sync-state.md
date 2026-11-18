---
title: 前端设计细节同步状态
updated: 2026-11-18
head_commit: 5872efc59cfbcd246aff7ce8a7e1a298b49a1d96
---

## 上游 main 合并同步范围（2026-11-18）

Doc Impact Map：`upstream/main` `2af3f1e15c98c893a89255a037f551046883b8c` 已合并到 `codex/cpa-management`，合并提交为 `5872efc59cfbcd246aff7ce8a7e1a298b49a1d96`。冲突合并覆盖账户编辑测试、账户列表布局和设置页样式；上游新增注册邮箱黑名单、透传模型筛选、账户表虚拟化及 Ultra Fast 能力沿对应前端/后端模块归档，发布与未部署边界归项目权威文档。`go generate`、Go 全量测试、前端 typecheck/lint/production build/microfrontend build 通过；完整 Vitest 3304 项中 3300 项通过，4 项为上游黑名单弹窗关闭后 React/Headless DOM 时序断言。未推送、未部署或修改 OCI/生产配置；此前 3 个 Wiki dirty 文件恢复并保留。检查范围包括 `_schema.md` 基线、权威软链接、Wiki 内部链接、索引覆盖和限定 diff 格式；CodeGraph MCP 未暴露，本轮不宣称结构索引刷新。

## OCI公网上传分段定位同步范围（2026-11-12）

Doc Impact Map：10:32–10:40的OCI本机/独立客户端/SSH绕行/同期CF直连结果及公网段定位边界归[项目权威](../agent.md#oci公网上传分段定位2026-11-12)，分段对照、持续上传与重传解释归[OCI指南](guides/oci-operations.md#large-request-upload-triage)。核对schema=HEAD、无暂存变化，原有四项dirty路径保留；仅增补本轮验证事实。未完成API探针排除，跨HTTP版本吞吐不作精确同协议归因；无业务代码、模型调用、生产配置或服务写入。临时客户端/SSH转发/夹具清理及配置/选择一致性已核对。受影响链接/锚点、两次点击索引、源引用、权威软链接、敏感数据与限定diff格式检查归本次文档lint。CodeGraph工具未暴露，无结构变更或索引更新声明。

## 20MB直连与代理复测同步范围（2026-11-12）

Doc Impact Map：本机物理直连/现用代理到AI的当前上传结果、服务端截断对应与未定位边界归[项目权威](../agent.md#20mb-直连与代理复测2026-11-12)，20MB随机夹具、完整接收判定、TUN物理接口与TTFB/TTFT边界归[OCI指南](guides/oci-operations.md#large-request-upload-triage)。已核对schema基线=HEAD、无暂存变化及原有四项dirty文档；仅更新本轮验证事实，保留既有内容。网络配置/选择前后摘要一致，临时夹具已移除；无应用源码改动、部署、模型调用或网络设置写入。受影响Markdown链接/锚点、两次点击索引覆盖、源码引用、权威软链接、敏感数据与限定diff格式检查归本轮文档lint；CodeGraph工具未暴露，本轮不涉及结构变更，不宣称索引更新。

## 合聚上游WS核验同步范围（2026-11-11）

Doc Impact Map：生产上游WS连接、账号ctx_pool、部署默认模式路由和预热/首包错误归[项目权威](../agent.md#合聚上游-wss-只读核验2026-11-11)，分段证据与只读核查方法归[OCI指南](guides/oci-operations.md#openai-websocket-upstream-verification)。已核对schema基线=HEAD、无暂存变更和既有四项dirty文档；仅追加本任务事实并保留原有内容。服务器只读日志、精确配置白名单和只读事务确认合聚上游连接及多轮串接；没有新增主动模型调用、部署、配置或业务写入。CodeGraph工具不可用，本轮无需结构变更或索引更新。受影响链接、source引用、authority软链接、敏感数据及文档diff检查通过；不扩大为长期稳定性或合聚内部模型链路验收。

## 大请求上传链路核对范围（2026-11-10）

本次仅同步请求体上传阶段的运行验证事实：事故证据与待授权边界归[权威](../agent.md#大请求上传截断排查2026-11-10)，诊断方法归[OCI运维指南](guides/oci-operations.md#large-request-upload-triage)。核对schema基线至当前HEAD、暂存和dirty列表；其间提交为侧栏文档/回执更新，本次不扩大业务验收。既有_sync-state和开发指南dirty内容保持。未修改业务代码、生产配置、系统代理、Tunnel、节点选择或服务；隔离探针在空model参数校验处结束，无模型推理。CodeGraph MCP不可用，CLI存在Node/数据库兼容问题；未更改索引。受影响文档链接、源码标识、authority软链接、敏感数据及限定diff格式检查归本轮验证，不宣称恢复或修复完成。




## 当前侧栏发布同步范围

本次Doc Impact Map含普通行中心与折叠箭头占位：实现归[设计模块](modules/embedded-design-system.md)，干净源码/测试/双入口构建、生产资源与回滚验证归[权威](../agent.md)和[回执](guides/sidebar-alignment-release-20261106.json)。本轮源码已推送发布；Node22完成AI生产构建。已核对HEAD与dirty范围，既有并行文档和业务文件保持，其他历史同步段不由此扩大验收范围。

# SF导航范围同步

Doc Impact Map：导航专用SfIcon/原业务Icon和内联SVG恢复归Sub2API共享设计模块与复盘，跨Vue叶子仍归MFE合同；双入口实际源码/image/恢复/保留与浏览器限制归[权威](../agent.md)，[脱敏回执](guides/nav-svg-scope-release-20261104.json)与索引提供入口。已核对last_synced至HEAD、暂存/dirty范围；保留并行页面与文档。3218测试、类型/lint/clean双入口构建、58公网/36摘要和源白名单核验通过；Chrome管理员桌面正文无SF、导航SF保持，9条reload请求错误与内容恢复有记录。受影响链接/JSON/源路径/权威软链接/diff lint通过；CodeGraph工具不可用，不宣称刷新。未新增原生认证逐页、手机/其他引擎/物理触摸或完整恢复验收。

# 当前发布同步范围（2026-11-02）

- 源码a4efbbc2c（0.2.19）已提交推送并发布独立应用及Console AI；运行、迁移、恢复与并行营销收尾归[项目权威](../agent.md)，脱敏[发布回执](guides/sub2api-upstream-v0219-release-20261102.json)为证。
- Doc Impact Map：源码管理/MCP/迁移指南沿合并文档；发布/保留入口和两仓回执同步。原有本机停用与历史同步内容保留，不混入本批提交。
- 验证：clean native/MFE、Linux ARM64候选、32公网/18摘要、204旧原生资源、12容器健康、备份及异机image17blob通过；合并405文件3206测试和Go全量门禁通过。两次顺序校验保护误报及修正已记录，无新增认证浏览器或完整恢复演练。
- 并行营销推进Console current，AI全部字节保留；过期清单被拒绝后重建，4890manifest/1001引用和seal/apply精确保留通过。既有并行文档/示范修改保留。
- 文档lint：受影响Wiki文件链接/JSON、索引与权威软链接、diff格式核对；CodeGraph环境限制沿合并记录，不宣称同步索引。

# 范围

仅同步用户要求的Mac本机项目服务停用和按需恢复方式。当前HEAD、暂存及未暂存文件清单已核对；已有并行源码/文档修改保留，本次不审查或宣称验收那些业务改动，不发布或修改OCI。

# Doc Impact Map

- 本机运行状态、停用事实及数据边界由[项目权威文档](../agent.md#本机服务状态2026-10-23)管理。
- 按需恢复步骤见[开发指南](guides/development-and-testing.md)。
- 业务代码、API、模块和构建依赖没有本次变更；不新增代码测试或从停机验证推断业务验收。

# 验证范围

核对本机监听端口、Docker状态/重启策略及适用的launchd disable/bootout；受影响文档链接和权威软链接检查、限定文档diff格式检查。OpenStock匿名卷的自动清理例外只按其权威证据描述，未宣称数据已恢复。其余既有源码/文档改动保持原状。


# AI原生外壳与弹窗修复同步（2026-10-23）

- Doc Impact Map：侧栏/顶栏、业务弹窗动效、账号菜单/开关、三处空态归[共享设计模块](modules/embedded-design-system.md#account-page-review-and-native-modal-motion)；发布、运行时、恢复点及浏览器验收边界归[项目权威](../agent.md)。
- 已核对提交、暂存和未暂存边界；本机停用说明及此前文档改动保留。源码提交`ac62dff9b9afcdf5beb82e24af709ba4a2deefb4`已推送现有分支。
- 验证：类型、原生构建、受影响回归；全量396文件3004项通过；同时核对确认/焦点/滚动锁等18项。浏览器360/390/1167px、空态、菜单、开关、账号/外部订阅/密钥弹窗核对完成；CCS导入点击被浏览器自动安全审查拦截，保留源码/测试证据，不宣称实际导入已验证。低动态有自动化证据，未模拟物理触摸硬件。
- 分类沿用侧边栏/顶栏/悬浮菜单按钮/下拉选择菜单/切换开关/提示信息/卡片SVG/组件绘制动画；仅复用现有字体角色，不新增AWS文字或图表规则。用户明确要求AI普通Modal恢复原动效，按项目决定覆盖历史source默认，不将此扩展为全局规范变更。

- 发布验收：独立Sub2API为ac62dff9b，运行image4fe89ebe737e/healthy/restarts0，10本机路由/公网health及6入口资源摘要通过。生产认证浏览器只打开关闭账号/外部订阅/密钥弹窗及三处空态，未执行数据写入。恢复点和精确保留回执归权威文档；Console嵌入产物构建通过，未改Host指针。

## Logo and route overlay scroll - 2026-10-24

Scope: Console branding and the AI/marketing scoped route overlay. Source, browser, release and recovery evidence: [Host receipt](/Users/hinaw/console-kreeper/.llm-wiki/guides/logo-scroll-release-20261024.json). Other pending audit edits are preserved separately.

## 合聚只读接入调研 - 2026-10-24

Doc Impact Map：官方 API、字段单位及同账号/单 Key 统计范围由[接入调研](guides/heju-external-subscription.md)管理；任务状态和验证边界归[项目权威](../agent.md)。当前源码基线2972ca3bf2176b70f946b3129b933891ef230e7f，既有未提交文档保留。本次只新增调研与入口，不改变业务代码、凭据或运行时。公开文档及无凭据200/401验证不等同有效密钥验收。检查Wiki相对链接、源引用、索引与权威软链接及限定文档diff；不重跑业务测试。


## 合聚配置与双入口发布 - 2026-10-24

Doc Impact Map：合聚协议与字段归Sub2API接入指南；双入口产物/验证/保留各归本项目heju-release-20261024.json；运行和恢复归各自权威。受影响源、预存dirty文档与Git边界已核对。既有本机停用/只读审计文档保留，不纳入业务源码提交。396文件3009前端测试及后端定向/API契约、类型/lint/clean native/MFE构建通过；初始旧KeyUsage退出异常经孤立与低并发全量复验通过。两个正式入口认证卡片1280/390无横溢出；合聚服务端真实只读请求通过，无模型推理请求。未写入凭据或真实账号金额到发布回执。链接、源引用、索引与权威软链接核对；Host其他项目隔离缺口保留。

## 当前顶栏材质同步范围

本任务仅核对`frontend/src/styles/design-system/kreepai.css`仅在原生`.kreepai-app-header:not(.kreepai-original-header)`局部覆盖透明表面，明暗主题均沿用22px模糊；无滤镜时回退当前主题页面面。侧栏品牌渐变、公开首页与认证整页布局保持；嵌入操作组仍为contents，由Host承担顶栏。 文档owner为`.llm-wiki/modules/embedded-design-system.md`与`agent.md`。既有未完成任务记录保持；验证边界归项目权威，本次未部署。

## 透明磨砂发布同步

Doc Impact Map：磨砂材质/范围归对应设计模块；发布身份、恢复与未验范围归agent.md；六应用共享脱敏回执在Console Wiki。核对源提交、暂存和dirty边界，仅同步本批发布；无关源码/文档保持。CodeGraph MCP不可用。六仓118份Markdown/1668处本地链接、JSON、authority软链及diff检查通过；OpenStock官方docs:sync/docs:check通过（25页/173内部链接）。证据归Console `output/frosted-release-20261113/docs-lint.json`。
