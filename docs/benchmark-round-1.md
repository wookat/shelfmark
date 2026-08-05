# 对标循环 Round 1 — Shelfmark vs 头部竞品

日期：2026-08-05 ｜ 竞品：bookseriesinorder.com（BSIO，~1.68M 月访问）、readingorderlist.com（ROL）、booksinorder.io（BIO）。竞品体验证据见 docs/research-report.md（2026-08-05 实测）。

## 逐项对照

| 维度 | BSIO | ROL | BIO | Shelfmark v1 | 差距判定 |
|---|---|---|---|---|---|
| 数据规模 | 数千作者（人工编辑） | 宣称 17K+ 作者 | 数千 | 1,683 作者 / 2,671 系列 / 24,121 书 | ❌ P1：作者覆盖不足（尤其热门悬疑/言情长尾，如 John Grisham 单页 8.6K/月） |
| 阅读顺序正确性 | 人工编辑，较准 | 自动，偶有错序 | 自动 | Wikidata ordinal + 出版年兜底；已知子系列混入（Wax and Wayne 计入 Mistborn） | ⚠️ P1：子系列拆分待处理 |
| 免登录进度追踪 | ❌ 无 | ❌ 无 | ⚠️ 宣称有但 /signin 404 | ✅ localStorage 勾选 + 进度条 + My Shelf + 分享卡片 | ✅ 领先（核心差异化成立） |
| 移动端/现代 UI | ❌ 2010 年代样式 | ✅ 静态但整洁 | ✅ 现代 | ✅ Tailwind 响应式，375px 实测通过（QA 录屏） | ✅ 持平或领先 |
| SEO 基础设施 | ✅ 成熟 | ✅ | ✅ | ✅ canonical/OG/JSON-LD/sitemap 分片/robots/IndexNow | ✅ 持平 |
| 页面加载 | 慢（广告多） | 快 | 中 | Workers 边缘 SSR，无广告 | ✅ 领先 |
| 变现 | 联盟链接 | 联盟 | 联盟 | 无（免费攒流量，付费墙留开关位） | 按策略即为设计目标 |
| 书封面图 | ✅ 有 | ✅ 有 | ✅ 有 | ❌ 无 | ❌ P1：视觉吸引力/CTR 差距 |
| 作者简介文本 | ✅ 人工长文（SEO 内容量大） | ⚠️ 模板化 | ⚠️ 模板化 | ❌ 仅模板句 | ⚠️ P2：页面内容单薄，排名竞争力弱 |

## 本轮已修（P0/P1）
1. P0（QA 前）：Hono 路由 regex 崩溃导致全站 500 → 已修复并部署验证（全路由 200）。
2. P1：JSON-LD `</script>` 逃逸 XSS 风险 → `\u003c` 转义。
3. P2：首页「Popular series」被数据集型系列（xkcd/LNCS）霸榜 → 过滤为 3–60 本且有作者的系列。
4. P2：邮箱订阅反馈只有按钮文案 → 增加确认文案。

## Round 2 待办（按优先级）
- P1 数据扩容：Open Library / 更多 Wikidata 类目补作者与系列（目标 ≥10K 作者），并处理子系列层级。
- P1 封面图：Open Library covers API（免费、可热链）。
- P2 作者/系列页自动摘要文本增强 + 类型（genre）聚合页。
- P2 /api 限流、邮件 double opt-in。

## 结论
核心差异化（页面即追踪器）已验证领先所有竞品；SEO 技术面持平；数据覆盖与封面是与竞品的主要差距（P1），进入 Round 2 解决。
