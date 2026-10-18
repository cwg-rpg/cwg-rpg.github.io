/* Pets and Companions (Anya etc.) - public wording (Supporter and Commands tabs removed 2026-10-19, user) */
(function (K) {
  const { W, I, M, esc, link, tag, fmt, ilink, mlink, gen, P, INDEX, KL, subtabs, filterBox } = K;
  const CO = W.companions, PE = W.pets;
  const ul = a => a && a.length ? `<ul>${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
  /* ---- companions ---- */
  const compCard = c => `<div class="card"><h3>${I[c.item.id] ? ilink(c.item.id) : esc(c.item.name)} <span class="small">becomes ${mlink(c.unit.id)}</span></h3><div class="kv"><b>Effect</b><span>${esc(c.effect)}</span><b>How to get</b><span>${esc(c.obtained)}${(c.drops_from || []).length ? ' ' + c.drops_from.map(d => mlink(d.id)).join(', ') : ''}</span>${(c.made_from || []).length ? `<b>Made from</b><span>${gen(c.made_from)}</span>` : ''}${(c.crafts_into || []).length ? `<b>Crafts into</b><span>${gen(c.crafts_into)}</span>` : ''}${(c.notes || []).length ? `<b>Notes</b><span>${ul(c.notes)}</span>` : ''}</div></div>`;
  /* ---- pets ---- */
  const first = s => String(s).split(/(?<=[.;])\s/)[0];
  const aura = p => (p.summoned || []).filter(s => !/^(Magic immunity|Nothing|No aura|No magic)/.test(s) && !/only a label/.test(s)).map(first).map(s => s.replace(/\s*No magic immunity\.?$/, ''));
  P.pets = id => {
    const V = PE.view || { pets: [] }; const byCode = {}; for (const p of PE.pets) byCode[p.code] = p;
    const line = (lab, cls, v) => v && v !== 'Same' ? `<div class="${cls}"><span>${lab}</span> ${esc(v)}</div>` : '';
    const heroCell = v => v.cosmetic ? '<span class="small">Cosmetic</span>' : v.hero ? `<div>${esc(v.hero)}</div>${line('Evolved', 'pv-evo', v.hero_evo)}${v.full ? `<div class="pv-full"><span>Full set</span> ${esc(v.full)}${v.both ? `<span class="pv-and">with stone</span> ${esc(v.both)}` : ''}</div>` : ''}` : '<span class="small">-</span>';
    const petCell = v => v.pet ? `<div>${esc(v.pet)}</div>${line('Evolved', 'pv-evo', v.pet_evo)}` : '<span class="small">-</span>';
    const nameCell = v => `<img class="pv-ic" src="${v.img || `img/pets/${v.icon}.png`}" alt="" loading="eager"><a href="#pets/${v.code}"><b>${esc(v.name)}</b></a><div class="small">${esc(v.title)}</div>${v.evo ? `<div class="small">Evolves into ${esc(v.evo)}</div>` : ''}`;
    const row = v => `<tr class="${v.note ? 'pv-has' : ''}"><td class="pv-name">${nameCell(v)}</td><td>${heroCell(v)}</td><td>${petCell(v)}</td></tr>${v.note ? `<tr class="pv-note"><td></td><td colspan="2">${esc(v.note)}</td></tr>` : ''}`;
    const table = list => `<div class="tbl"><table class="pv"><tr><th>Pet</th><th>Hero bonus</th><th>While summoned</th></tr>${list.map(row).join('')}</table></div>`;
    const head = `<p class="small">Hero bonus: what your hero gets. While summoned: what the pet does when it's out and near you.</p><p class="small">${esc(V.evolve || '')}${PE.evolution_stone ? ' ' + ilink(PE.evolution_stone.id) : ''}</p><p class="small">${esc(V.fullset || '')}</p>`;
    if (id) { const v = V.pets.find(x => x.code === id); if (!v) return '<p>Unknown pet.</p>';
      return `<h2>${esc(v.name)} <span class="small">${esc(v.title)}</span></h2><p class="small">${link('pets', '', 'All pets')}</p>${table([v])}${head}${v.code === 'P13' && byCode.P13 && byCode.P13.obtained_item ? `<p>Unlock item: ${ilink(byCode.P13.obtained_item.id)}</p>` : ''}`; }
    return `<h2>Pets</h2><p class="small">${esc(V.intro || '')}</p>
    <div class="card hi"><ul style="margin:0">${(V.owner_rules || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
    ${head}${table(V.pets)}
    <h3>Companions</h3><p class="small">Put one in a storage bag and the bag becomes the companion. Anya is free with every hero and handles -autopickup.</p><div class="tbl"><table><tr><th>Companion</th><th>Bonus</th></tr>${CO.items.map(c => `<tr><td>${ilink(c.item.id)}</td><td class="small">${esc((s => /^No (aura|stats)/.test(s) ? (/Anya/.test(c.item.name) ? 'Auto-pickup helper' : 'Cosmetic') : s.charAt(0).toUpperCase() + s.slice(1).replace(/[;,]$/, '.'))(String(c.effect).replace(/^Ownership bonus \([^)]*\): /, '').split(/(?<=[.;])\s/)[0]))}</td></tr>`).join('')}</table></div>
    <details><summary>How pets work</summary>${ul(V.rules || [])}</details>`;
  };

  KL.companions = 'Companion'; KL.pets = 'Pet';
  for (const c of CO.items) INDEX.push({ k: 'pets', id: '', t: c.item.name + ' (' + c.unit.name + ')', s: 'companion · ' + c.effect.slice(0, 100), w: 3 });
  for (const p of PE.pets) INDEX.push({ k: 'pets', id: p.code, t: p.code + ' ' + p.name, s: 'pet · ' + (p.passive ? p.passive.text : (p.summoned || [''])[0]).slice(0, 100), w: 3 });
})(window.WK);
