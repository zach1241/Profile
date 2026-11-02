(() => {
  'use strict';
  const tabs = [...document.querySelectorAll('[data-price-tab]')];
  const ids = tabs.map(t => t.dataset.priceTab);
  const panels = new Map(ids.map(id => [id, document.getElementById('panel-'+id)]));
  const service = document.getElementById('inquiry-service');
  const plan = document.getElementById('inquiry-plan');
  const serviceName = {seo:'SEO',ads:'Paid Advertising',web:'Web Design'};
  const getPlans = category => [...(panels.get(category)?.querySelectorAll('[data-inquiry-plan]') || [])].map(a => a.dataset.inquiryPlan);
  const fillPlanOptions = (preferred) => {
    const category = Object.keys(serviceName).find(id => serviceName[id] === service.value);
    const names = category ? getPlans(category) : [];
    plan.replaceChildren(...['Not sure yet', ...names].map(name => new Option(name,name)));
    if (names.includes(preferred)) plan.value = preferred;
  };
  function selectCategory(id, focus=false, updateUrl=true) {
    if (!ids.includes(id)) return;
    for (const tab of tabs) {
      const active = tab.dataset.priceTab === id;
      tab.setAttribute('aria-selected',String(active));
      tab.tabIndex = active ? 0 : -1;
      panels.get(tab.dataset.priceTab).hidden = !active;
      if (active && focus) tab.focus();
    }
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set('service', id);
      history.replaceState(null,'',url.pathname+url.search+url.hash);
    }
    window.ScrollTrigger?.refresh();
    document.dispatchEvent(new CustomEvent('agency:pricing-change',{detail:{category:id}}));
  }
  tabs.forEach((tab,index) => {
    tab.addEventListener('click',() => selectCategory(tab.dataset.priceTab,true));
    tab.addEventListener('keydown',event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length-1 : (index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      selectCategory(ids[next],true);
    });
  });
  const initial = new URLSearchParams(location.search).get('service');
  selectCategory(ids.includes(initial) ? initial : 'seo',false,false);
  document.querySelectorAll('[data-select-category]').forEach(link=>link.addEventListener('click',()=>selectCategory(link.dataset.selectCategory)));
  document.querySelectorAll('[data-inquiry-category]').forEach(link=>link.addEventListener('click',()=>{
    service.value=link.dataset.inquiryCategory;
    fillPlanOptions(link.dataset.inquiryPlan);
  }));
  service?.addEventListener('change',()=>fillPlanOptions());
  fillPlanOptions();
  const nav = document.getElementById('nav-links');
  const toggle = document.getElementById('menu-toggle');
  const closeMenu = (returnFocus=false) => {nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');if(returnFocus)toggle.focus();};
  toggle?.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');if(open)nav.querySelector('a')?.focus();});
  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>closeMenu()));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('is-open'))closeMenu(true);});
  document.getElementById('proposal-form')?.addEventListener('submit',event=>{
    event.preventDefault();
    const form=event.currentTarget;
    if(!form.reportValidity())return;
    const fields=new FormData(form);
    const title='Local Presence 360 inquiry — '+fields.get('service')+' / '+fields.get('plan');
    const body=[
      'Name: '+fields.get('name'),
      'Reply email: '+fields.get('email'),
      'Website: '+(fields.get('website')||'Not provided'),
      'Service: '+fields.get('service'),
      'Plan: '+fields.get('plan'),
      '',
      'Project details:',
      fields.get('message'),
      '',
      'Please contact me to discuss scope and, if suitable, an Upwork contract.'
    ].join('\n');
    const mailto='mailto:zacharyswanepoel9@gmail.com?subject='+encodeURIComponent(title)+'&body='+encodeURIComponent(body);
    document.getElementById('form-note').textContent='Your email app should open with your inquiry prepared. Review it and click Send there. If it does not open, use the email address on the left or book a consultation.';
    window.location.href=mailto;
  });
  // The Upwork profile is optional until the real, verified URL is configured.
  const upworkLink = document.getElementById('upwork-profile-link');
  const upworkValue = window.LocalPresence360Config?.upworkProfileUrl?.trim();
  if (upworkValue && upworkLink) {
    try {
      const url = new URL(upworkValue);
      if (url.protocol === 'https:' && (url.hostname === 'upwork.com' || url.hostname.endsWith('.upwork.com'))) {
        upworkLink.href = url.href;
        upworkLink.hidden = false;
      }
    } catch { /* Unconfigured or invalid URL: do not display a broken link. */ }
  }
  document.getElementById('year').textContent=String(new Date().getFullYear());
  // About tabs share the same keyboard pattern as pricing.
  const aboutTabs=[...document.querySelectorAll('[data-about-tab]')];
  function setAbout(index,focus=false){aboutTabs.forEach((tab,i)=>{const active=i===index;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=!active;if(active&&focus)tab.focus();});window.ScrollTrigger?.refresh();}
  aboutTabs.forEach((tab,index)=>{tab.addEventListener('click',()=>setAbout(index));tab.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();setAbout(event.key==='Home'?0:event.key==='End'?aboutTabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+aboutTabs.length)%aboutTabs.length,true);});});
  const track=document.getElementById('services-track');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function moveServices(direction){if(window.AgencyMotion?.moveServices?.(direction))return;const amount=track.querySelector('.service-card').getBoundingClientRect().width;track.scrollBy({left:direction*amount,behavior:reduced?'instant':'smooth'});}
  document.querySelector('[data-service-prev]')?.addEventListener('click',()=>moveServices(-1));
  document.querySelector('[data-service-next]')?.addEventListener('click',()=>moveServices(1));
})();
