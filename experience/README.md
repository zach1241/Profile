# Agency experience portfolio

The three experience pages retain the site's static HTML/CSS/JavaScript architecture. There are no new runtime dependencies.

## Content and screenshots

`projects.json` is the structured agency/client mapping. It records the documented contribution, verified business domain, identity evidence, capture date, screenshot key, skills and case-study links. Website identity checks do not establish design authorship or independently verify the owner's contribution.

All 17 current website previews (two agencies and 15 clients) were captured from live Chrome pages through Playwright on **16 November 2026**, using a **1440 × 900** desktop viewport. Fonts, visible images and initial animations were allowed to settle. The captures retain the source websites' branding and layout. WebP files and 800px variants are in `assets/experience/screenshots/`; none are generated mockups. Captions explicitly distinguish the current appearance from historical contributions.

ProCom uses an optimized copy of the existing `website-redesign.png` as its original project showcase, with the existing case study and Loom walkthrough. Its current public website capture is available in a separate disclosure. The status remains **Website Redesign — Awaiting Approval** as of November 2026.

Recover Pro and Viking Capital Group / G6 Group have clearly labelled empty previews. Their precise business attribution could not be confidently established; no candidate domain is linked or shown as their website. The documented contributions are retained.

All Roofing and Remodeling → True Line Roofing & Exteriors remains one rebrand engagement. The page describes SEO continuity and lead-generation challenges, not a proven successful migration. Peak Leads Blueprint is listed separately as internal agency software; the repository does not substantiate a public implementation walkthrough or technology stack, so none is invented.

## Build and verification

```sh
node scripts/render-experience.mjs --source
node build.mjs
node scripts/verify-experience.mjs
node scripts/serve.mjs
```

The first command updates the committed HTML from the mapping. The normal build also renders the pages into `dist/`, preserving the existing page heads, navigation, canonical URLs, footers and supporting case-study sections. It fails when a referenced screenshot is missing or a linked domain lacks verification. The verification script checks all three pages, local links and image variants, unique IDs, accessible image attributes, historical status labels and a 300KB maximum per screenshot file.

When recapturing a website, verify its identity again and update its `capturedDate`. Keep the current appearance separate from the historical work. Preserve unresolved identities rather than substituting a similarly named business.

`experience.js` progressively adds filters and scroll reveals. All contributions remain readable without JavaScript, and `prefers-reduced-motion` disables movement.
