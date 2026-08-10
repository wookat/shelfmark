import asyncio
from playwright.async_api import async_playwright

TARGETS = [
    ("hardcover-home", "https://hardcover.app/"),
    ("storygraph-home", "https://app.thestorygraph.com/"),
    ("fictiondb-series", "https://www.fictiondb.com/series/discworld~terry-pratchett~4650.htm"),
    ("librarything-series", "https://www.librarything.com/nseries/1187/Discworld"),
    ("fantasticfiction-author", "https://www.fantasticfiction.com/p/terry-pratchett/"),
]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp("http://localhost:29229")
        ctx = browser.contexts[0]
        page = await ctx.new_page()
        for name, url in TARGETS:
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=45000)
                await page.wait_for_timeout(15000)
                html = await page.content()
                title = await page.title()
                open(f"{name}.html", "w").write(html)
                await page.screenshot(path=f"{name}.png", full_page=False)
                print(name, repr(title), len(html))
            except Exception as e:
                print(name, "ERR", str(e)[:120])
        await page.close()

asyncio.run(main())
