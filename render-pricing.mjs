// Build-time pricing renderer. One JSON source drives every plan and its full inclusions.
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderPricing(data) {
  if (!Array.isArray(data.categories) || data.categories.length !== 3) throw new Error('Expected exactly three pricing categories');
  return data.categories.map((category, categoryIndex) => {
    if (category.tiers.length !== 3 || !category.features.every(row => row[1].length === 3)) throw new Error('Pricing data shape mismatch');
    const cards = category.tiers.map((tier, index) => {
      const highlights = category.features.slice(0,4).map(([label,values]) => `<li><span>${esc(label)}</span><strong>${esc(values[index])}</strong></li>`).join('');
      const inclusions = category.features.map(([label,values]) => `<li><span>${esc(label)}</span><strong>${esc(values[index])}</strong></li>`).join('');
      return `<article class="plan ${tier.recommended?'plan--recommended':''}" aria-label="${esc(tier.name)}">
        ${tier.recommended?'<span class="plan-ribbon">Recommended</span>':'<span class="plan-ribbon plan-ribbon--blank" aria-hidden="true">&nbsp;</span>'}
        <div class="plan-main"><p class="plan-kind">${esc(category.tab)}</p><h3>${esc(tier.name)}</h3><div class="plan-price">${esc(tier.price)}</div><p class="plan-cadence">${esc(tier.cadence)}</p><p class="plan-description">${esc(tier.description)}</p></div>
        <ul class="plan-highlights">${highlights}</ul>
        <details class="plan-inclusions"><summary>View all inclusions <span aria-hidden="true">+</span></summary><ul>${inclusions}</ul></details>
        <a class="plan-action ${tier.recommended?'plan-action--primary':''}" href="#contact" data-inquiry-category="${esc(category.tab)}" data-inquiry-plan="${esc(tier.name)}">Request this plan <span aria-hidden="true">↗</span></a>
      </article>`;
    }).join('');
    return `<div class="price-panel" id="panel-${category.id}" role="tabpanel" aria-labelledby="tab-${category.id}" tabindex="0" ${categoryIndex?'hidden':''}>
      <p class="pricing-eyebrow">${esc(category.eyebrow)}</p>
      <div class="plan-grid">${cards}</div>
      <p class="pricing-scope">${esc(category.terms)}</p>
    </div>`;
  }).join('');
}
