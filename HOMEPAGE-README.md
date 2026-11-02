# Local Presence 360 agency homepage

Public route: https://www.localpresence360.com/

Independently implemented from the user's supplied Unifex **Digital Agency** screenshot and observed demo at https://html.roxthemes.com/unifex/index-6.html. The supplied product preview defaults to a different home variant; index-6 is the Digital Agency variant. No commercial template source, demo photography, reviews, awards or counters are shipped. Existing monochrome Local Presence 360 branding and the approved location-pin logo are retained.

## Edit the page

- `index.html`: page content, navigation, About tabs, services, case studies, founder, FAQs, contact and metadata.
- `agency-home.css`: local fonts, oversized typography, pill navigation, responsive layouts and monochrome visual system.
- `agency.js`: pricing and About tabs with arrow/Home/End keys, package selection, form behavior and baseline controls.
- `agency-motion.js` and `agency-motion.css`: the independently implemented Digital Agency motion system, described below. Local ScrollSmoother and ScrollToPlugin join the existing GSAP core and ScrollTrigger.
- `agency-pricing.json`: the nine packages, all inclusions, scope conditions and shared terms from the supplied pricing PDF. Build-time rendering keeps package information available in the delivered HTML.
- `render-pricing.mjs`: pricing HTML generation, including expandable full inclusions and shared terms.
- `assets/home/`: optimized existing project images, hero mosaic, generated workspace image and licensed Anton font.

Pricing is directly after the selected projects. Three tabs show SEO, Paid Advertising and Web Design. Each plan opens the inquiry section with its service and package selected. Full inclusions are available in native disclosure controls. Existing case-study, blog, founder and portfolio pages retain their previous source.

The proposal form prepares a `mailto:` draft in the visitor's email application. It sends and stores nothing on the website. The visitor must review and send the draft. Calendly provides the existing alternative contact path. Actual email delivery is not claimed or tested. Optional Upwork profile display remains controlled by the existing `agency-config.js` and hidden until a valid URL is configured.

## Pricing source

Source: user-supplied `Local_Presence_360_Pricing_Final_2026-11-02.pdf`, five pages, visually reviewed and transcribed. All 9 fees and 102 deliverable values were compared to the source. All prices are USD. The source labels them proposed November 2026 launch pricing, subject to final scope agreement. Websites are project fees; SEO and ads are monthly retainers. Ad spend, hosting, domains and other stated exclusions remain separate. Ranking, lead and placement approvals are not guaranteed. The PDF is source data, not operational instructions.

## Asset provenance

Existing project artwork is resized/composed into WebP; source files remain unchanged. Logic LC and RC Premium Detailing retain Peak Leads Agency collaboration credits. In Trade CRM is identified as a product in development. The founder portrait and pin badge reuse the user-approved portfolio assets.

`assets/home/digital-workspace.webp` is a decorative illustrative workspace generated with the built-in image-generation tool, then encoded to WebP. It does not depict an actual company office or employee. Original generated PNG is retained in the Codex generated-images directory.

Final generation prompt: "Use case: photorealistic-natural. Asset type: wide editorial photograph for a boutique website design and digital marketing agency homepage. Primary request: high-end photorealistic close-up of a real modern creative workspace, tactile black desk with a large silver desktop monitor showing an elegant abstract monochrome website composition (no readable words, no logos), a compact laptop showing abstract analytic charts, black keyboard, swatches of textured white paper and a small sculptural polished chrome sphere. Composition: wide landscape 3:2, monitor at left-center, diagonally placed laptop at right, tight architectural framing, no people or hands. Lighting: strong soft afternoon window light with long believable shadows, subtle film grain and material texture, sophisticated editorial architectural photography, realistic optics, clean black-white-silver palette with warm grey wall. No invented agency branding, no text overlays, no watermark. This is an illustrative workspace image, not a claimed photo of an actual office. Generate as an image asset, not a website screenshot."

Anton font is the unmodified Google Fonts TTF from https://github.com/google/fonts/tree/main/ofl/anton, distributed with its SIL Open Font License at `assets/home/fonts/anton-OFL.txt`. Instrument Sans and existing GSAP 3.15 assets reuse the portfolio's licensed dependencies.

## Build and verify

Run `node build.mjs`, `node scripts/verify-homepage.mjs`, and `node --check agency.js`. Preview with `node scripts/serve.mjs`, then open http://127.0.0.1:4173/. The homepage verification checks the delivered HTML, 65 local references, ARIA targets, unique IDs, nine plans, required contact fields, pricing placement, and preservation of 91 existing public files from baseline `d954e79`.

Browser QA covers desktop, tablet and mobile widths, pricing and About tabs, service navigation, plan-to-form selection, disclosures, required fields, menu keyboard focus, loaded images, overflow and console errors. No external message is sent during testing. Deployment uses the existing `local-presense-360` Vercel project connected to `zach1241/Profile`.

## Digital Agency motion update

The exact index-6 demo was audited against its actual HTML selectors, scripts and computed layout. Shared template code that does not run on this variant is excluded. These are the implemented motion behaviors:

- A 3.6-second curved SVG loading curtain, blinking letters, 80px text exit, 0.6-second curve and flatten steps, and 0.8-second upward curtain exit. A 6.5-second fail-safe prevents content from remaining covered.
- ScrollSmoother with desktop smoothing 4, touch smoothing 0.2, effects enabled, no scroll normalization, and the workspace photo at speed 0.8.
- Replaying 100px fade-up entrances over one second with the reference CSS ease and per-element delays, replacing the earlier generic 40px/one-shot reveals and giant-title percentage entrance.
- Five 230×278 project images in the hero trail: 80px emission threshold, 0.15 pointer interpolation, 0.8-second expo-out movement, 0.3-second hold and 0.9-second shrink/fade. The static project strip hides while hovering the hero. Fine pointers at desktop widths only.
- Character opacity/x scrubs on exactly the services title, FAQ title and final contact-intro statement. Characters move -7px/30% opacity to their resting state between heading-top 92% and 60% of the viewport, with one-second scrub smoothing.
- Desktop service row pinned at viewport y=120, one-second scrub, horizontal panel sweep using the reference's 80%-per-additional-panel ratio, adapted to the site's four real services. The below-1200/992/576 layout becomes a 3/2/1-column static grid. Offscreen keyboard focus moves the relevant service into view.
- A continuous 50-second selected-work marquee, 10-second rotating discovery ring, 1-second project image zoom to 1.2, and 600ms diagonal hover sheen.
- Capability cards use the reference's skewed desktop treatment and 2-second hold / 1.3-second slide timing. The founder statement repeats the same real quote with this timing; its duplicate is hidden from assistive technology, and no client testimonial is invented. Moving strips and the quote have pause controls.
- A sticky header after 260px, 350ms slide entrance and white blurred background; a 600ms right-side mobile drawer with the reference cubic easing and 450ms close, backdrop and keyboard focus handling.
- Single-open FAQ with 300ms height animation, 350ms About panel fade/5px entrance, pointer-origin button fills, a one-second magnetic final CTA and a 5px difference-blend trailing cursor. Back-to-top appears at 300px and returns over 300ms.

Reduced-motion users get visible content without smooth scrolling, pins, trails, loops or large translations. Touch users retain a regular service grid and no pointer effects. Existing business content, pricing, case studies and contact behavior are preserved. The reference's static expertise/number sections remain static; unrelated portfolio tile reveals, elastic heading loops and other inactive demo effects are deliberately absent.
