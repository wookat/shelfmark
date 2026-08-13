# Shelfmark Iteration 1c — apex archive.org CSP fix (one check)

1. Hard-reload /series/discworld. Install `securitypolicyviolation` listener, then reload again.
   - Pass: screenshot shows covers visibly rendered (incl. Mort & Wyrd Sisters, which were blocked before); console count: ~46 imgs in DOM, all `naturalWidth>0`, 0 CSPV img-src events.
   - Fail signature (previous broken state): only 9 imgs remain, CSPV img-src events fire for covers.openlibrary.org URLs.
