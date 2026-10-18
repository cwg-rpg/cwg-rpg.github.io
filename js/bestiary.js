/* Bestiary tab (map 1.2.2, own tab since 2026-10-19, user): page text + tables from the Game Systems JSON, then every entry by realm */
(function (K) {
  const { W, M, esc, mlink, subtabs, filterBox, P, INDEX, KL } = K;
  const B = W.bestiary, PG = (W.systems || {}).bestiary; if (!B || !PG) return;
  const E = Object.entries(B.entries || {}).map(([id, e]) => ({ id, ...e })).filter(e => M[e.id]);
  const REALMS = [...new Set(E.map(e => e.realm))];
  const RANK = { Normal: 0, Colossal: 1, Named: 2, Raid: 3 };
  const pct = v => (v < 0.01 ? v.toFixed(3) : v < 1 ? +v.toFixed(2) : +v.toFixed(1)) + '%';
  const SKIP = /^Milestones$/;   /* every 10% = +5% is already in the intro line */
  const table = t => `<h4>${esc(t.title || '')}</h4><div class="tbl compact${(t.columns || []).length <= 3 ? ' fit' : ''}"><table><tr>${(t.columns || []).map(c => `<th>${esc(c)}</th>`).join('')}</tr>${(t.rows || []).map(r => `<tr>${r.map(c => `<td class="${typeof c === 'number' ? 'num' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div>`;
  P.bestiary = (id, f) => {
    const realm = REALMS.includes(f.realm) ? f.realm : REALMS[0]; const q0 = f.q || id || ''; const q = q0.toLowerCase();
    const rows = E.filter(e => q ? M[e.id].name.toLowerCase().includes(q) : e.realm === realm).sort((a, b) => (RANK[a.rarity] ?? 9) - (RANK[b.rarity] ?? 9) || M[a.id].name.localeCompare(M[b.id].name));
    return `<h2>Bestiary</h2><p>${esc(PG.what || '')}${PG.open ? ` <span class="small">· ${esc(PG.open)}</span>` : ''}</p>
      ${(PG.tables || []).filter(t => !SKIP.test(t.title || '')).map(table).join('')}
      <h3>Entries</h3>${q ? '' : subtabs('bestiary', 'realm', REALMS.map(r => [r, `${r} (${E.filter(e => e.realm === r).length})`]), realm)}${filterBox('search a monster in every realm', q0)}
      <div class="tbl compact"><table class="sortable"><tr><th>Monster</th>${q ? '<th>Realm</th>' : ''}<th>Type</th><th class="num">Chance per kill</th></tr>${rows.map(e => `<tr><td>${mlink(e.id)}</td>${q ? `<td class="small">${esc(e.realm)}</td>` : ''}<td class="small">${esc(e.rarity)}</td><td class="num">${pct(e.chance_pct)}</td></tr>`).join('')}</table></div>`;
  };
  KL.bestiary = 'Bestiary';
  INDEX.push({ k: 'bestiary', id: '', t: 'Bestiary', s: 'monster collection · +50% to Potential, Attribute and Relic effects', w: 3 });
})(window.WK);
