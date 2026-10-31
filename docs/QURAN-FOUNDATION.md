# WIRD v4 — Quran Foundation integration

## Official developer references
- https://quran.com/ar/developers
- https://api-docs.quran.foundation/docs/quickstart/
- https://api-docs.quran.foundation/docs/api-reference/
- https://api-docs.quran.foundation/docs/tutorials/fonts/page-layout/

## Architecture decision
The Quran Foundation Content/Search APIs require an OAuth2 `client_id` and confidential `client_secret`. Never place these in browser JavaScript, a public GitHub repo, or a checked-in asset.

When developer credentials and permissions have been issued, create a Cloudflare Worker server endpoint with `QF_CLIENT_ID` and `QF_CLIENT_SECRET` as encrypted Secrets. Request `client_credentials` with scope `content`, cache tokens, and forward approved content/search requests with `x-auth-token` and `x-client-id`. Follow rate limits, source attribution and redistribution terms. Do not impersonate Quran.com.

## Offline requirement
Do not make the Mushaf or Hisn reader depend on runtime API calls. Keep verified Quran text and Hisn chapters in the published static files; acquire permitted tafsir, word meanings, line layouts, translations and audio for offline use only when the licensing and package sizes are established. Offline audio must have an explicit downloadable package and completion checks.

## Current implementation
WIRD v4 contains unified brand CSS, icon and sharing metadata, existing Quran reader, offline Quran data, Hisn chapter reader and personal audio file playback. Quran Foundation authentication and content APIs are **not connected yet**; no credentials are present. The precise printed 15-line Madinah Mushaf is also **not implemented yet**. Make no claim that it is.

## QA acceptance before production complete
- 114 surahs, 6236 verses, 604 pages and full line dataset verification
- verse-end glyph and fonts from the same edition
- chapter/ayah navigation; search and bookmark accuracy
- responsive Chrome/Firefox/Safari, real devices, dark/light
- offline after close/reopen and browser restart
- downloadable recitation packages with licensing and integrity checks
- screenreader semantics and Arabic typesetting
