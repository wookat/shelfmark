# Replication Benchmark — 1:1 还原度对照表

标杆：**bookseriesinorder.com（BSIO）** + **Goodreads 系列/图书页**（取长补短）。
方法：真实走查公开可访问页面（Playwright 抓取 HTML + 全页截图，落库 `research/comp/rep/`），逐页逐流程对照。
合规边界：复刻信息架构/交互/体验规律，全部自研实现；不拷贝闭源代码、版权图片、字体、商标、文案原文；不绕 bot wall（Goodreads 登录后流程未走查，仅用公开页面 + 登录弹窗观察）。

评分口径：还原度 = 我们对标杆该项体验的覆盖程度（100% = 等同或更好，考虑我们的数据边界）。

## A. BSIO（作者页为核心单元）

| # | 标杆项（页面/流程/细节） | 标杆做法 | 我们现状 | 还原度 | 差距/行动 |
|---|---|---|---|---|---|
| A1 | 作者页 = 全书目单页（每系列一节 + Standalone 节） | 「Publication Order of X Books」逐节列出，行 = 书名+(年份)+Description/Buy 链接 | /authors/{slug} 同构：每系列一节 + standalone 节，行 = 序号+封面+书名+(年份)+Find a copy，且多了勾选追踪、Copy list | **100%** | 达标（超越：追踪/封面/复制清单） |
| A2 | Chronological Order 节（与出版顺序不同时） | 部分作者额外给章节内时间线顺序 | 仅出版顺序 | **60%** | 数据边界：Wikidata 无叙事时间线数据，无合规批量来源。已在系列页用 explainer 解释为何出版顺序是安全默认。不排期 |
| A3 | 每行 Description / Buy at Amazon | 双链接，Buy 走 Amazon 联盟 | 书名链到 /book 详情页 + Find a copy（Bookshop.org，无联盟码） | **100%** | 达标（详情页信息>其 Description 弹层） |
| A4 | 打印按钮 | 页顶打印图标 | Print list 按钮 + print CSS（隐藏 chrome） | **100%** | 达标 |
| A5 | 搜索框（全站头部） | WP 搜索，结果为文章列表 | /search 分组（作者/系列/书目），书目行原为纯文本 | **95%→100%** | 本批：书目结果行加封面缩略图 + 直达 /book 链接（R137） |
| A6 | Book Release Calendar | 按月新书列表页 | /new + 流派过滤 + RSS + 订阅提醒 | **100%** | 达标（超越：RSS/邮件提醒；粒度为年 vs 其月，但其依赖人工录入） |
| A7 | Characters 索引（按角色名找系列） | 人工维护的角色→系列映射 | 无角色数据 | **0%** | 数据边界：Wikidata 角色覆盖极稀疏，人工维护不可扩展。不排期，记录为差异化取舍 |
| A8 | 新闻信/推荐位（Book of the Month 等） | 侧栏订阅 + 每周推荐邮件 | 页脚订阅 + 周一增量 digest（double opt-in） | **100%** | 达标 |
| A9 | 首页 = 站长信 + 最新收录列表 | 个人化长文 + Latest Authors/Characters | 首页 = hero+搜索+How it works+热门/流派入口 | **100%** | 结构不同但信息效率更高；保留我们方案 |

## B. Goodreads 系列页

| # | 标杆项 | 标杆做法 | 我们现状 | 还原度 | 差距/行动 |
|---|---|---|---|---|---|
| B1 | 系列头：名称 + 「N primary works · M total works」+ 系列简介 | 编辑简介段落 | H1 + 短描述 + N books + 年份跨度 chip + 流派 chip | **95%** | 无编辑级长简介（无合规数据源，不伪造）；结构信息等价 |
| B2 | 每书卡：封面+书名+作者+评分+出版年+简介预览(More 展开)+Want to Read | 富卡片 | 行 = 封面+序号+书名+(年份)+一句话描述+勾选追踪+Find a copy | **90%** | 评分：无合规评分数据源（不伪造，0%→不计入）；简介预览已有（Wikidata 一句话）。追踪比 Want to Read 更轻 |
| B3 | Related Series 侧栏 | 同作者宇宙关联系列 | 「More series by author」+「If you like X, you'll love…」双区 | **100%** | 达标 |
| B4 | 排序：Book 1/2/2.5…（novella 插序） | position 小数位 | position REAL 支持小数序 | **100%** | 达标 |

## C. Goodreads 图书页（本批主攻差距）

| # | 标杆项 | 标杆做法 | 我们现状（批前） | 还原度（批前→批后） | 行动（R137） |
|---|---|---|---|---|---|
| C1 | 头部：大封面+书名+作者+系列位置(“The Mistborn Saga #1”) | 富头部 | 已有封面/书名/作者/Book N of M | 100% | — |
| C2 | Genres chips | 流派标签链接 | 无 | **0%→100%** | 加流派 chip 链到 /genres/{g} |
| C3 | Want to Read / 已读状态按钮 | 核心交互 | 无（只能回系列页勾选） | **0%→100%** | 加「I've read this」勾选，同步 localStorage 追踪（与系列页互通） |
| C4 | 本系列全部书目（Shop this series/系列导航） | prev/next + 系列链接 | 仅 prev/next 胶囊 | **50%→100%** | 加「All N books in {series}」横向封面条（当前书高亮）+ 全序链接 |
| C5 | About the author（头像+简介+Follow） | 作者卡 | 无 | **0%→100%** | 加作者卡：头像+bio+全书目链接（bio/photo_url 已有数据） |
| C6 | Readers also enjoyed（同类推荐） | 封面轮播 | 无 | **0%→100%** | 加同流派热门系列 3 卡（复用系列页 alsoLike 逻辑） |
| C7 | Ratings & Reviews / 社区 | UGC 社区 | 无 | **0%** | 产品边界：免登录隐私模型下无 UGC；不排期，记录为定位差异 |
| C8 | 注册墙弹窗（滚动后强制 Sign up） | 增长手段 | 无墙，全开放 | 反向超越 | 保持无墙（我们的差异化） |

## D. Goodreads 搜索

| # | 标杆项 | 标杆做法 | 我们现状（批前） | 还原度（批前→批后） | 行动（R137） |
|---|---|---|---|---|---|
| D1 | 结果行：封面+书名+作者链接+评分+版本数 | 富行 | 书目结果为纯文本行 | **60%→95%** | 加封面缩略图 + 书名直达 /book + 系列链接（评分仍无数据源） |

## 超越项（我们比标杆多做/做得更好）

1. **免登录隐私追踪**：无注册墙（对比 GR 强制弹窗）、进度/想读单纯 localStorage、导出/导入/清除自由。
2. **性能**：边缘 SSR TTFB ~0.25s、~30KB CSS、零追踪 cookie；BSIO/GR 均为多 MB 页面 + 广告/追踪脚本。
3. **My Shelf 生态**：up-next、阅读节奏图、年度目标、Year in Books 分享卡、Saved 分享链接 — 两家标杆的 SEO 站形态均无。
4. **无广告/无联盟码**、暗色模式、axe 0 违规基线、44px 触控目标。
5. **开放分发**：JSON API、RSS、OpenSearch、llms.txt、IndexNow — 标杆均无。

## 数据边界备注（不伪造红线）

- 评分/评论、编辑级长简介、叙事时间线顺序、角色索引：无合规可复制数据源，明确不做或降级处理，不以生成内容冒充真实数据。
- Goodreads 登录后流程（书架管理等）被注册墙隔离，未走查；对应能力以我们的 localStorage 追踪对位。
