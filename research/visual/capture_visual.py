import asyncio, json
from playwright.async_api import async_playwright

SITES = [
    ("literal", "https://literal.club"),
    ("oku", "https://oku.club"),
    ("standard-ebooks", "https://standardebooks.org"),
    ("nytimes-books", "https://www.nytimes.com/books/best-sellers/"),
    ("bookshop", "https://bookshop.org"),
    ("italic-type", "https://www.italictype.com"),
    ("stripe-press", "https://press.stripe.com"),
    ("readwise", "https://readwise.io"),
    ("basmo", "https://basmo.app"),
    ("bookshelf-shopify", "https://www.beanstalkbooks.com"),
]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for name, url in SITES:
            try:
                pg = await b.new_page(viewport={"width": 1440, "height": 900})
                await pg.goto(url, wait_until="domcontentloaded", timeout=30000)
                await pg.wait_for_timeout(4000)
                html = await pg.content()
                open(f"research/visual/{name}.html", "w").write(html)
                await pg.screenshot(path=f"research/visual/{name}.png", full_page=False)
                # extract computed typography/colors of body & h1
                info = await pg.evaluate("""()=>{
                  const pick=(el)=>{if(!el)return null;const c=getComputedStyle(el);return{font:c.fontFamily.slice(0,80),size:c.fontSize,weight:c.fontWeight,lh:c.lineHeight,color:c.color,bg:getComputedStyle(document.body).backgroundColor};};
                  return {body:pick(document.body),h1:pick(document.querySelector('h1'))};
                }""")
                print(name, "OK", json.dumps(info)[:220])
                await pg.close()
            except Exception as e:
                print(name, "ERR", str(e)[:100])
        await b.close()

asyncio.run(main())
