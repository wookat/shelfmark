# Shelfmark 合规与安全审计（Gate 4）

日期：2026-08-05 ｜ 审计对象：shelfmark.zalize.com（PR #1，commit 见分支 devin/1754425000-shelfmark-v1）

## 合规

| 项 | 结论 | 证据/说明 |
|---|---|---|
| 数据版权 | ✅ 合规 | 目录数据全部来自 Wikidata（CC0）SPARQL 导出；仅使用书名/作者/系列/年份等事实性元数据，不含受版权保护的封面、简介文本。/about 页公开注明数据来源与纠错渠道。 |
| Cookie/追踪 | ✅ 合规 | 全站 0 cookie；阅读进度仅存 localStorage（不上传）；统计仅记录 `day+path` 计数（无 IP、无 UA、无指纹、无标识符），属无须 Cookie 同意横幅的最小化统计。 |
| 隐私政策 | ✅ 已上线 | /privacy 说明 localStorage、统计、邮箱用途与退订方式（mailto）。 |
| 邮箱收集 | ✅ 合规 | 单一明确用途（新书提醒），最小化存储（email+source+时间），未接任何第三方营销工具。改进项：正式发信前需加 double opt-in 与退订链接（round 2）。 |
| 支付 | N/A | 免费模式，无收款代码路径。 |
| EU AI Act / 未成年人 | N/A | 无 AI 生成内容、无 UGC、无账号体系。 |

## 安全

| 项 | 结论 | 证据/说明 |
|---|---|---|
| SQL 注入 | ✅ | 全部 D1 查询用 `.bind()` 参数化；搜索词中 `%_` 通配符被替换。 |
| XSS | ✅ | 所有动态内容经 `esc()` HTML 转义；JSON-LD 输出 `<` 转义为 `\u003c` 防 `</script>` 逃逸（本轮修复）；客户端 shelf 渲染用 `escapeHtml()`。 |
| API 滥用 | ⚠️ 可接受 | /api/subscribe 有格式与长度校验 + `INSERT OR IGNORE` 去重；/api/hit 限定 path 前缀与长度。无速率限制（Cloudflare 免费 WAF 兜底），round 2 可加 KV 限流。 |
| 秘密管理 | ✅ | 仓库无任何 token/key（IndexNow key 本身设计上即公开）；部署凭证仅存于 Devin secrets。 |
| 传输安全 | ✅ | 全站 HTTPS（Cloudflare 托管证书），HTTP 自动跳转。 |
| 依赖供应链 | ✅ | 运行时仅 hono；构建期 tailwindcss/wrangler/typescript 均为主流成熟版本。 |

## 遗留项（非阻塞）
1. 邮件发送上线前补 double opt-in + 退订链接（P1，发信前必须）。
2. /api/* 速率限制（P2）。
3. Security headers（CSP/Referrer-Policy）可加严（P2）。
