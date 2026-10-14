import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const output = 'dist';
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
const isPublic = name => /\.(html|css|js|png|jpe?g|webp|svg|gif|mp4|webm|pdf|xml|txt|ico)$/i.test(name);
for (const name of readdirSync('.')) {
  if (name === 'dist' || name === 'node_modules' || name === '.git' || name === '.vercel') continue;
  if (statSync(name).isDirectory()) {
    if (name === 'projects' || name === 'blog' || name === 'assets') cpSync(name, join(output, name), { recursive: true });
  } else if (isPublic(name)) {
    cpSync(name, join(output, name));
  }
}
const required = [
 'index.html', 'site.css', 'projects/index.html', 'blog/index.html',
 'assets/blog/what-search-console-can-and-cannot-tell-you.webp',
 'assets/blog/algorithm-updates-vs-seo-fundamentals.webp',
 'assets/blog/organic-leads-start-with-the-page.webp',
 'assets/blog/ga4-event-is-not-always-a-lead.webp',
 'assets/blog/google-ads-after-the-click.webp',
 'assets/blog/lsa-is-also-a-customer-service-system.webp',
 'assets/blog/ai-does-not-replace-reviewing-code.webp',
 'assets/blog/wordpress-is-more-than-a-mockup.webp',
 'assets/blog/aura-check-daily-game-development.webp',

 'projects/peak-leads-blueprint/index.html','projects/aura-check/index.html',
 'projects/rc-premium-detailing/index.html','projects/logic-lc/index.html',
 'projects/search-conversion-measurement/index.html','projects/nexa-architects/index.html',
 'blog/what-search-console-can-and-cannot-tell-you/index.html',
 'blog/algorithm-updates-vs-seo-fundamentals/index.html',
 'blog/organic-leads-start-with-the-page/index.html',
 'blog/ga4-event-is-not-always-a-lead/index.html',
 'blog/google-ads-after-the-click/index.html',
 'blog/lsa-is-also-a-customer-service-system/index.html',
 'blog/ai-does-not-replace-reviewing-code/index.html',
 'blog/wordpress-is-more-than-a-mockup/index.html',
 'blog/aura-check-daily-game-development/index.html',
 'Zachary-Clint-Swanepoel-CV-2026.pdf', 'zach profile.jpg',
];
for (const file of required) if (!existsSync(join(output,file))) throw new Error('Missing required public file: '+file);
console.log('Verified '+required.length+' critical public files, including homepage, CV, projects and articles.');
console.log('Static output ready: '+output);
