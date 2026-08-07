# Visual / Brand Teardown — R108 专项（视觉·品牌·特效升级）

日期：2026-08-05 · 方法：Playwright 抓取 10 家阅读类标杆站的完整 HTML + 首屏截图 +
computed style（字体/字号/行高/配色），存于 `research/visual/`。红线遵守：不绕反爬、
不盗用受版权素材/代码；闭源站只学习结构与思路，落地全部自研重制；开源资源注明许可。

## 抓取清单与关键发现（均为直接观察）

| 站点 | 栈指纹 | 排版 | 视觉语言要点 |
|---|---|---|---|
| literal.club | Next.js + motion | 正文 Inter 14px；H1 Libre Baskerville 40px serif | 白底 + 深绿 accent；**倾斜书封拼贴 hero**（真实封面、随机小角度旋转、hover 直立）；serif 标题 + sans 正文对比 |
| oku.club | Next.js + motion | 正文 Inter；hero 大号 serif | 极简留白；**手绘线稿插画**（人+书架）；黑白 + 少量色彩；圆角按钮 |
| standardebooks.org | 自研 SSR | **正文即 serif（Crimson Pro 19px）**；H1 League Spartan | 米白纸感底色 (#f1f1f0 系)；出版级排版；书卷气最强 |
| italictype.com | 自研 | H1 Portrait serif 57px | **米黄纸底 (#f5f2ea) + 陶土橙 accent**；分屏 hero；「No ads. Just books.」情绪文案 |
| press.stripe.com | 自研 + vite | Ivar serif 全站 | 深棕近黑底 (#201819)；3D 书脊堆叠；戏剧化但克制 |
| readwise.io | vite | 正文 Mulish；H1 Charter serif | 功能型 SaaS 排版；serif 标题点缀 |
| bookshop.org | 自研 | system-ui | 电商网格；实用为主，可学点少 |
| nytimes.com/books | 自研 | Times/Cheltenham | 报纸级 serif 排版层次 |
| basmo.app | WP + motion | Open Sans/Palanquin | 移动 App 营销页，渐变+插画 |
| beanstalkbooks.com | Next.js | Poppins | Shopify 电商风，参考价值低 |

## 提炼的共性优点（将整合复刻）

1. **Serif 标题 + 温暖纸感底色** 是高质感阅读产品的共同语言（SE/Italic Type/Literal/Stripe Press）。我们已有 Fraunces+米白，但纸感不足、层次平。
2. **倾斜书封拼贴**（Literal）：用真实封面做 hero 装饰，直接传达"书的世界"，我们有 1,198 个系列封面可用。
3. **手绘线稿插画**（Oku）：空状态/hero 的人文温度，避免图库脸。自研 SVG 线稿重制。
4. **纸张纹理/材质感**（SE/Stripe Press）：极低对比度 grain 纹理即可显著提升"印刷品"质感。
5. **微动效克制**：Literal/Oku 用 motion 但只做 hover 直立、淡入；无长动画。全部需 `prefers-reduced-motion` 降级。

## 技术栈评估（第 3 条指令）

- **shadcn/ui**：基于 React/Radix。本站是边缘 SSR + 零框架客户端（核心性能优势，JS < 12KB vs 竞品 200KB+），引入 React 仅为按钮/下拉样式收益为负。**采纳其设计令牌纪律与组件视觉规范（radius/shadow/focus ring 体系），不迁移框架。**
- **Tailwind**：已在 v4（最新主版本），保持。
- **Motion/GSAP**：站内动效为 hover/淡入/勾选反馈级别，CSS transitions + 一个 IntersectionObserver（<30 行）即可覆盖，无需 18–60KB 动效库。**不引入**，记录为「有明确收益才迁移」的否决结论。
- **字体**：Fraunces（SIL OFL）保留并加载 italic 轴用于强调；正文保持 Inter（UI 密度高的目录页 serif 正文会降低扫读效率——与 SE 纯阅读场景不同）。

## 落地清单（R108–R112）

- R108 调研落库（本文档）+ 设计方案定稿
- R109 全局质感升级：纸张 grain 纹理（内联 SVG data-URI，light/dark 变体）、卡片 hover 抬升+封面微倾、按钮/焦点环令牌统一、勾选 pop 反馈、滚动淡入（IO + reduced-motion 降级）
- R110 首页 hero 复刻升级：Fraunces italic 强调词 + 倾斜真实书封拼贴条（Literal 式，自研实现）
- R111 品牌素材：favicon/logo 重绘（书+琥珀书签绸带）、OG 品牌卡重制、/shelf 与搜索空状态自研线稿插画（Oku 式）
- R112 线上回归：375px、axe light/dark、性能预算（CSS/JS 体积与部署前对比）、记录 iteration-log

素材许可：所有插画/图标/纹理均为本仓库自研 SVG；字体 Google Fonts（OFL）。无第三方受版权素材。
