#!/bin/bash
# Submit all sitemap URLs to IndexNow.
set -e
HOST=shelfmark.zalize.com
KEY=2e7b4ccf708e4207beb4cfd1e0c7ddf2
urls=$(for i in 1 2; do curl -s "https://$HOST/sitemaps/$i.xml" | grep -oP '(?<=<loc>)[^<]+'; done)
echo "$urls" | python3 -c "
import json,sys,urllib.request
urls=[u.strip() for u in sys.stdin if u.strip()]
body=json.dumps({'host':'$HOST','key':'$KEY','urlList':urls}).encode()
req=urllib.request.Request('https://api.indexnow.org/indexnow',data=body,headers={'Content-Type':'application/json; charset=utf-8'})
print(urllib.request.urlopen(req).status,len(urls))
"
