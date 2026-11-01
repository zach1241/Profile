# Local Presence 360 portfolio

Public route: `https://www.localpresence360.com/portfolio/`.

This is an independently implemented static page based on the visual layout and observed motion of the Unifex Personal Portfolio demo at `https://html.roxthemes.com/unifex-prev/unifex/index-3.html`. No commercial template source or demo photography is shipped. Business copy, project images, CV and links come from the existing Local Presence 360 website. Portraits are the user's supplied reaction images from Drive's My Clients / Me folder, converted to WebP with original alpha preserved.

## Editing

- `portfolio/index.html`: content, project links, walkthroughs, contact details and metadata.
- `portfolio/portfolio.css`: layout, typography, responsive rules and surface styles.
- `portfolio/portfolio.js`: scrolling, reveals, menu, carousel and hover behavior.
- `portfolio/assets/photos/`: three transparent reaction portraits.
- `portfolio/assets/fonts/`: Google Fonts Phudu and Instrument Sans with OFL license files.
- `portfolio/assets/vendor/`: GSAP 3.15.0 and its ScrollTrigger, ScrollSmoother and ScrollToPlugin, from the official npm package. License: https://gsap.com/standard-license/.

The motion follows the reference's 4-second desktop smoothing, 0.2-second touch smoothing, character reveals, diagonal 3×3 image reveal, staggered service entrances, 50px/sec marquee, pinned WORKS backdrop, pointer-following previews, magnetic buttons and curtain preloader. Reduced-motion users receive static readable content. The walkthrough carousel uses real case studies in place of unverified testimonials; the capability rows replace unverified awards, and skill labels replace unsupported performance counters.

The contact form opens a populated email draft in the visitor's email application. It does not send or store submissions, and does not claim delivery. A Calendly link is also available.

## Build and verify

Run `node build.mjs`, then `node scripts/verify-portfolio.mjs`. The latter compares existing files with production commit `d03e376a6c5d8acb7b3183200091f1ef64d29536`, checks preservation of the existing site, and validates portfolio local links, images and metadata. Only the homepage's new Portfolio navigation item, sitemap route, and build inclusion are changed outside the new page.

For local preview run `node scripts/serve.mjs` after building, then open `http://127.0.0.1:4173/portfolio/`. Stop it with Ctrl+C.

The existing Vercel project is `local-presense-360`, linked to `zach1241/Profile`. The entire existing site's output remains part of every deployment.
