import asyncio, sys
from playwright.async_api import async_playwright

TARGETS = [
    ("goodreads-home", "https://www.goodreads.com/"),
    ("goodreads-series", "https://www.goodreads.com/series/49075-the-stormlight-archive"),
    ("storygraph-home", "https://app.thestorygraph.com/"),
    ("hardcover-home", "https://hardcover.app/"),
    ("hardcover-series", "https://hardcover.app/series/discworld"),
    ("fantasticfiction-author", "https://www.fantasticfiction.com/p/terry-pratchett/"),
    ("fictiondb-series", "https://www.fictiondb.com/series/discworld~terry-pratchett~4650.htm"),
    ("librarything-series", "https://www.librarything.com/nseries/1187/Discworld"),
    ("bookseries-org", "https://www.bookseries.org/"),
    ("bsio-home", "https://www.bookseriesinorder.com/"),
    ("bio-series", "https://booksinorder.io/series/discworld"),
    ("rol-home", "https://www.readingorderlist.com/"),
]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp("http://localhost:29229")
        ctx = browser.contexts[0]
        page = await ctx.new_page()
        for name, url in TARGETS:
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=45000)
                await page.wait_for_timeout(4000)
                html = await page.content()
                open(f"{name}.html", "w").write(html)
                await page.screenshot(path=f"{name}.png", full_page=False)
                print(name, "ok", len(html))
            except Exception as e:
                print(name, "ERR", str(e)[:120])
        await page.close()

asyncio.run(main())
