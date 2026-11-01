import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Run after `node build.mjs`. No dependencies or network requests are needed.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const baseline = process.env.PORTFOLIO_BASE_COMMIT || 'd03e376a6c5d8acb7b3183200091f1ef64d29536';
const origin = 'https://www.localpresence360.com';
const localHosts = new Set(['localpresence360.com', 'www.localpresence360.com']);
const failures = [];
const checkedReferences = new Set();
const checkedStyles = new Set();
const idCache = new Map();
const fail = message => failures.push(message);
const posix = path => path.split(sep).join('/');
const git = (...args) => execFileSync('git', ['-C', root, ...args], { maxBuffer: 100 * 1024 * 1024 });

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

function decode(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (_, entity) => {
    if (entity[0] === '#') return String.fromCodePoint(entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10));
    return { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' }[entity.toLowerCase()];
  });
}

function attributes(source) {
  const result = {};
  for (const match of source.matchAll(/([^\s=<>\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    result[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return result;
}

function tags(html) {
  const visible = html.replace(/<!--[\s\S]*?-->/g, '').replace(/(<(script|style)\b[^>]*>)[\s\S]*?<\/\2\s*>/gi, (_, opening, tag) => `${opening}</${tag}>`);
  return [...visible.matchAll(/<([a-z][a-z\d:-]*)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi)].map(match => ({ name: match[1].toLowerCase(), attrs: attributes(match[2]) }));
}

function pageUrl(path) {
  const webPath = '/' + posix(relative(dist, path));
  return new URL(webPath.replace(/index\.html$/, ''), origin);
}

function publicFile(url) {
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { return null; }
  const candidate = resolve(dist, '.' + pathname);
  if (candidate !== dist && !candidate.startsWith(dist + sep)) return null;
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  if (existsSync(candidate) && statSync(candidate).isDirectory() && existsSync(join(candidate, 'index.html'))) return join(candidate, 'index.html');
  if (!extname(candidate) && existsSync(candidate + '.html')) return candidate + '.html';
  return null;
}

function idsIn(path) {
  if (!idCache.has(path)) {
    const elements = tags(readFileSync(path, 'utf8'));
    idCache.set(path, new Set(elements.flatMap(({ name, attrs }) => [attrs.id, name === 'a' ? attrs.name : null]).filter(Boolean)));
  }
  return idCache.get(path);
}

function checkReference(value, from, label, checkFragment = false) {
  if (!value || /^(?:data:|blob:|mailto:|tel:)/i.test(value)) return;
  if (/^javascript:/i.test(value)) { fail(`${label}: JavaScript URL is not a navigable destination (${value}).`); return; }
  let url;
  try { url = new URL(value, pageUrl(from)); } catch { fail(`${label}: malformed URL ${value}.`); return; }
  if (!['http:', 'https:'].includes(url.protocol) || !localHosts.has(url.hostname)) return;
  const key = `${label}|${url.href}`;
  if (checkedReferences.has(key)) return;
  checkedReferences.add(key);
  const destination = publicFile(url);
  if (!destination) { fail(`${label}: local target is missing from dist (${value}).`); return; }
  if (checkFragment && url.hash && extname(destination).toLowerCase() === '.html') {
    let id;
    try { id = decodeURIComponent(url.hash.slice(1)); } catch { fail(`${label}: invalid anchor encoding (${value}).`); return; }
    if (!idsIn(destination).has(id)) fail(`${label}: target anchor #${id} does not exist in ${posix(relative(dist, destination))}.`);
  }
  if (extname(destination).toLowerCase() === '.css') checkCss(destination);
}

function checkCss(path) {
  if (checkedStyles.has(path)) return;
  checkedStyles.add(path);
  const css = readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const label = posix(relative(dist, path));
  for (const match of css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]*))\s*\)/gi)) {
    const value = match[1] ?? match[2] ?? match[3];
    if (!value.startsWith('#')) checkReference(value, path, `${label} CSS url()`);
  }
  for (const match of css.matchAll(/@import\s+["']([^"']+)["']/gi)) checkReference(match[1], path, `${label} CSS import`);
}

function withoutPortfolioAnchors(html) {
  return html.replace(/<a\b((?:"[^"]*"|'[^']*'|[^'">])*)>[\s\S]*?<\/a\s*>/gi, (match, raw) => {
    const href = attributes(raw).href;
    if (!href) return match;
    try {
      const url = new URL(href, origin + '/');
      return localHosts.has(url.hostname) && url.pathname.replace(/\/$/, '') === '/portfolio' ? '' : match;
    } catch { return match; }
  }).replace(/<li\b[^>]*>\s*<\/li>/gi, '').replace(/\r\n/g, '\n').replace(/>\s+</g, '><').trim();
}

