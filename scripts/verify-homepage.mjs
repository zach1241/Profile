import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPricing } from '../render-pricing.mjs';

// Run after node build.mjs. Checks the delivered output, not just source markup.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const baseline = process.env.HOMEPAGE_BASE_COMMIT || 'd954e79';
const origin = 'https://www.localpresence360.com';
const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).trim();
const read = file => readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const html = read(join(dist, 'index.html'));
const source = read(join(root, 'index.html'));
const pricing = JSON.parse(read(join(root, 'agency-pricing.json')));
const normalize = value => value.replace(/\r\n/g, '\n');
assert.equal(html, normalize(source.replace('<!-- PRICING_SERVER_RENDER -->', renderPricing(pricing))), 'Build is stale or pricing was not injected correctly');

function attrs(source) {
  return Object.fromEntries([...source.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)].map(match => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '']));
}
function tags(markup) {
  const clean = markup.replace(/<!--[\s\S]*?-->/g, '').replace(/(<(script|style)\b[^>]*>)[\s\S]*?<\/\2\s*>/gi, '$1');
  return [...clean.matchAll(/<([a-z][\w:-]*)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi)].map(match => ({ name: match[1].toLowerCase(), attrs: attrs(match[2]) }));
}
const elements = tags(html);
const ids = elements.filter(element => element.attrs.id).map(element => element.attrs.id);
assert.equal(new Set(ids).size, ids.length, 'Duplicate IDs in generated homepage');
assert.equal(elements.filter(element => element.name === 'h1').length, 1, 'Homepage should have one h1');
for (const element of elements) {
  if (element.name === 'img') {
    assert.ok('alt' in element.attrs, `Image is missing alt: ${element.attrs.src}`);
    assert.ok(element.attrs.width && element.attrs.height, `Image has no intrinsic dimensions: ${element.attrs.src}`);
  }
  for (const id of (element.attrs['aria-controls'] || '').split(/\s+/).filter(Boolean)) assert.ok(ids.includes(id), `aria-controls target is missing: ${id}`);
  for (const id of (element.attrs['aria-labelledby'] || '').split(/\s+/).filter(Boolean)) assert.ok(ids.includes(id), `aria-labelledby target is missing: ${id}`);
}

let referenceCount = 0;
const checkedCss = new Set();
function targetFor(url) {
  const target = resolve(dist, '.' + decodeURIComponent(url.pathname));
  assert.ok(target === dist || target.startsWith(dist + sep), `Reference escapes public output: ${url.href}`);
  if (existsSync(target) && statSync(target).isFile()) return target;
  if (existsSync(join(target, 'index.html'))) return join(target, 'index.html');
  return null;
}
function checkReference(value, from, checkFragment = false) {
  if (!value || /^(?:data:|mailto:|tel:|blob:)/i.test(value)) return;
  const fromPath = '/' + relative(dist, from).split(sep).join('/').replace(/index\.html$/, '');
  const url = new URL(value.replace(/&amp;/g, '&'), origin + fromPath);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`Unsupported reference: ${value}`);
  if (!['localpresence360.com', 'www.localpresence360.com'].includes(url.hostname)) return;
  const target = targetFor(url);
  assert.ok(target, `Missing local reference ${value} from ${relative(dist, from)}`);
  referenceCount++;
  if (checkFragment && url.hash && extname(target) === '.html') {
    const destinationIds = new Set(tags(read(target)).map(element => element.attrs.id).filter(Boolean));
    assert.ok(destinationIds.has(decodeURIComponent(url.hash.slice(1))), `Missing anchor ${value}`);
  }
  if (extname(target) === '.css' && !checkedCss.has(target)) {
    checkedCss.add(target);
    for (const match of read(target).matchAll(/url\(\s*['"]?([^'"\)]+)['"]?\s*\)/g)) checkReference(match[1], target);
  }
}
for (const { name, attrs: a } of elements) {
  if (a.src) checkReference(a.src, join(dist, 'index.html'));
  if (a.href && !(a.href === '#' && 'hidden' in a)) checkReference(a.href, join(dist, 'index.html'), name === 'a');
}

const sections = elements.filter(element => element.name === 'section' && element.attrs.id).map(element => element.attrs.id);
assert.equal(sections[sections.indexOf('work') + 1], 'pricing', 'Pricing must appear directly below projects');
assert.equal(pricing.categories.length, 3, 'Expected three pricing categories');
assert.equal(elements.filter(element => 'data-inquiry-plan' in element.attrs).length, 9, 'Expected nine actionable plans');
for (const category of pricing.categories) {
  assert.equal(category.tiers.length, 3, `Expected three tiers for ${category.id}`);
  assert.ok(html.includes(`id="panel-${category.id}"`), `Missing pricing panel ${category.id}`);
  assert.ok(html.includes(`id="tab-${category.id}"`), `Missing pricing tab ${category.id}`);
  for (const tier of category.tiers) {
    assert.ok(html.includes(tier.name), `Missing plan ${tier.name}`);
    assert.ok(html.includes(tier.price), `Missing price for ${tier.name}`);
  }
}
assert.ok(html.includes('does not submit data to a website server'), 'Email draft behavior needs its user-facing explanation');
assert.ok(elements.some(element => element.name === 'input' && element.attrs.name === 'email' && element.attrs.type === 'email' && 'required' in element.attrs), 'Inquiry email field must validate email syntax');

const allowedChanges = new Set(['index.html', 'agency-pricing.json', 'agency.js', 'render-pricing.mjs', 'agency-home.css']);
for (const path of git('diff', '--name-only', baseline, '--').split('\n').filter(Boolean)) {
  assert.ok(allowedChanges.has(path) || path.startsWith('assets/home/') || path.startsWith('scripts/') || /(?:^|\/)(?:HOME[^/]*|README)\.md$/i.test(path), `Existing unrelated file changed: ${path}`);
}
const tracked = git('ls-tree', '-r', '--name-only', baseline).split('\n');
let preserved = 0;
for (const path of tracked) {
  if (!/\.(?:html|css|js|png|jpe?g|webp|svg|gif|mp4|webm|pdf|xml|txt|ico)$/i.test(path)) continue;
  if (path.includes('/') && !/^(?:assets|projects|blog|portfolio|founder)\//.test(path)) continue;
  assert.ok(existsSync(join(dist, path)), `Existing public file disappeared from output: ${path}`);
  preserved++;
}
console.log(`Homepage verified: ${referenceCount} local references, ${ids.length} unique IDs, 9 plans in 3 tabs, and ${preserved} preserved public files from ${baseline}.`);
