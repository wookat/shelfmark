#!/bin/bash
# Submit all sitemap URLs to IndexNow (batched, 8K per request).
set -e
HOST=shelfmark.zalize.com
KEY=2e7b4ccf708e4207beb4cfd1e0c7ddf2
urls=$(for i in $(seq 1 6); do curl -s "https://$HOST/sitemaps/$i.xml" | grep -oP '(?<=<loc>)[^<]+'; done)
echo "$urls" | python3 -c "
import json,sys,urllib.request
urls=[u.strip() for u in sys.stdin if u.strip()]
for i in range(0,len(urls),8000):
    batch=urls[i:i+8000]
    body=json.dumps({'host':'$HOST','key':'$KEY','urlList':batch}).encode()
    req=urllib.request.Request('https://api.indexnow.org/indexnow',data=body,headers={'Content-Type':'application/json; charset=utf-8'})
    print(urllib.request.urlopen(req).status,len(batch))
"
