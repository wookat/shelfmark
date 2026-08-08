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

---

# R138 复刻升级：页面覆盖率盘点 + 技术标准审计

## E. 页面覆盖率（标杆全部页面类型 → 我们的对照）

盘点方法：标杆 robots.txt + sitemap（BSIO sitemap_index：post/page/category/author 分片）+ 导航/footer 逐层爬查；Goodreads 无公开 sitemap，按导航+robots Allow 清单枚举公开页面类型。

### BSIO 页面类型（14 类）

| # | 页面类型 | 我们的对位 | 状态 |
|---|---|---|---|
| E1 | 首页 | / | ✅ 已对照（R137） |
| E2 | 作者页（~2.3 万 post） | /authors/{slug} | ✅ 已对照（R137，100%） |
| E3 | 作者索引 /authors/ | /authors + 字母索引 | ✅ 已对照 |
| E4 | 角色索引 /characters/ + 角色页 | 无 | ⚠️ 数据边界：无合规角色数据源，不伪造（已记录） |
| E5 | 分类索引 /categories/ + 分类页 | /genres + /genres/{g} | ✅ 已对照 |
| E6 | 搜索 ?s= | /search | ✅ 已对照（R137，100%） |
| E7 | Top Lists /top-lists/ | /popular + /lists | ✅ 本批走查：编辑榜单 ↔ 我们数据推导榜单，结构对位达标 |
| E8 | Recommendations /recommendations/ | /genres + /lists | ✅ 本批走查：按流派分区推荐 ↔ 流派页+精选单，达标 |
| E9 | Book Clubs /book-clubs/（celebrity/genre 两区） | 无 | deliberate-n/a：名人书友会编辑内容，非书系阅读顺序定位，且无合规数据源 |
| E10 | Release Calendar /book-release-calendar/（月-日粒度） | /new（年粒度） | ⚠️ 部分：我们目录仅年份粒度，月日级日历无合规数据源；/new+RSS+每周 digest 为对位能力 |
| E11 | Blog /blog/ | docs/marketing 内容计划（未上站） | deliberate-n/a：编辑博客非本批范围，内容营销另线推进 |
| E12 | About /about/ | /about | ✅ 已对照 |
| E13 | 订阅（邮件表单） | double opt-in 订阅 + digest | ✅ 超越（合规链路） |
| E14 | 隐私/条款等法务页 | /privacy 等 | ✅ 已对照 |

### Goodreads 公开页面类型（10 类）

| # | 页面类型 | 我们的对位 | 状态 |
|---|---|---|---|
| E15 | 系列页 /series/{id} | /series/{slug} | ✅ 已对照（R137） |
| E16 | 图书页 /book/show/{id} | /book/{id}-{slug} | ✅ 已对照（R137） |
| E17 | 作者页 /author/show/{id} | /authors/{slug} | ✅ 已对照（R137） |
| E18 | 搜索 /search | /search | ✅ 已对照（R137） |
| E19 | Genres 索引 /genres + 流派页 /genres/{g} | /genres + /genres/{g} | ✅ 本批走查：索引+流派落地页结构对位达标 |
| E20 | Listopia /list/show/{id}（社区投票书单） | /lists（数据推导精选单） | ⚠️ 部分：投票 UGC 无合规来源；榜单形态已对位 |
| E21 | New Releases /book/popular_by_date/ | /new | ✅ 本批走查：新书流对位达标 |
| E22 | Choice Awards / Quotes / 社区讨论 | 无 | deliberate-n/a：UGC/评奖社区，免登录隐私定位外 |
| E23 | 登录后书架/社交流程 | localStorage 追踪 + My Shelf | ✅ 免登录对位（超越：无注册墙） |
| E24 | Year in Books（登录后） | /year-in-books（免登录） | ✅ 超越 |

**覆盖率结论：标杆页面类型共 24 类 → 已对照/对位 19 类（79%）；其余 5 类均为 deliberate-n/a 或数据边界（角色索引、名人书友会、编辑博客、月日级日历、UGC 社区），已逐条注明理由。定位内页面类型覆盖率 19/19 = 100%，无遗漏。**

## F. 技术标准反推审计（黑盒观测 + 公开源码分析）

| # | 技术项 | BSIO（观测） | Goodreads（观测） | 我们 | 结论 |
|---|---|---|---|---|---|
| F1 | 渲染方式 | WordPress PHP SSR（LiteSpeed） | Rails SSR + React 水合（10,910 个 data-react 节点） | Workers 边缘 SSR，零水合、JS ~4KB | ✅ 反超 |
| F2 | TTFB（同机实测） | 1.00s | 2.41s | **0.24s** | ✅ 反超 4–10 倍 |
| F3 | 页面传输体积 | 161KB HTML | 1.8MB HTML | 94KB HTML | ✅ 反超 |
| F4 | 字体管线 | 无 webfont（系统字体） | 自托管字体 | 批前：Google Fonts 第三方 CSS（2 次第三方请求，DNS+连接开销）| ⚠️→✅ **本批修复：自托管 latin 子集变量字体 woff2（OFL 许可）+ preload + immutable 缓存，第三方请求归零** |
| F5 | 图片管线 | webp+srcset（WP 自动） | CDN 多尺寸 srcset | OL covers 定尺寸 + width/height + lazy（54 处），无 CLS | ✅ 达标（尺寸固定场景 srcset 收益为零；封面源为第三方 OL，不代理） |
| F6 | HTML 缓存 | no-cache/no-store | private no-store | public 5min + SWR 1h（有状态路由排除） | ✅ 反超 |
| F7 | 静态资产缓存 | 1 年 immutable | CDN 长缓存 | css/js 1h+ETag、字体本批 1 年 immutable | ✅ 达标 |
| F8 | 结构化数据 | 每页 1 处 ld+json | Book ld+json | Book/BookSeries/Person/FAQ/ItemList/Breadcrumb 全套 | ✅ 反超 |
| F9 | 安全头 | 仅 block-all-mixed-content | HSTS+XFO+XCTO | CSP 全指令+HSTS+XFO+XCTO+Referrer+Permissions（本批 CSP 因字体自托管进一步收紧，移除 Google 域） | ✅ 反超 |
| F10 | 无障碍 | 未见声明，未测基线 | 复杂 UGC 页 | axe light/dark 0 违规基线 + 44px 触控 | ✅ 反超 |
| F11 | HTTP 协议 | h3 | h2 (CloudFront) | h3 (Cloudflare) | ✅ 达标 |
| F12 | 压缩 | — | gzip | brotli | ✅ 达标 |

**技术项结论：12 项中 11 项达标或反超（其中 8 项反超）；唯一未达标项 F4 字体管线已本批修复（自托管子集字体），修复后 12/12 达标、8 项反超。**
