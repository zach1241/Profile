(function () {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let observer;
  if ('IntersectionObserver' in window && !motion.matches) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('is-pending');
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px 40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => {
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.classList.add('is-pending');
        observer.observe(el);
      }
    });
  }
  const showAll = () => {
    observer?.disconnect();
    document.querySelectorAll('.is-pending').forEach(el => el.classList.remove('is-pending'));
  };
  motion.addEventListener?.('change', showAll);
  window.addEventListener('beforeprint', showAll);
  document.querySelectorAll('.clients-section').forEach(section => {
    const buttons = Array.from(section.querySelectorAll('[data-filter]'));
    const projects = Array.from(section.querySelectorAll('[data-categories]'));
    const count = section.querySelector('.filter-count');
    buttons.forEach(button => button.addEventListener('click', () => {
      let shown = 0;
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      projects.forEach(project => {
        project.hidden = button.dataset.filter !== 'all' && !project.dataset.categories.split(' ').includes(button.dataset.filter);
        if (!project.hidden) {
          shown++;
          project.classList.remove('is-pending');
          observer?.unobserve(project);
        }
      });
      if (count) count.textContent = shown + (shown === 1 ? ' project' : ' projects');
    }));
  });
})();
