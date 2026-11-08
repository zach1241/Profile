/* Native <details> preserve crawlable links without JavaScript. */
(() => {
  'use strict';
  const nav = document.querySelector('.lp360-nav');
  if (!nav) return;
  const menus = [...nav.querySelectorAll('details.lp360-menu')];
  const closeAll = except => menus.forEach(menu => { if (menu !== except) menu.open = false; });
  menus.forEach(menu => menu.addEventListener('toggle', () => { if (menu.open) closeAll(menu); }));
  document.addEventListener('pointerdown', event => {
    if (!event.target.closest('.lp360-nav')) closeAll();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const open = menus.find(menu => menu.open);
    if (open) { closeAll(); open.querySelector('summary')?.focus(); }
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeAll()));
  // Preserve pricing category when arriving at the homepage from another page.
  nav.querySelectorAll('a[data-select-category]').forEach(link => {
    const url = new URL(link.href, location.origin);
    url.searchParams.set('service', link.dataset.selectCategory);
    link.href = url.pathname + url.search + url.hash;
  });
})();