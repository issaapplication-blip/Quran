# المصحف الشريف — دليل التطوير والإصدار

Last reviewed: 2026-11-23

## Project boundaries

- This is an independent Arabic RTL offline-first PWA.
- It is not part of RAFIQ and must not connect to RAFIQ's Supabase project.
- No paid APIs, analytics trackers, external font CDNs, or remote runtime dependencies are to be introduced without a separately reviewed decision.
- User reading state, bookmarks, adhkar progress, and preferences remain local unless the owner explicitly approves a data-sync design.
- Preserve the canonical Tanzil Uthmani source file. Its expected SHA-256 is:
  `9cf746b2c7501b4497d5db95589b99feab1e641a04bf1856c55a74cba39ecbf3`.

## Local verification

Requirements: Node.js 22 or later. No package installation is needed for the current test suite.

```sh
node --check app.js
node --check features.js
node --check sw.js
npm test
npm run test:e2e
```

The unit suite checks the Quran source checksum, 604-page/30-juz metadata, adhkar data, Arabic RTL manifest, reader controls, and JavaScript syntax. The E2E smoke test starts the local static server and verifies critical assets, content types, service-worker cache headers, and the Quran checksum over HTTP.

## Change policy

1. Keep text-source, page metadata, and adhkar-source changes separate from UI refactors.
2. Never normalize, rewrite, or regenerate the canonical Quran text as part of formatting or build steps.
3. For every reader, prayer-time, or Qibla change, document the calculation/source assumptions and test boundary cases.
4. Ask for location permission only after an explicit user action. Do not transmit coordinates.
5. Keep offline operation and service-worker cache behavior in regression tests.
6. Use focused branches and PRs. Do not deploy a preview or production release as a side effect of a GitHub merge.
7. Report tests actually run; do not claim browser/device validation unless performed on a real browser/device.

## Release checklist

- [ ] Unit tests pass.
- [ ] Local HTTP E2E smoke test passes.
- [ ] Quran SHA-256 remains unchanged.
- [ ] No new external runtime request or tracking endpoint.
- [ ] RTL, keyboard, small-screen, and offline paths are reviewed.
- [ ] Prayer-time method and Qibla sensor fallbacks are documented.
- [ ] Service-worker cache version is updated when static assets change.
- [ ] Production deployment is separately approved.
