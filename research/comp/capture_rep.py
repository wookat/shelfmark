import asyncio
from playwright.async_api import async_playwright

TARGETS = [
    ("bsio-home", "https://www.bookseriesinorder.com/"),
    ("bsio-author-grisham", "https://www.bookseriesinorder.com/john-grisham/"),
    ("bsio-author-pratchett", "https://www.bookseriesinorder.com/terry-pratchett/"),
    ("bsio-characters", "https://www.bookseriesinorder.com/characters/"),
    ("bsio-char-jack-reacher", "https://www.bookseriesinorder.com/jack-reacher/"),
    ("bsio-categories", "https://www.bookseriesinorder.com/categories/"),
    ("bsio-search", "https://www.bookseriesinorder.com/?s=mistborn"),
    ("gr-series-stormlight", "https://www.goodreads.com/series/49075-the-stormlight-archive"),
    ("gr-series-discworld", "https://www.goodreads.com/series/40650-discworld"),
    ("gr-book-mistborn", "https://www.goodreads.com/book/show/68428.The_Final_Empire"),
    ("gr-author-sanderson", "https://www.goodreads.com/author/show/38550.Brandon_Sanderson"),
    ("gr-search", "https://www.goodreads.com/search?q=mistborn"),
]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp("http://localhost:29229")
        ctx = browser.contexts[0]
        page = await ctx.new_page()
        for name, url in TARGETS:
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=45000)
                await page.wait_for_timeout(3500)
                html = await page.content()
                open(f"research/comp/rep/{name}.html", "w").write(html)
                await page.screenshot(path=f"research/comp/rep/{name}.png", full_page=True)
                print(name, "ok", len(html))
            except Exception as e:
                print(name, "ERR", str(e)[:120])
        await page.close()

asyncio.run(main())
