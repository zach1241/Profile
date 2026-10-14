# Local Presence 360

A new Astro-powered portfolio, project case study and insights website for Zachary Swanepoel. The original GitHub Pages index.html and portfolio media remain on main.

## Run locally

```bash
npm install
npm run dev
npm run build
```

## Deployment

Import `zach1241/Profile` into Vercel, select the new website branch for preview, framework Astro, install `npm install`, build `npm run build`, output `dist`. To go live from main, merge the PR, then ensure the production branch is main. Add `localpresence360.com` and `www.localpresence360.com` in Vercel Project Settings > Domains. At HostAfrica, use the exact DNS records requested by Vercel; keep existing MX/TXT records intact. Do not create an empty DNS zone without verifying the domain's authoritative nameservers and existing records.

## Content

Edit `src/data/site.js`: `projects` contains project pages; `articles` contains articles and opinion sections. Every entry creates a statically rendered, crawlable route. Only publish case studies with necessary client permission. Current examples avoid unverified performance figures.

## SEO

Canonical URLs, metadata, social previews, sitemap and robots are included. Confirm publication dates, verify factual claims and replace placeholder project previews before production. Add Search Console / GA4 only after their ownership details are available.
