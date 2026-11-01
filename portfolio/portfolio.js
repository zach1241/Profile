/* Local Presence 360 portfolio interactions, independently implemented. */
(() => {
  'use strict';

  function initPortfolio() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    const canAnimate = Boolean(gsap && ScrollTrigger && !reduceMotion.matches);
    const all = (selector, root = document) => Array.from(root.querySelectorAll(selector));
    let smoother = null;
    if (canAnimate) document.documentElement.style.scrollBehavior = 'auto';

    if (gsap) {
      [ScrollTrigger, window.ScrollSmoother, window.ScrollToPlugin].filter(Boolean)
        .forEach(plugin => gsap.registerPlugin(plugin));
    }

    if (canAnimate && window.ScrollSmoother && document.querySelector('#smooth-wrapper') && document.querySelector('#smooth-content')) {
      smoother = window.ScrollSmoother.create({
        wrapper: '#smooth-wrapper', content: '#smooth-content',
        smooth: 4, smoothTouch: 0.2, effects: true,
        normalizeScroll: false, ignoreMobileResize: true,
      });
    }

    const preloader = document.querySelector('.preloader');
    let loadingFinished = false;
    const finishLoading = () => {
      if (loadingFinished) return;
      loadingFinished = true;
      if (preloader) {
        preloader.hidden = true;
        preloader.style.display = 'none';
        preloader.setAttribute('aria-hidden', 'true');
      }
      document.body.classList.remove('is-loading', 'loading');
      document.body.classList.add('is-ready');
      ScrollTrigger?.refresh();
    };
    if (preloader && canAnimate) {
      preloader.style.display = 'block';
      const curve = document.querySelector('#loader-curve');
      const loading = gsap.timeline({ onComplete: finishLoading });
      loading.to('.loading-letter', { y: -80, autoAlpha: 0, delay: 1, duration: 0.6 });
      if (curve) {
        loading.to(curve, { attr: { d: 'M0 502S175 272 500 272s500 230 500 230V0H0Z' }, duration: 0.6, ease: 'power2.inOut' });
        loading.to(curve, { attr: { d: 'M0 2S175 1 500 1s500 1 500 1V0H0Z' }, duration: 0.6, ease: 'power2.inOut' });
      }
      loading.to(preloader, { yPercent: -130, duration: 0.8, ease: 'power4.inOut' });
      // A failed third-party animation must never keep the page covered.
      window.setTimeout(finishLoading, 6500);
    } else {
      finishLoading();
    }

    const header = document.querySelector('.site-header, .header, header');
    const backToTop = document.querySelector('#back-to-top');
    const updateScrollControls = () => {
      const scrollPosition = smoother ? smoother.scrollTop() : window.scrollY;
      header?.classList.toggle('is-sticky', scrollPosition >= 260);
      header?.classList.toggle('fixed-header', scrollPosition >= 260);
      if (backToTop) {
        const shown = scrollPosition > 300;
        backToTop.classList.toggle('is-visible', shown);
        backToTop.classList.toggle('back-to-top-btn-show', shown);
        backToTop.setAttribute('aria-hidden', String(!shown));
        backToTop.tabIndex = shown ? 0 : -1;
      }
    };
    window.addEventListener('scroll', updateScrollControls, { passive: true });
    if (canAnimate) ScrollTrigger.addEventListener('refresh', updateScrollControls);
    updateScrollControls();

    const menuButton = document.querySelector('#menu-toggle');
    const menuPanel = document.querySelector('#menu-panel');
    const menuClose = document.querySelector('#menu-close');
    let menuOpen = false;
    let previousFocus = null;
    let menuAnimation = null;
    let menuTransition = 0;
    let menuBackgrounds = [];
    const menuLogo = menuPanel?.querySelector('.menu-top > span');
    const menuLinks = menuPanel ? all('.menu-layout nav a', menuPanel) : [];
    const menuInformation = menuPanel?.querySelector('.menu-contact p');
    const menuContacts = menuPanel ? all('.menu-contact a', menuPanel) : [];
    // The reference's curtain easing is cubic-bezier(.77, 0, .175, 1).
    const menuEase = progress => {
      let low = 0, high = 1, time = progress;
      for (let step = 0; step < 18; step += 1) {
        time = (low + high) / 2;
        const remainder = 1 - time;
        const x = 3 * remainder * remainder * time * 0.77 + 3 * remainder * time * time * 0.175 + time * time * time;
        if (x < progress) low = time; else high = time;
      }
      return 3 * (1 - time) * time * time + time * time * time;
    };
    const focusableMenuItems = () => all('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])', menuPanel)
      .filter(element => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden');
    const cancelMenuAnimation = () => {
      menuTransition += 1;
      menuAnimation?.kill();
      menuAnimation = null;
      return menuTransition;
    };
    const closeMenu = (restoreFocus = true) => {
      if (!menuPanel || !menuOpen) return;
      const transition = cancelMenuAnimation();
      menuOpen = false;
      menuPanel.classList.remove('is-open', 'opened');
      menuPanel.setAttribute('aria-hidden', 'true');
      menuPanel.inert = true;
      menuButton?.setAttribute('aria-expanded', 'false');
      smoother?.paused(false);
      const finishClosing = () => {
        if (transition !== menuTransition || menuOpen) return;
        menuPanel.hidden = true;
        document.body.classList.remove('menu-open');
        if (restoreFocus) (previousFocus || menuButton)?.focus({ preventScroll: true });
      };
      if (!canAnimate) { finishClosing(); return; }
      menuAnimation = gsap.timeline({ onComplete: finishClosing });
      if (menuLogo) menuAnimation.to(menuLogo, { y: 30, autoAlpha: 0, duration: 0.4, ease: 'power1.out' }, 0);
      if (menuClose) menuAnimation.to(menuClose, { y: 20, autoAlpha: 0, duration: 0.4, ease: 'power1.out' }, 0);
      if (menuInformation) menuAnimation.to(menuInformation, { y: 60, autoAlpha: 0, duration: 0.4, ease: 'power1.out' }, 0.6);
      if (menuContacts.length) menuAnimation.to(menuContacts, { y: 60, autoAlpha: 0, duration: 1, ease: 'power1.inOut' }, 0.9);
      if (menuLinks.length) menuAnimation.to(menuLinks, { y: 35, autoAlpha: 0, duration: 0.4, ease: 'power1.out' }, 1.2);
      menuAnimation.to(menuBackgrounds, { scaleY: 0, duration: 1, ease: menuEase }, 1);
    };
    const openMenu = () => {
      if (!menuPanel) return;
      const wasHidden = menuPanel.hidden;
      const transition = cancelMenuAnimation();
      if (wasHidden) previousFocus = document.activeElement;
      menuOpen = true;
      menuPanel.hidden = false;
      menuPanel.inert = false;
      menuPanel.setAttribute('aria-hidden', 'false');
      menuPanel.classList.add('is-open', 'opened');
      menuButton?.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
      smoother?.paused(true);
      if (!canAnimate) {
        (menuClose || focusableMenuItems()[0])?.focus({ preventScroll: true });
        return;
      }
      menuPanel.focus({ preventScroll: true });
      if (wasHidden) {
        gsap.set(menuBackgrounds, { scaleY: 0 });
        if (menuLogo) gsap.set(menuLogo, { y: 30, autoAlpha: 0 });
        if (menuClose) gsap.set(menuClose, { y: 20, autoAlpha: 0 });
        if (menuLinks.length) gsap.set(menuLinks, { y: 35, autoAlpha: 0 });
        if (menuInformation) gsap.set(menuInformation, { y: 60, autoAlpha: 0 });
        if (menuContacts.length) gsap.set(menuContacts, { y: 60, autoAlpha: 0 });
      }
      menuAnimation = gsap.timeline();
      menuAnimation.to(menuBackgrounds, { scaleY: 1, duration: 1, ease: menuEase }, 0);
      if (menuLogo) menuAnimation.to(menuLogo, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'power1.out' }, 0.3);
      if (menuContacts.length) menuAnimation.to(menuContacts, { y: 0, autoAlpha: 1, duration: 1, ease: 'power1.inOut' }, 0.7);
      if (menuInformation) menuAnimation.to(menuInformation, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'power1.out' }, 0.9);
      if (menuLinks.length) menuAnimation.to(menuLinks, { y: 0, autoAlpha: 1, duration: 0.4, stagger: 0.04, ease: 'power1.out' }, 0.9);
      if (menuClose) menuAnimation.to(menuClose, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'power1.out', onComplete: () => {
        if (transition === menuTransition && menuOpen && document.activeElement === menuPanel) menuClose.focus({ preventScroll: true });
      } }, 0.9);
    };
    if (menuPanel) {
      menuPanel.tabIndex = -1;
      if (canAnimate) {
        Object.assign(menuPanel.style, { background: 'transparent', color: '#ffffff', isolation: 'isolate' });
        if (menuClose) menuClose.style.color = '#010406';
        all(':scope > *', menuPanel).forEach(element => {
          element.style.position = 'relative';
          element.style.zIndex = '1';
        });
        menuBackgrounds = ['left', 'right'].map((side, index) => {
          const pane = document.createElement('div');
          pane.className = `menu-split-bg menu-split-${side}`;
          pane.setAttribute('aria-hidden', 'true');
          Object.assign(pane.style, { position: 'fixed', top: '0', bottom: '0', [side]: '0',
            width: index === 0 ? '60%' : '40%', background: index === 0 ? '#010406' : '#171717',
            zIndex: '0', pointerEvents: 'none', transformOrigin: index === 0 ? 'center top' : 'center bottom' });
          menuPanel.prepend(pane);
          return pane;
        });
        const sizeMenuBackgrounds = () => {
          const mobile = window.innerWidth < 768;
          menuBackgrounds[0].style.width = mobile ? '100%' : '60%';
          menuBackgrounds[1].style.display = mobile ? 'none' : 'block';
        };
        sizeMenuBackgrounds();
        window.addEventListener('resize', sizeMenuBackgrounds, { passive: true });
      }
      menuPanel.setAttribute('aria-hidden', 'true');
      menuPanel.inert = true;
      menuButton?.setAttribute('aria-expanded', 'false');
      menuButton?.addEventListener('click', () => menuOpen ? closeMenu() : openMenu());
      menuClose?.addEventListener('click', () => closeMenu());
      menuPanel.addEventListener('click', event => {
        if (event.target === menuPanel || event.target.closest('[data-menu-dismiss]')) closeMenu();
        if (event.target.closest('a[href]')) closeMenu();
      });
      document.addEventListener('keydown', event => {
        if (!menuOpen) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          closeMenu();
        } else if (event.key === 'Tab') {
          const items = focusableMenuItems();
          if (!items.length) { event.preventDefault(); return; }
          const first = items[0], last = items[items.length - 1];
          if (document.activeElement === menuPanel) {
            event.preventDefault(); (event.shiftKey ? last : first).focus();
          } else if (event.shiftKey && document.activeElement === first) {
            event.preventDefault(); last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault(); first.focus();
          }
        }
      });
    }

    const scrollToTarget = target => {
      if (smoother && !reduceMotion.matches) {
        const position = typeof target === 'number' ? target : Math.max(0, smoother.offset(target, 'top top') - 120);
        gsap.to(smoother, { scrollTop: position, duration: 1.5, ease: 'power2.inOut', overwrite: true });
      } else if (canAnimate && window.ScrollToPlugin) {
        gsap.to(window, { scrollTo: { y: target, offsetY: typeof target === 'number' ? 0 : 120 }, duration: 1.5, ease: 'power2.inOut', overwrite: true });
      } else {
        const position = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY - 120;
        window.scrollTo({ top: Math.max(0, position), behavior: reduceMotion.matches ? 'instant' : 'smooth' });
      }
    };
    all('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
      const hash = link.getAttribute('href');
      if (!hash || hash === '#') return;
      let target;
      try { target = document.querySelector(hash); } catch { return; }
      if (!target) return;
      event.preventDefault();
      closeMenu(false);
      scrollToTarget(target);
      history.replaceState(null, '', hash);
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }));
    backToTop?.addEventListener('click', event => {
      event.preventDefault();
      if (smoother && canAnimate) gsap.to(smoother, { scrollTop: 0, duration: 0.3, ease: 'power1.out', overwrite: true });
      else if (canAnimate && window.ScrollToPlugin) gsap.to(window, { scrollTo: 0, duration: 0.3, overwrite: true });
      else window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'instant' : 'smooth' });
    });

    all('.reveal').forEach(element => {
      if (!canAnimate) {
        element.style.opacity = '1';
        element.style.transform = 'none';
        element.classList.add('is-revealed');
        return;
      }
      const direction = element.dataset.direction || 'up';
      const distance = Number(element.dataset.distance) || 100;
      const offset = direction === 'left' ? { x: distance } : direction === 'right' ? { x: -distance } : { y: distance };
      const duration = Number(element.dataset.duration) || 1;
      const delay = Number(element.dataset.delay) || 0;
      const reveal = gsap.fromTo(element, { ...offset, autoAlpha: 0 }, {
        x: 0, y: 0, autoAlpha: 1, duration, delay,
        ease: 'power2.out', paused: true, overwrite: 'auto',
      });
      ScrollTrigger.create({
        trigger: element, start: 'top bottom',
        onEnter: () => reveal.restart(true),
        onEnterBack: () => reveal.restart(true),
        onLeaveBack: () => reveal.pause(0),
      });
    });

    all('.color-reveal').forEach(element => {
      const original = element.textContent.replace(/\s+/g, ' ').trim();
      if (!original || !canAnimate) return;
      element.setAttribute('aria-label', original);
      element.textContent = '';
      original.split(' ').forEach((word, index, words) => {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'reveal-word';
        wordSpan.setAttribute('aria-hidden', 'true');
        Array.from(word).forEach(character => {
          const characterSpan = document.createElement('span');
          characterSpan.className = 'reveal-char';
          characterSpan.style.display = 'inline-block';
          characterSpan.textContent = character;
          wordSpan.append(characterSpan);
        });
        wordSpan.style.display = 'inline-block';
        element.append(wordSpan);
        if (index < words.length - 1) element.append(document.createTextNode(' '));
      });
      gsap.fromTo(all('.reveal-char', element), { opacity: 0.3, x: -7 }, {
        opacity: 1, x: 0, duration: 0.7, stagger: 0.2, ease: 'none',
        scrollTrigger: { trigger: element, start: 'top 92%', end: 'top 60%', scrub: 1 },
      });
    });

    all('.about-photo, [data-image-reveal]').forEach(wrapper => {
      const image = wrapper.querySelector('img');
      if (!image || !canAnimate) return;
      const buildMosaic = () => {
        if (!image.naturalWidth) return;
        let grid = wrapper.querySelector('.photo-grid');
        if (!grid) {
          grid = document.createElement('div');
          grid.className = 'photo-grid';
          wrapper.append(grid);
        }
        if (getComputedStyle(wrapper).position === 'static') wrapper.style.position = 'relative';
        Object.assign(grid.style, { position: 'absolute', inset: '0', pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit' });
        grid.setAttribute('aria-hidden', 'true');
        grid.replaceChildren();
        const timeline = gsap.timeline({ scrollTrigger: { trigger: wrapper, start: 'top 75%', once: true } });
        const groups = new Map();
        for (let row = 0; row < 3; row += 1) {
          for (let column = 0; column < 3; column += 1) {
            const patch = document.createElement('div');
            const top = row * 100 / 3, left = column * 100 / 3;
            const right = Math.max(0, 100 - (column + 1) * 100 / 3 - 0.15);
            const bottom = Math.max(0, 100 - (row + 1) * 100 / 3 - 0.15);
            Object.assign(patch.style, { position: 'absolute', inset: '0', backgroundImage: `url("${image.currentSrc || image.src}")`,
              backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center bottom',
              clipPath: `inset(${top}% ${100 - left}% ${100 - top}% ${left}%)` });
            grid.append(patch);
            const diagonal = row + column;
            const groupIndex = groups.get(diagonal) || 0;
            groups.set(diagonal, groupIndex + 1);
            timeline.to(patch, { clipPath: `inset(${top}% ${right}% ${bottom}% ${left}%)`, duration: 1, ease: 'power4.out' }, diagonal * 0.125 + groupIndex * 0.1);
          }
        }
        image.style.opacity = '0';
      };
      if (image.complete) buildMosaic();
      else image.addEventListener('load', buildMosaic, { once: true });
    });

    const workSection = document.querySelector('.work-section');
    const workBackdrop = document.querySelector('.work-backdrop');
    if (workSection && workBackdrop && canAnimate) {
      ScrollTrigger.create({
        trigger: workSection, start: 'top center-=200', end: 'bottom bottom-=200',
        pin: workBackdrop, pinSpacing: false, scrub: 1,
      });
    }

    all('.service-marquee .marquee-track').forEach(track => {
      if (!canAnimate) return;
      track.style.animation = 'none';
      let tween;
      const runMarquee = () => {
        tween?.kill();
        gsap.set(track, { x: 0 });
        const distance = track.scrollWidth / 2;
        if (distance > 0) tween = gsap.to(track, { x: -distance, duration: distance / 50, ease: 'none', repeat: -1 });
      };
      runMarquee();
      track.addEventListener('mouseenter', () => tween?.pause());
      track.addEventListener('mouseleave', () => tween?.resume());
      document.fonts?.ready.then(runMarquee);
      window.addEventListener('resize', runMarquee, { passive: true });
    });

    if (canAnimate && finePointer.matches) {
      const cursor = document.querySelector('#cursor');
      let cursorShown = false;
      if (cursor) {
        const pointer = { x: 0, y: 0 }, position = { x: 0, y: 0 };
        gsap.set(cursor, { xPercent: -50, yPercent: -50, width: 5, height: 5, autoAlpha: 0, pointerEvents: 'none' });
        window.addEventListener('pointermove', event => {
          pointer.x = event.clientX; pointer.y = event.clientY;
          if (!cursorShown) { cursorShown = true; gsap.to(cursor, { autoAlpha: 1, duration: 0.3 }); }
        }, { passive: true });
        gsap.ticker.add(() => {
          position.x += (pointer.x - position.x) * 0.15;
          position.y += (pointer.y - position.y) * 0.15;
          gsap.set(cursor, { x: position.x, y: position.y });
        });
        document.documentElement.addEventListener('pointerleave', () => { cursorShown = false; gsap.to(cursor, { autoAlpha: 0, duration: 0.3 }); });
        all('a, button').forEach(element => {
          if (element.hasAttribute('data-cursor')) return;
          element.addEventListener('pointerenter', () => gsap.to(cursor, { scale: 0, opacity: 0, duration: 0.3, overwrite: true }));
          element.addEventListener('pointerleave', () => gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.3, overwrite: true }));
        });
        all('[data-cursor]').forEach(element => {
          element.addEventListener('pointerenter', () => {
            cursor.textContent = element.dataset.cursor || 'View';
            cursor.classList.add('is-view');
            gsap.to(cursor, { width: 140, height: 140, yPercent: -75, scale: 1, autoAlpha: 1, duration: 0.3, overwrite: true });
          });
          element.addEventListener('pointerleave', () => {
            cursor.textContent = '';
            cursor.classList.remove('is-view');
            gsap.to(cursor, { width: 5, height: 5, yPercent: -50, scale: 1, autoAlpha: 1, duration: 0.3, overwrite: true });
          });
        });
      }

      all('.magnetic').forEach(element => {
        element.addEventListener('pointermove', event => {
          const bounds = element.getBoundingClientRect();
          gsap.to(element, { x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 60,
            y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 60,
            duration: 1, ease: 'power2.out', overwrite: true });
        });
        element.addEventListener('pointerleave', () => gsap.to(element, { x: 0, y: 0, duration: 1, ease: 'power2.out', overwrite: true }));
      });

      const sharedPreview = document.querySelector('.service-preview');
      if (sharedPreview && !sharedPreview.closest('.service-row, .award-row')) {
        // Fixed previews belong outside the transformed smooth-scroll content.
        document.body.append(sharedPreview);
        Object.assign(sharedPreview.style, { position: 'fixed', top: '0', left: '0' });
      }
      all('.service-row[data-preview], .award-row[data-preview]').forEach(row => {
        const preview = row.querySelector('.service-preview') || sharedPreview;
        const image = preview?.querySelector('img');
        if (!preview || !image) return;
        const localPreview = row.contains(preview);
        gsap.set(preview, { autoAlpha: 0, pointerEvents: 'none' });
        const xTo = gsap.quickTo(preview, 'x', { duration: 0.5, ease: 'power3.out' });
        const yTo = gsap.quickTo(preview, 'y', { duration: 0.5, ease: 'power3.out' });
        row.addEventListener('pointerenter', event => {
          image.src = row.dataset.preview;
          image.alt = '';
          gsap.to(preview, { autoAlpha: 1, duration: 0.3, overwrite: true });
          const bounds = row.getBoundingClientRect();
          gsap.set(preview, { x: event.clientX - (localPreview ? bounds.left : 0), y: event.clientY - (localPreview ? bounds.top : 0) });
        });
        row.addEventListener('pointermove', event => {
          const bounds = row.getBoundingClientRect();
          xTo(event.clientX - (localPreview ? bounds.left : 0));
          yTo(event.clientY - (localPreview ? bounds.top : 0));
        }, { passive: true });
        row.addEventListener('pointerleave', () => gsap.to(preview, { autoAlpha: 0, duration: 0.3, overwrite: true }));
      });
    } else {
      const cursor = document.querySelector('#cursor');
      if (cursor) cursor.hidden = true;
      all('.service-preview').forEach(preview => { preview.hidden = true; });
    }

    all('.hover-button, .button, .btn, .circle-button, [data-button-fill]').forEach(button => {
      let fill = button.querySelector('.button-fill');
      if (canAnimate && button.matches('.button, .hover-button, .btn, [data-button-fill]')) {
        if (!fill) {
          fill = document.createElement('span');
          fill.className = 'button-fill';
          fill.setAttribute('aria-hidden', 'true');
          button.append(fill);
        }
        const baseColor = getComputedStyle(button).backgroundColor;
        Object.assign(button.style, { isolation: 'isolate', position: 'relative', overflow: 'hidden', backgroundColor: baseColor });
        Object.assign(fill.style, { position: 'absolute', left: '50%', top: '50%', width: '520px', height: '520px',
          aspectRatio: 'auto', zIndex: '-1', borderRadius: '50%', pointerEvents: 'none',
          background: 'var(--accent, #ff5100)', transition: 'none' });
        gsap.set(fill, { xPercent: -50, yPercent: -50, scale: 0 });
      }
      const setButtonOrigin = event => {
        const bounds = button.getBoundingClientRect();
        const x = event.clientX - bounds.left, y = event.clientY - bounds.top;
        button.style.setProperty('--button-x', `${x}px`);
        button.style.setProperty('--button-y', `${y}px`);
        if (fill) { fill.style.left = `${x}px`; fill.style.top = `${y}px`; }
      };
      button.addEventListener('pointerenter', event => {
        setButtonOrigin(event);
        if (fill && canAnimate) gsap.to(fill, { scale: 1, duration: 0.6, ease: 'power2.out', overwrite: true });
      });
      button.addEventListener('pointerleave', event => {
        setButtonOrigin(event);
        if (fill && canAnimate) gsap.to(fill, { scale: 0, duration: 0.6, ease: 'power2.out', overwrite: true });
      });
      if (fill && canAnimate) {
        button.addEventListener('focus', () => {
          fill.style.left = '50%'; fill.style.top = '50%';
          gsap.to(fill, { scale: 1, duration: 0.6, ease: 'power2.out', overwrite: true });
        });
        button.addEventListener('blur', () => gsap.to(fill, { scale: 0, duration: 0.6, ease: 'power2.out', overwrite: true }));
      }
    });

    all('.walkthrough-slider').forEach(slider => {
      const track = slider.querySelector('.walkthrough-track');
      if (!track) return;
      const cards = all(':scope > .walkthrough-card', track);
      if (!cards.length) return;
      const region = slider.parentElement;
      const previous = region.querySelector('.slider-prev');
      const next = region.querySelector('.slider-next');
      const sliderStatus = region.querySelector('.slider-status');
      let visibleCards = 1, clones = 0, step = 0, activeIndex = 0;
      let moving = false, animation = null, fallbackTimer = 0, autoplayTimer = 0;
      let queuedDirection = 0, hovered = false, focused = false, layoutWidth = 0;
      let touchStart = null;
      const normalizedIndex = index => (index % cards.length + cards.length) % cards.length;
      Object.assign(slider.style, { overflow: 'hidden', touchAction: 'pan-y' });
      Object.assign(track.style, { display: 'flex', gap: '10px', width: 'max-content', willChange: 'transform' });
      slider.setAttribute('aria-roledescription', 'carousel');
      cards.forEach((card, index) => {
        card.setAttribute('role', 'group');
        card.setAttribute('aria-roledescription', 'slide');
        card.setAttribute('aria-label', `${index + 1} of ${cards.length}`);
      });
      const stopAutoplay = () => window.clearTimeout(autoplayTimer);
      const updateSliderAccessibility = (announce = false) => {
        const index = normalizedIndex(activeIndex);
        all(':scope > .walkthrough-card', track).forEach((card, position) => {
          const visible = position >= index + clones && position < index + clones + visibleCards;
          card.inert = !visible;
          card.setAttribute('aria-hidden', String(!visible));
          if (card.dataset.sliderClone) all('a, button, [tabindex]', card).forEach(element => {
            element.tabIndex = visible ? 0 : -1;
          });
        });
        if (sliderStatus) {
          sliderStatus.setAttribute('aria-live', announce ? 'polite' : 'off');
          sliderStatus.textContent = `${index + 1} / ${cards.length}`;
        }
      };
      const setTrackPosition = () => {
        const x = -(activeIndex + clones) * step;
        if (gsap) gsap.set(track, { x });
        else { track.style.transition = 'none'; track.style.transform = `translate3d(${x}px,0,0)`; }
      };
      const scheduleAutoplay = () => {
        stopAutoplay();
        if (!canAnimate || reduceMotion.matches || document.hidden || hovered || focused || moving || cards.length <= visibleCards) return;
        autoplayTimer = window.setTimeout(() => moveSlide(1, false), 3000);
      };
      const finishSlide = announce => {
        activeIndex = normalizedIndex(activeIndex);
        moving = false;
        animation = null;
        setTrackPosition();
        updateSliderAccessibility(announce);
        if (queuedDirection) {
          const direction = queuedDirection;
          queuedDirection = 0;
          moveSlide(direction, true);
        } else scheduleAutoplay();
      };
      const moveSlide = (direction, announce = true) => {
        if (cards.length <= visibleCards) return;
        stopAutoplay();
        if (moving) { queuedDirection = direction; return; }
        moving = true;
        activeIndex += direction;
        const x = -(activeIndex + clones) * step;
        if (reduceMotion.matches) {
          setTrackPosition();
          finishSlide(announce);
        } else if (gsap) {
          animation = gsap.to(track, { x, duration: 1.5, ease: 'power1.inOut', overwrite: true,
            onComplete: () => finishSlide(announce) });
        } else {
          track.style.transition = 'transform 1.5s cubic-bezier(.25,.1,.25,1)';
          track.style.transform = `translate3d(${x}px,0,0)`;
          fallbackTimer = window.setTimeout(() => finishSlide(announce), 1500);
        }
      };
      const copyCard = card => {
        const clone = card.cloneNode(true);
        clone.dataset.sliderClone = 'true';
        clone.setAttribute('aria-hidden', 'true');
        clone.inert = true;
        clone.removeAttribute('id');
        all('[id]', clone).forEach(element => element.removeAttribute('id'));
        all('a, button, input, textarea, select, [tabindex]', clone).forEach(element => { element.tabIndex = -1; });
        return clone;
      };
      const layoutSlider = () => {
        const width = slider.clientWidth;
        if (!width) return;
        stopAutoplay();
        animation?.kill();
        window.clearTimeout(fallbackTimer);
        moving = false;
        queuedDirection = 0;
        activeIndex = normalizedIndex(activeIndex);
        all('[data-slider-clone]', track).forEach(clone => clone.remove());
        visibleCards = Math.min(window.innerWidth >= 1200 ? 2 : 1, cards.length);
        clones = cards.length > visibleCards ? visibleCards : 0;
        if (clones) {
          const before = document.createDocumentFragment(), after = document.createDocumentFragment();
          cards.slice(-clones).forEach(card => before.append(copyCard(card)));
          cards.slice(0, clones).forEach(card => after.append(copyCard(card)));
          track.prepend(before);
          track.append(after);
        }
        const cardWidth = Math.max(1, (width - 10 * (visibleCards - 1)) / visibleCards);
        step = cardWidth + 10;
        all(':scope > .walkthrough-card', track).forEach(card => {
          card.style.flex = `0 0 ${cardWidth}px`;
          card.style.width = `${cardWidth}px`;
        });
        [previous, next].filter(Boolean).forEach(button => {
          button.disabled = !clones;
          button.setAttribute('aria-disabled', String(!clones));
        });
        setTrackPosition();
        updateSliderAccessibility();
        layoutWidth = width;
        scheduleAutoplay();
      };
      previous?.addEventListener('click', event => { event.preventDefault(); moveSlide(-1); });
      next?.addEventListener('click', event => { event.preventDefault(); moveSlide(1); });
      region.addEventListener('mouseenter', () => { hovered = true; stopAutoplay(); });
      region.addEventListener('mouseleave', () => { hovered = false; scheduleAutoplay(); });
      region.addEventListener('focusin', () => { focused = true; stopAutoplay(); });
      region.addEventListener('focusout', event => {
        if (!region.contains(event.relatedTarget)) { focused = false; scheduleAutoplay(); }
      });
      document.addEventListener('visibilitychange', () => document.hidden ? stopAutoplay() : scheduleAutoplay());
      slider.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'mouse') touchStart = { x: event.clientX, y: event.clientY };
      }, { passive: true });
      slider.addEventListener('pointerup', event => {
        if (!touchStart) return;
        const deltaX = event.clientX - touchStart.x, deltaY = event.clientY - touchStart.y;
        touchStart = null;
        if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) moveSlide(deltaX < 0 ? 1 : -1);
      }, { passive: true });
      slider.addEventListener('pointercancel', () => { touchStart = null; }, { passive: true });
      if (window.ResizeObserver) new ResizeObserver(() => {
        if (slider.clientWidth !== layoutWidth) layoutSlider();
      }).observe(slider);
      window.addEventListener('resize', layoutSlider, { passive: true });
      layoutSlider();
    });

    const form = document.querySelector('#contact-form');
    const status = document.querySelector('#form-status');
    form?.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const fields = new FormData(form);
      const field = name => String(fields.get(name) || fields.get(name.toLowerCase()) || '').trim();
      const name = field('Name'), email = field('Email'), project = field('Project');
      const subject = name ? `Portfolio enquiry from ${name}` : 'Portfolio project enquiry';
      const body = `Name: ${name}\nEmail: ${email}\n\nProject details:\n${project}`;
      if (status) status.textContent = 'Opening your email app with your project details. Please send the email there.';
      window.location.href = `mailto:zacharyswanepoel9@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });

    const refresh = () => ScrollTrigger?.refresh();
    window.addEventListener('load', refresh, { once: true });
    document.fonts?.ready.then(refresh);
    all('img').filter(image => !image.complete).forEach(image => image.addEventListener('load', refresh, { once: true }));

    reduceMotion.addEventListener('change', () => {
      // Rebuild all scroll calculations and animations with the new preference.
      window.location.reload();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPortfolio, { once: true });
  else initPortfolio();
})();
