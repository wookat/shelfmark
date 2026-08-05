# 产品线 #6 选品调研报告（阶段 A）

- 调研日期：2026-08-05（时效敏感数据均为当日采集）
- 执行：project-lead（按 company-os SOP-01 阶段 1 / SOP-02）
- 决策用途：为产品线 #6 拍板 1 个「自带分发」权重最高的方向

## 结论（前置）

**拍板方向：Shelfmark（shelfmark.zalize.com）——「书系阅读顺序 + 免登录阅读追踪」pSEO 引擎型产品。**

一句话：把 1.7M 月访问、体验停留在 2010 年的 bookseriesinorder.com 的「[作者] books in order / [系列] reading order」长尾流量池，用现代 UX + 免登录可追踪清单 + 分享卡片重做一遍；pSEO 页面本身就是产品入口（每个系列页 = 可勾选的阅读进度清单）。

如无异议将按此执行（默认即批准）。

## 三捷径逐项论证

### 1. 低分高需求（低垂果实）——命中，权重最高
- bookseriesinorder.com（BSIO）：**1.68M 月访问**（SEMrush 2026-06），其中 Google 自然流量约 1.32M/月（sitestatsdb，DR 仅 49，122,594 个排名关键词）；平均停留 7-8 分钟，需求强。但 UI 为 2000s 风格木纹页面、无追踪功能、纯 Amazon 联盟链接堆砌（截图 ss_bf61aff3 / ss_b99299e0）。流量峰值 2.88M → 现 1.68M，**-31% 下滑 = 体验差被逐步替代的窗口**。
- 单关键词证据：BSIO 仅 "john grisham books in order" 一词即 8.6K 访问/月（ahrefstop）。同型关键词 = 17K+ 作者 × {books in order / reading order / new book} 数万变体，长尾 KD 低（BSIO DR49 即可屠榜）。
- 追踪侧痛点：Goodreads 80.67M 月访问（SEMrush 2026-06）但差评密集（UI 十年未改、review bombing、亚马逊广告机器——cashewcrate 2026-02 汇总）；StoryGraph 4-5M 月访问验证「逃离 Goodreads」需求为真。

### 2. 高付费率——不适用（本线免费攒流量，不接收款），仅作需求真伪佐证：StoryGraph Plus / Hardcover supporter 均 $4.99/月，读者愿为追踪付费。

### 3. 供需窗口——中等命中
- BSIO 流量 -31% 下滑中；2026 年新出现两个现代克隆（readingorderlist.com、booksinorder.io，均标注 "since 2026"），说明窗口正被验证，但两者上线不足 1 年、权重低，格局未定；该关键词池足够宽（数万长尾词），容纳多个赢家。

### 备选方向否决理由（均当日核查）
| 方向 | 否决理由 |
|---|---|
| EU AI Act Article 50 合规工具 | 窗口极新（Art.50 自 2026-08-02 生效、官方指南 2026-08-05 发布）但：B2B 关键词池小、官方免费 Compliance Checker + Nytivo/Complee/Legalithm 已卡位（截图 ss_dc43b16f）、合规建议有法律风险 |
| 旅行费用透明 | BaggageIQ（109 家航司浏览器插件）+ CatchFlights（pSEO 全家桶）已高度饱和 |
| hyperlocal weather | 数据源成本高（雷达/模型 API 收费），免费模式难自转 |
| offline trail/hiking | 移动原生场景（离线地图），与 Workers/Pages Web 栈错配 |

## 竞品深度体验（2026-08-05 实测）

1. **bookseriesinorder.com**（截图 ss_bf61aff3 首页、ss_b99299e0 Sanderson 作者页）：无账号体系可注册；木纹背景+侧栏布局，作者页为纯文本表格（书名/年份/Description/Buy at Amazon），无追踪、无结构化数据强化、移动端体验差；变现=Amazon Associates+邮件订阅。技术反推：WordPress 型静态列表，人工编辑（自述 10,000+ 作者、300-500 条/月人工新增）——**数据生产是其护城河也是其瓶颈**。
2. **readingorderlist.com**（截图 ss_fd8c1e34 首页、ss_2d268f50 Lee Child 页）：Next.js（/_next/image），662,970 books/17,712 authors，明显是「公开书目数据库」批量生成（页脚自述）；作者页含系列徽章、出版顺序表、Audible/Kindle 联盟 CTA；**无任何追踪/账号功能**，纯静态 pSEO。
3. **booksinorder.io**（截图 ss_05a09c7d）：现代设计（奶油色+衬线大标题+暗色模式），有 Sign In 与 "Track progress" 卖点、周报邮件收集、gift guides/lists/compare 等丰富 pSEO 面；技术反推：静态生成 + app.booksinorder.io 子域应用。注册流程实测：/signin 404（截图 ss_a8f724ef），**追踪功能实际不可达 = 有名无实**。
4. StoryGraph / Hardcover：注册实测被 Cloudflare 人机验证循环拦截（本机房 IP 被 flag，截图 ss_06799bc7 / ss_95998d9c，尝试 3 次未过）；功能与定价依据 2026 年评测文章交叉验证（标注：此两家为二手来源）。

## 为什么我们能赢（差异化）

1. **pSEO 页 = 产品**：每个系列/作者页内嵌免登录（localStorage）勾选式阅读进度，搜索着陆页直接转化为留存工具；三个竞品都做不到（BSIO/ROL 无追踪，BIO.io 追踪 404）。
2. **数据自动化**：Open Library + Wikidata（P179 系列关系 + 序号）自动生成 + 数据修订管线，避开 BSIO 人工编辑瓶颈。
3. **自带分发三件套**：数万长尾词 pSEO + sitemap/IndexNow；「我的书架/年度阅读卡片」可分享图（天然传播）；与 astrosage/subsleuth/cv/watchdeck/mealloop.zalize.com 互链（watchdeck 剧集追踪用户与书系追踪用户高度同型）。
4. 免费无墙（付费墙代码留开关），邮箱意向收集 + 第一方无 Cookie 统计。

## 风险与置信度

- 需求规模：事实，置信度高（多来源交叉：SEMrush/hypestat/sitestatsdb）。
- 长尾可赢：推断，置信度中高（BSIO DR49 + 两个 2026 新克隆已在收录，说明 Google 愿意给新站该词池流量）。
- 风险：克隆竞争加速（对策：追踪+分享的产品性壁垒、数据质量管线）；书目数据脏（对策：Wikidata 优先 + 人工校验 Top 系列）。

## 下一步（阶段 B，默认执行）

新建 wookat/shelfmark；Cloudflare Workers + D1（书目/系列）+ KV（缓存/邮箱）；Tailwind 现代设计、移动端硬指标；Top 作者/系列数据管线 → pSEO 页；四道把关后上线 shelfmark.zalize.com，进入深度对标迭代循环。