let baselineFiles = [];
let originalPublicFiles = [];
try {
  baselineFiles = git('ls-tree', '-r', '--name-only', '-z', baseline).toString('utf8').split('\0').filter(Boolean);
  const changed = new Set(git('diff', '--name-only', '-z', baseline, '--').toString('utf8').split('\0').filter(Boolean));
  for (const path of baselineFiles) {
    if (!changed.has(path) || path === 'build.mjs' || path === 'sitemap.xml') continue;
    if (path === 'index.html' && existsSync(join(root, path))) {
      const before = git('show', `${baseline}:${path}`).toString('utf8');
      const after = readFileSync(join(root, path), 'utf8');
      if (withoutPortfolioAnchors(before) === withoutPortfolioAnchors(after)) continue;
    }
    fail(`Existing source changed beyond the allowed portfolio additions: ${path}.`);
  }
  originalPublicFiles = baselineFiles.filter(path => /^(assets|blog|projects)\//.test(path) || (!path.includes('/') && /\.(html|css|js|png|jpe?g|webp|svg|gif|mp4|webm|pdf|xml|txt|ico)$/i.test(path)));
} catch (error) {
  fail(`Cannot inspect the original Git baseline ${baseline}: ${error.message}`);
}

if (!existsSync(join(dist, 'portfolio', 'index.html'))) fail('dist/portfolio/index.html is missing. Run node build.mjs and ensure portfolio is included in its directory whitelist.');

for (const path of originalPublicFiles) {
  const source = join(root, path);
  const built = join(dist, path);
  if (!existsSync(built)) fail(`Existing public file was omitted from the build: ${path}.`);
  else if (existsSync(source) && !readFileSync(source).equals(readFileSync(built))) fail(`Build changed existing public content: ${path}.`);
}

const portfolioSource = join(root, 'portfolio');
if (!existsSync(portfolioSource)) fail('portfolio/ source directory is missing.');
else for (const source of filesUnder(portfolioSource)) {
  const path = relative(root, source);
  const built = join(dist, path);
  if (!existsSync(built)) fail(`Portfolio source file was omitted from the build: ${posix(path)}.`);
  else if (!readFileSync(source).equals(readFileSync(built))) fail(`Portfolio build differs from its source: ${posix(path)}.`);
}

const portfolioOutput = join(dist, 'portfolio');
const pages = existsSync(portfolioOutput) ? filesUnder(portfolioOutput).filter(path => /\.html$/i.test(path)) : [];
for (const path of pages) {
  const label = posix(relative(dist, path));
  const html = readFileSync(path, 'utf8');
  const elements = tags(html);
  const getMeta = name => elements.find(tag => tag.name === 'meta' && (tag.attrs.name === name || tag.attrs.property === name))?.attrs.content?.trim();
  if (!/<title\b[^>]*>\s*[^<\s][\s\S]*?<\/title>/i.test(html)) fail(`${label}: page title is missing.`);
  if (!getMeta('description')) fail(`${label}: meta description is missing.`);
  if (!getMeta('viewport')) fail(`${label}: viewport metadata is missing.`);
  if (!elements.some(tag => tag.name === 'meta' && tag.attrs.charset?.toLowerCase() === 'utf-8')) fail(`${label}: UTF-8 charset declaration is missing.`);
  if (!elements.find(tag => tag.name === 'html')?.attrs.lang) fail(`${label}: html lang is missing.`);
  if (!getMeta('og:title') || !getMeta('og:description')) fail(`${label}: social title and description are missing.`);
  const canonical = elements.find(tag => tag.name === 'link' && tag.attrs.rel?.split(/\s+/).includes('canonical'))?.attrs.href;
  try {
    const url = new URL(canonical);
    if (url.protocol !== 'https:' || url.hostname !== 'www.localpresence360.com' || url.pathname.replace(/\/$/, '') !== pageUrl(path).pathname.replace(/\/$/, '')) throw new Error();
  } catch { fail(`${label}: canonical must use the correct HTTPS production portfolio URL.`); }
  const headings = elements.filter(tag => tag.name === 'h1').length;
  if (headings !== 1) fail(`${label}: expected one semantic h1; found ${headings}.`);
  if (!elements.some(tag => tag.name === 'main')) fail(`${label}: main landmark is missing.`);
  if (!elements.some(tag => tag.name === 'a' && /^mailto:[^\s@?]+@[^\s@?]+\.[^\s@?]+(?:\?|$)/i.test(tag.attrs.href || ''))) fail(`${label}: working email CTA is missing.`);
  const ids = elements.map(tag => tag.attrs.id).filter(Boolean);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicates.length) fail(`${label}: duplicate IDs: ${duplicates.join(', ')}.`);
  for (const { name, attrs } of elements) {
    if (name === 'a' && (!attrs.href?.trim() || attrs.href.trim() === '#')) fail(`${label}: anchor has an empty or dummy href.`);
    if (name === 'img' && !Object.hasOwn(attrs, 'alt')) fail(`${label}: image is missing an alt attribute (${attrs.src || 'unknown source'}).`);
    for (const attribute of ['src', 'href', 'poster', 'data-src', 'data-background', 'data-bg']) {
      if (attrs[attribute]) checkReference(attrs[attribute], path, `${label} <${name}> ${attribute}`, name === 'a' && attribute === 'href');
    }
    if (attrs.srcset && !attrs.srcset.startsWith('data:')) for (const candidate of attrs.srcset.split(',')) checkReference(candidate.trim().split(/\s+/)[0], path, `${label} srcset`);
    if (attrs.style) for (const match of attrs.style.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) checkReference(match[1], path, `${label} inline CSS`);
  }
}
if (existsSync(portfolioOutput)) for (const path of filesUnder(portfolioOutput).filter(path => /\.css$/i.test(path))) checkCss(path);

if (failures.length) {
  console.error(`Portfolio verification failed (${failures.length} issue${failures.length === 1 ? '' : 's'}):\n` + failures.map(message => `- ${message}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Portfolio verification passed: ${baselineFiles.length} original source paths preserved, ${originalPublicFiles.length} original public files retained, ${pages.length} portfolio HTML page(s), ${checkedReferences.size} local references and ${checkedStyles.size} stylesheets checked.`);
}
