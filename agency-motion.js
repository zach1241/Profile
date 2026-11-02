/* Digital Agency motion, independently implemented for Local Presence 360. */
(() => {
  'use strict';
  const all = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const loader = document.querySelector('.motion-loader');
  const root = document.documentElement;
  const topButton = document.querySelector('.back-top');
  let smoother = null;
  let servicesTrigger = null;
  let servicesCards = [];
  let serviceTravel = 0;
  let menuOpen = false;
  let menuClose = () => {};
  let finishedLoading = false;
  let refreshTimer;
  const refresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => ScrollTrigger?.refresh(), 60);
  };
  const finishLoading = () => {
    if (finishedLoading) return;
    finishedLoading = true;
    document.body.classList.remove('motion-loading');
    if (loader) loader.style.display = 'none';
    refresh();
  };
  function position() { return smoother ? smoother.scrollTop() : window.scrollY; }
  function scrollToPosition(value, duration = 1.5) {
    if (reduced.matches || !gsap) { window.scrollTo({ top: value, behavior: 'instant' }); return; }
    if (smoother) gsap.to(smoother, { scrollTop: value, duration, ease: 'sine.inOut', overwrite: true });
    else if (window.ScrollToPlugin) gsap.to(window, { scrollTo: { y: value, autoKill: true }, duration, ease: 'sine.inOut', overwrite: 'auto' });
    else window.scrollTo({ top: value, behavior: 'smooth' });
  }
  function scrollToTarget(target, duration = 1.5) {
    const value = target.id === 'top' ? 0 : smoother ? smoother.offset(target, 'top 120px') : target.getBoundingClientRect().top + window.scrollY - 120;
    scrollToPosition(Math.max(0, value), duration);
  }
  window.AgencyMotion = {
    moveServices(direction) {
      if (!servicesTrigger) return false;
      const step = servicesCards[0].getBoundingClientRect().width;
      const progress = Math.max(0, Math.min(1, servicesTrigger.progress + direction * step / serviceTravel));
      scrollToPosition(servicesTrigger.start + progress * (servicesTrigger.end - servicesTrigger.start), .8);
      return true;
    },
  };

  // All anchors retain service selection and focus the destination after scrolling.
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash || url.hash === '#') return;
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    event.preventDefault();
    finishLoading();
    menuClose(false);
    const current = new URL(location.href);
    current.hash = url.hash;
    history.replaceState(null, '', current.pathname + current.search + current.hash);
    scrollToTarget(target, link.classList.contains('back-top') ? .3 : 1.5);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  // Keep viewport controls outside ScrollSmoother's transformed content.
  const header = document.querySelector('.site-nav');
  const headerHome = document.createComment('Header document position');
  header.before(headerHome);
  let headerSpace = null;
  function updateViewportControls() {
    const y = position();
    if (y >= 260 && !headerSpace) {
      headerSpace = document.createElement('div');
      headerSpace.className = 'motion-header-space';
      headerSpace.style.height = header.getBoundingClientRect().height + 'px';
      header.before(headerSpace);
      document.body.append(header);
      header.classList.add('motion-header-sticky');
    } else if (y < 260 && headerSpace && !menuOpen) {
      header.classList.remove('motion-header-sticky');
      headerSpace.replaceWith(header);
      headerSpace = null;
    }
    const visible = y > 300;
    topButton.classList.toggle('visible', visible);
    topButton.tabIndex = visible ? 0 : -1;
    topButton.setAttribute('aria-hidden', String(!visible));
  }
  window.addEventListener('scroll', updateViewportControls, { passive: true });

  // The reference has a right-side mobile drawer, rather than a dropdown panel.
  const nav = document.getElementById('nav-links');
  const toggle = document.getElementById('menu-toggle');
  const navHome = document.createComment('Desktop navigation position');
  nav.before(navHome);
  const overlay = document.createElement('div');
  overlay.className = 'motion-menu-overlay';
  overlay.hidden = true;
  overlay.innerHTML = '<div class="motion-menu-panel" role="dialog" aria-modal="true" aria-label="Navigation"><button class="motion-menu-close" type="button" aria-label="Close navigation">×</button><div class="motion-menu-contact"><a href="mailto:zacharyswanepoel9@gmail.com">zacharyswanepoel9@gmail.com ↗</a><p>Local Presence 360 · Cape Town</p></div></div>';
  document.body.append(overlay);
  const panel = overlay.querySelector('.motion-menu-panel');
  const menuContact = overlay.querySelector('.motion-menu-contact');
  const menuQuery = window.matchMedia('(max-width: 800px)');
  let menuTween;
  function syncMenuLocation() {
    menuClose(false, true);
    if (menuQuery.matches) panel.insertBefore(nav, menuContact);
    else navHome.after(nav);
  }
  function openMenu() {
    if (!menuQuery.matches) return;
    menuTween?.kill();
    overlay.hidden = false;
    menuOpen = true;
    document.body.classList.add('motion-menu-open');
    document.getElementById('smooth-wrapper').inert = true;
    header.inert = true;
    topButton.inert = true;
    smoother?.paused(true);
    toggle.setAttribute('aria-expanded', 'true');
    nav.classList.add('is-open');
    if (gsap && !reduced.matches) {
      gsap.set(overlay, { autoAlpha: 1, backgroundColor: '#0000' });
      gsap.set(panel, { x: 0, xPercent: 100 });
      menuTween = gsap.timeline().to(overlay, { backgroundColor: '#0007', duration: .6 }, 0)
        .to(panel, { xPercent: 0, duration: .6, ease: drawerEase }, 0);
    } else { overlay.style.opacity = '1'; overlay.style.visibility = 'visible'; panel.style.transform = 'none'; }
    nav.querySelector('a').focus({ preventScroll: true });
  }
  menuClose = (restoreFocus = false, instant = false) => {
    if (!menuOpen && overlay.hidden) return;
    menuOpen = false;
    menuTween?.kill();
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    const done = () => {
      overlay.hidden = true;
      nav.classList.remove('is-open');
      document.body.classList.remove('motion-menu-open');
      document.getElementById('smooth-wrapper').inert = false;
      header.inert = false;
      topButton.inert = false;
      smoother?.paused(false);
      if (restoreFocus) toggle.focus({ preventScroll: true });
    };
    if (gsap && !reduced.matches && !instant) {
      menuTween = gsap.timeline({ onComplete: done }).to(panel, { xPercent: 100, duration: .45, ease: 'power1.inOut' }, 0)
        .to(overlay, { backgroundColor: '#0000', duration: .45 }, 0);
    } else done();
  };
  toggle.addEventListener('click', () => { if (toggle.getAttribute('aria-expanded') === 'true') openMenu(); else menuClose(true); });
  overlay.querySelector('.motion-menu-close').addEventListener('click', () => menuClose(true));
  overlay.addEventListener('click', event => { if (event.target === overlay) menuClose(true); });
  document.addEventListener('keydown', event => {
    if (!menuOpen) return;
    if (event.key === 'Escape') { event.preventDefault(); menuClose(true); }
    if (event.key === 'Tab') {
      const items = all('a[href],button', panel).filter(x => x.getClientRects().length > 0);
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  menuQuery.addEventListener('change', syncMenuLocation);
  syncMenuLocation();
  updateViewportControls();

  reduced.addEventListener('change', () => location.reload());
  if (!gsap || !ScrollTrigger || reduced.matches) {
    finishLoading();
    return;
  }
  [ScrollTrigger, window.ScrollSmoother, window.ScrollToPlugin].filter(Boolean).forEach(plugin => gsap.registerPlugin(plugin));
  root.classList.add('motion-enabled');
  document.body.classList.add('motion-ready', 'motion-loading');
  // A failed effect must never leave the site covered by its loading curtain.
  setTimeout(finishLoading, 6500);
  gsap.timeline({ onComplete: finishLoading })
    .to('.loader-word', { y: -80, opacity: 0, duration: .6, delay: 1, ease: 'power1.out' })
    .to('.loader-curtain', { attr: { d: 'M0 500 Q500 45 1000 500 V0 H0 Z' }, duration: .6, ease: 'power2.inOut' })
    .to('.loader-curtain', { attr: { d: 'M0 1 Q500 1 1000 1 V0 H0 Z' }, duration: .6, ease: 'power2.inOut' })
    .to(loader, { yPercent: -130, duration: .8, ease: 'power4.inOut' });

  const photo = document.querySelector('.workspace-banner > img');
  photo.dataset.speed = '.8';
  if (window.ScrollSmoother) {
    smoother = window.ScrollSmoother.create({ wrapper: '#smooth-wrapper', content: '#smooth-content', smooth: 4, smoothTouch: .2, effects: true, normalizeScroll: false, ignoreMobileResize: true });
  }
  ScrollTrigger.addEventListener('refresh', updateViewportControls);

  // The reference's ordinary entrances move 100px over 1s, and replay on re-entry.
  // Use its CSS ease curve, numerically inverted without an extra easing dependency.
  function cssEase(x) {
    let low = 0, high = 1, t = x;
    for (let i = 0; i < 14; i++) {
      t = (low + high) / 2;
      const value = 3 * (1-t) * (1-t) * t * .25 + 3 * (1-t) * t*t * .25 + t*t*t;
      if (value < x) low = t; else high = t;
    }
    return 3 * (1-t) * (1-t) * t * .1 + 3 * (1-t) * t*t + t*t*t;
  }
  function drawerEase(x) {
    let low = 0, high = 1, t = x;
    for (let i = 0; i < 14; i++) {
      t = (low + high) / 2;
      const value = 3 * (1-t) * (1-t) * t * .785 + 3 * (1-t) * t*t * .15 + t*t*t;
      if (value < x) low = t; else high = t;
    }
    return 3 * (1-t) * (1-t) * t * .135 + 3 * (1-t) * t*t * .86 + t*t*t;
  }
  function entrance(element, delay = .2) {
    if (!element) return;
    element.dataset.motionReveal = String(delay);
    const tween = gsap.fromTo(element, { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 1, delay, ease: cssEase, paused: true });
    ScrollTrigger.create({ trigger: element, start: 'top bottom', onEnter: () => tween.restart(true), onLeaveBack: () => tween.pause(0), onEnterBack: () => { if (tween.progress() < 1) tween.play(); } });
  }
  entrance(document.querySelector('.hero h1'), .2);
  entrance(document.querySelector('.hero-type h2'), .3);
  entrance(document.querySelector('.hero-bottom'), .4);
  entrance(document.querySelector('.workspace-banner'), .2);
  entrance(document.querySelector('.about .statement'), .2);
  entrance(document.querySelector('.about-detail > div:first-child'), .2);
  all('.about-points > a').forEach((el, index) => entrance(el, .2 + index * .2));
  all('.work-card').forEach((el, index) => entrance(el, index % 2 ? .4 : .2));
  all('#faq details').forEach((el, index) => entrance(el, .2 + index * .1));
  entrance(document.querySelector('.pricing-heading'), .2);

  // Split only the three headings that darken character-by-character in index-6.
  function splitCharacters(element) {
    const label = element.innerText.replace(/\s+/g, ' ').trim();
    element.setAttribute('aria-label', label);
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).filter(Boolean).forEach(word => {
        if (/^\s+$/.test(word)) { fragment.append(document.createTextNode(word)); return; }
        const wrapper = document.createElement('span');
        wrapper.className = 'motion-word';
        wrapper.setAttribute('aria-hidden', 'true');
        Array.from(word).forEach(letter => { const char = document.createElement('span'); char.className = 'motion-char'; char.textContent = letter; wrapper.append(char); });
        fragment.append(wrapper);
      });
      node.replaceWith(fragment);
    });
    return all('.motion-char', element);
  }
  all('#services .display, #faq .display, .contact-intro .statement').forEach(element => {
    const chars = splitCharacters(element);
    gsap.fromTo(chars, { opacity: .3, x: -7 }, { opacity: 1, x: 0, duration: .7, stagger: .2, ease: 'power1.out', scrollTrigger: { trigger: element, start: 'top 92%', end: 'top 60%', scrub: 1 } });
  });

  // Native grid on touch/tablet; desktop sweeps cards sideways while the row is pinned.
  const track = document.getElementById('services-track');
  const services = document.getElementById('services');
  servicesCards = all('.service-card', track);
  const media = gsap.matchMedia();
  media.add('(min-width: 1200px)', () => {
    track.scrollLeft = 0;
    track.classList.add('motion-services-pinned');
    services.classList.add('motion-pin-active');
    const travel = () => {
      const width = servicesCards[0].getBoundingClientRect().width;
      // Same 80%-per-additional-panel sweep as the six-card demo; ours has four real services.
      serviceTravel = width * .8 * (servicesCards.length - 1);
      return serviceTravel;
    };
    const tween = gsap.to(servicesCards, { x: () => -travel(), ease: 'none', scrollTrigger: {
      trigger: track, start: 'top 120px', pin: true, scrub: 1,
      end: () => '+=' + (servicesCards[0].getBoundingClientRect().width * servicesCards.length), invalidateOnRefresh: true,
    } });
    servicesTrigger = tween.scrollTrigger;
    return () => { servicesTrigger = null; track.classList.remove('motion-services-pinned'); services.classList.remove('motion-pin-active'); };
  });
  servicesCards.forEach((card, index) => card.addEventListener('focusin', () => {
    if (!servicesTrigger) return;
    const box = card.getBoundingClientRect();
    if (box.left < 0 || box.right > innerWidth) {
      const desired = Math.min(serviceTravel, index * card.getBoundingClientRect().width);
      scrollToPosition(servicesTrigger.start + desired / serviceTravel * (servicesTrigger.end - servicesTrigger.start), .5);
    }
  }));

  // A repeating 50s marquee, rather than the former scroll-bound translation.
  const marquee = document.querySelector('.marquee');
  let marqueeTween;
  function runMarquee() {
    marqueeTween?.kill();
    gsap.set(marquee, { x: 0 });
    const gap = parseFloat(getComputedStyle(marquee).gap) || 60;
    const distance = marquee.firstElementChild.getBoundingClientRect().width + gap;
    marqueeTween = gsap.to(marquee, { x: -distance, duration: 50, ease: 'none', repeat: -1 });
  }
  runMarquee();
  const runningLoops = [];
  const addPauseControl = (parent, label, getTween) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'motion-loop-toggle'; button.textContent = 'Pause ' + label; button.setAttribute('aria-pressed', 'false');
    let paused = false;
    button.addEventListener('click', () => { paused = !paused; getTween()?.paused(paused); button.textContent = (paused ? 'Play ' : 'Pause ') + label; button.setAttribute('aria-pressed', String(paused)); });
    parent.append(button);
    runningLoops.push({ getTween, isPaused: () => paused });
    return button;
  };
  addPauseControl(document.getElementById('work'), 'moving title', () => marqueeTween);

  // Reproduce the reference carousel timing using existing capability labels.
  const capabilityStrip = document.querySelector('.capability-strip');
  const capabilityTrack = capabilityStrip.firstElementChild;
  capabilityTrack.className = 'capability-track';
  const capabilityCards = [...capabilityTrack.children];
  capabilityCards.forEach(card => {
    const label = document.createElement('span'); label.className = 'capability-label'; label.textContent = card.textContent; card.textContent = ''; card.className = 'capability-card'; card.append(label);
  });
  for (let copy = 0; copy < 2; copy++) capabilityCards.forEach(card => { const clone = card.cloneNode(true); clone.setAttribute('aria-hidden', 'true'); capabilityTrack.append(clone); });
  let capabilityTween;
  function runCapabilities() {
    capabilityTween?.kill();
    gsap.set(capabilityTrack, { x: 0 });
    const step = capabilityCards[0].offsetWidth + 15;
    capabilityTween = gsap.timeline({ repeat: -1 });
    capabilityCards.forEach((_, index) => capabilityTween.to(capabilityTrack, { x: -step * (index + 1), duration: 1.3, ease: cssEase }, '+=2'));
    capabilityTween.set(capabilityTrack, { x: 0 });
  }
  runCapabilities();
  addPauseControl(capabilityStrip, 'capability carousel', () => capabilityTween);

  // The original demo repeats its testimonial. Repeat the real founder statement,
  // rather than introducing invented customer quotes or endorsements.
  const founderHeading = document.querySelector('.founder .statement');
  const founderRotation = document.createElement('div'); founderRotation.className = 'founder-rotation';
  const founderTrack = document.createElement('div'); founderTrack.className = 'founder-quote-track';
  founderHeading.before(founderRotation); founderRotation.append(founderTrack);
  const founderSlide = document.createElement('div'); founderSlide.className = 'founder-slide'; founderTrack.append(founderSlide); founderSlide.append(founderHeading);
  const founderClone = founderSlide.cloneNode(true); founderClone.setAttribute('aria-hidden', 'true'); founderTrack.append(founderClone);
  let founderTween;
  function runFounder() {
    founderTween?.kill(); gsap.set(founderTrack, { x: 0 });
    founderTween = gsap.timeline({ repeat: -1 }).to(founderTrack, { x: () => -founderRotation.clientWidth, duration: 1.3, ease: cssEase }, '+=2').set(founderTrack, { x: 0 });
  }
  runFounder();
  const founderControls = document.createElement('div'); founderControls.className = 'founder-controls'; founderRotation.after(founderControls);
  addPauseControl(founderControls, 'quote motion', () => founderTween);

  // The rotating discover ring has a stationary arrow.
  const discover = document.createElement('a'); discover.className = 'motion-discover'; discover.href = '#services'; discover.setAttribute('aria-label', 'Scroll to discover services');
  discover.innerHTML = '<svg viewBox="0 0 135 135" aria-hidden="true"><defs><path id="discover-ring" d="M67.5 15 a52.5 52.5 0 1 1 -0.01 0"></path></defs><text><textPath href="#discover-ring">SCROLL TO DISCOVER · SCROLL TO DISCOVER · </textPath></text></svg><span aria-hidden="true">↓</span>';
  document.getElementById('about').append(discover);

  // Single-open FAQ with 300ms height transitions; semantic details are retained.
  const accordionState = new WeakMap();
  const accordionAnimation = new WeakMap();
  all('.faq-list details, .expertise-list details, .plan-inclusions, .shared-terms').forEach(detail => {
    const summary = detail.querySelector('summary');
    accordionState.set(detail, detail.open);
    const content = document.createElement('div'); content.className = 'motion-accordion-content';
    while (summary.nextSibling) content.append(summary.nextSibling);
    detail.append(content);
    const transition = (open) => {
      const start = detail.getBoundingClientRect().height;
      accordionAnimation.get(detail)?.cancel();
      accordionState.set(detail, open);
      detail.open = true;
      detail.style.height = '';
      const end = open ? detail.getBoundingClientRect().height : summary.getBoundingClientRect().height;
      detail.style.overflow = 'hidden';
      const animation = detail.animate([{ height: start + 'px' }, { height: end + 'px' }], { duration: 300, easing: 'cubic-bezier(.445,.05,.55,.95)' });
      accordionAnimation.set(detail, animation);
      animation.onfinish = () => { detail.open = open; detail.style.height = ''; detail.style.overflow = ''; accordionAnimation.delete(detail); refresh(); };
    };
    detail.motionToggle = transition;
    summary.addEventListener('click', event => {
      event.preventDefault();
      const open = !accordionState.get(detail);
      if (open && detail.closest('.faq-list')) all('.faq-list details').filter(sibling => sibling !== detail && sibling.open).forEach(sibling => sibling.motionToggle(false));
      transition(open);
    });
  });

  // Actual pointer-entry circular fills; only the final CTA is magnetic.
  all('.pill, .plan-action, .form-submit').forEach(button => {
    button.classList.add('motion-button');
    const label = document.createElement('span'); label.className = 'motion-button-label';
    while (button.firstChild) label.append(button.firstChild);
    const fill = document.createElement('span'); fill.className = 'motion-button-fill'; fill.setAttribute('aria-hidden', 'true');
    button.append(fill, label);
    const origin = event => { const rect = button.getBoundingClientRect(); button.style.setProperty('--fill-x', event.clientX - rect.left + 'px'); button.style.setProperty('--fill-y', event.clientY - rect.top + 'px'); };
    button.addEventListener('pointerenter', event => { if (!fine.matches) return; origin(event); button.classList.add('is-fill-active'); });
    button.addEventListener('pointerleave', event => { origin(event); button.classList.remove('is-fill-active'); });
    button.addEventListener('focus', () => button.classList.add('is-fill-active'));
    button.addEventListener('blur', () => button.classList.remove('is-fill-active'));
  });
  const magnetic = document.querySelector('.contact-intro .pill');
  magnetic.addEventListener('pointermove', event => {
    if (!fine.matches) return;
    const rect = magnetic.getBoundingClientRect();
    gsap.to(magnetic, { x: (event.clientX - rect.left - rect.width / 2) / rect.width * 60, y: (event.clientY - rect.top - rect.height / 2) / rect.height * 60, duration: 1, ease: 'power2.out', overwrite: true });
  });
  magnetic.addEventListener('pointerleave', () => gsap.to(magnetic, { x: 0, y: 0, duration: 1, ease: 'power2.out', overwrite: true }));

  // Five 230x278 project images emitted each 80px of pointer movement.
  const hero = document.getElementById('hero');
  const trail = document.createElement('div'); trail.className = 'hero-trail'; trail.setAttribute('aria-hidden', 'true'); hero.append(trail);
  ['/assets/home/logic-lc.webp', '/assets/home/rc-premium-detailing.webp', '/assets/home/in-trade-crm.webp', '/assets/home/lamile.webp', '/assets/home/digital-workspace.webp'].forEach(src => { const image = new Image(); image.src = src; image.alt = ''; image.width = 230; image.height = 278; trail.append(image); });
  const trailImages = [...trail.children];
  let mouse = null, cached = null, emitted = null, index = 0, depth = 1;
  hero.addEventListener('pointerenter', () => { if (fine.matches && innerWidth >= 1200) hero.classList.add('trail-hover'); });
  hero.addEventListener('pointerleave', () => { hero.classList.remove('trail-hover'); mouse = null; emitted = null; cached = null; });
  hero.addEventListener('pointermove', event => {
    if (!fine.matches || innerWidth < 1200) return;
    const box = hero.getBoundingClientRect(); mouse = { x: event.clientX - box.left, y: event.clientY - box.top };
    cached ||= { ...mouse }; emitted ||= { x: mouse.x - 81, y: mouse.y };
  });
  const cursor = document.querySelector('.motion-cursor');
  let pointer = null, cursorAt = null;
  document.addEventListener('pointermove', event => { if (!fine.matches) return; pointer = { x: event.clientX, y: event.clientY }; cursorAt ||= { ...pointer }; });
  document.addEventListener('pointerover', event => { if (!fine.matches) return; gsap.to(cursor, { opacity: event.target.closest('a,button,input,select,textarea,summary') ? 0 : 1, scale: event.target.closest('a,button') ? 0 : 1, duration: .3, overwrite: true }); });
  document.documentElement.addEventListener('pointerleave', () => gsap.to(cursor, { opacity: 0, duration: .3 }));
  gsap.ticker.add(() => {
    if (document.hidden) return;
    if (pointer && cursorAt) {
      cursorAt.x += (pointer.x - cursorAt.x) * .15; cursorAt.y += (pointer.y - cursorAt.y) * .15;
      gsap.set(cursor, { x: cursorAt.x - 2.5, y: cursorAt.y - 2.5 });
    }
    if (!mouse || !cached || !emitted) return;
    cached.x += (mouse.x - cached.x) * .15; cached.y += (mouse.y - cached.y) * .15;
    if (Math.hypot(mouse.x - emitted.x, mouse.y - emitted.y) <= 80) return;
    const image = trailImages[index]; gsap.killTweensOf(image);
    gsap.set(image, { opacity: 1, scale: 1, zIndex: depth++, x: cached.x - 115, y: cached.y - 139 });
    gsap.to(image, { x: mouse.x - 115, y: mouse.y - 139, duration: .8, ease: 'expo.out' });
    gsap.to(image, { opacity: 0, scale: .25, duration: .9, delay: .3, ease: 'power2.out' });
    emitted = { ...mouse }; index = (index + 1) % trailImages.length;
  });

  document.addEventListener('agency:pricing-change', event => {
    const visible = document.getElementById('panel-' + event.detail.category);
    gsap.fromTo(all('.plan', visible), { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: .35, stagger: .05, ease: cssEase, overwrite: true });
    refresh();
  });
  all('details').forEach(detail => detail.addEventListener('toggle', () => { if (!detail.motionToggle) refresh(); }));
  all('img').forEach(image => { if (!image.complete) image.addEventListener('load', refresh, { once: true }); });
  document.fonts?.ready.then(() => { runMarquee(); runCapabilities(); runFounder(); refresh(); });
  window.addEventListener('resize', () => {
    if (headerSpace) headerSpace.style.height = header.getBoundingClientRect().height + 'px';
    runMarquee(); runCapabilities(); runFounder();
    runningLoops.forEach(loop => loop.getTween()?.paused(loop.isPaused()));
    refresh();
  }, { passive: true });
  document.addEventListener('visibilitychange', () => runningLoops.forEach(loop => loop.getTween()?.paused(document.hidden || loop.isPaused())));
  window.addEventListener('load', () => { refresh(); if (location.hash) { const target = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (target) setTimeout(() => scrollToTarget(target, .3), 100); } }, { once: true });
  refresh();
})();
