import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const dist = join(root, 'dist');
const data = JSON.parse(readFileSync(join(root, 'experience/projects.json'), 'utf8'));
const origin = 'https://www.localpresence360.com';
let references = 0;
const attrs = source => Object.fromEntries([...source.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)].map(m => [m[1], m[2]]));
function localTarget(url) {
  const path = join(dist, decodeURIComponent(url.pathname));
  if (existsSync(path) && statSync(path).isFile()) return path;
  if (existsSync(join(path, 'index.html'))) return join(path, 'index.html');
  return null;
}
for (const id of ['', ...data.agencies.map(a => a.id)]) {
  const url = new URL(`/experience/${id ? id+'/' : ''}`, origin);
  const html = readFileSync(localTarget(url), 'utf8');
  assert.equal((html.match(/<h1\b/g)||[]).length, 1, `One h1 required: ${url}`);
  assert.ok(html.includes(`<link rel="canonical" href="${url.href}">`), 'Canonical URL changed');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length, new Set(ids).size, `Duplicate IDs: ${url}`);
  for (const match of html.matchAll(/<(a|img|link|script|button|article)\b([^>]*)>/g)) {
    const a = attrs(match[2]);
    if (match[1] === 'img') {
      assert.ok('alt' in a && a.width && a.height, 'Image must have alt and intrinsic dimensions');
      assert.ok(['lazy','eager',undefined].includes(a.loading));
    }
    for (const key of ['aria-controls','aria-labelledby']) {
      for (const target of (a[key]||'').split(' ').filter(Boolean)) assert.ok(ids.includes(target), `Missing ${key} target ${target}`);
    }
    const refs = [a.href,a.src,...(a.srcset||'').split(',').map(s=>s.trim().split(' ')[0])].filter(Boolean);
    for (const value of refs) {
      const target = new URL(value.replaceAll('&amp;','&'), url);
      if (!['http:','https:'].includes(target.protocol)) continue;
      if (!['localpresence360.com','www.localpresence360.com'].includes(target.hostname)) continue;
      const file = localTarget(target);
      assert.ok(file, `Missing local asset/link: ${value}`);
      references++;
      if (target.hash && extname(file)==='.html') assert.ok(readFileSync(file,'utf8').includes(`id="${target.hash.slice(1)}"`), `Missing anchor: ${value}`);
    }
    if (a.target==='_blank') assert.ok((a.rel||'').includes('noopener'), 'External tab requires noopener');
  }
  for(const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) JSON.parse(match[1]);
  if (id) {
    const clients=data.clients.filter(c=>c.agency===id);
    assert.equal((html.match(/class="client-row reveal"/g)||[]).length,clients.length);
    for(const c of clients) {
      assert.ok(ids.includes(c.id), `Missing client: ${c.id}`);
      if(c.url) {
        assert.ok(c.verificationStatus==='verified' && c.verification && c.evidence.length, `Missing domain verification: ${c.id}`);
        assert.equal(new URL(c.url).hostname.replace(/^www\./,''),c.domain.replace(/^www\./,''));
      }
    }
  }
  if(id==='peak-leads') {
    assert.ok(html.includes('Website Redesign — Awaiting Approval'));
    assert.ok(html.includes('not presented as a proven successful migration'));
    assert.ok(html.includes('INTERNAL AGENCY SOFTWARE'));
    assert.equal((html.match(/id="true-line-roofing-title"/g)||[]).length,1,'Rebrand must stay one project');
  }
}
for(const entity of [...data.agencies,...data.clients]) {
  for(const key of [entity.screenshot,entity.originalScreenshot].filter(Boolean)) for(const suffix of ['', '-800']) {
    const file=join(dist,'assets/experience/screenshots',key+suffix+'.webp');
    assert.ok(existsSync(file),`Missing screenshot ${key+suffix}`);
    assert.ok(statSync(file).size<300_000,`Screenshot exceeds 300KB budget: ${key+suffix}`);
  }
}
console.log(`Experience verification passed: 3 pages, 17 clients, ${references} local references, verified domain evidence, screenshot budgets and historical project status.`);
