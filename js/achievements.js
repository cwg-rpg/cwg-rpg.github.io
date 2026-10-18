/* Achievements tab (map 1.2.2): the journal's 311 entries from the map script, summary + searchable list by tab */
(function (K) {
  const { W, M, esc, link, subtabs, filterBox, P, INDEX, KL } = K;
  const A = W.achievements; if (!A) return;
  const LIST = A.list || [], PG = A.page || {};
  const CATS = [...new Set(LIST.map(a => a.category))];
  const tableHtml = t => { const body = `<div class="tbl compact${(t.columns || []).length <= 3 ? ' fit' : ''}"><table><tr>${(t.columns || []).map(c => `<th>${esc(c)}</th>`).join('')}</tr>${(t.rows || []).map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div>`;
    return t.collapsed ? `<details class="tcol"><summary>${esc(t.title || '')}</summary>${body}</details>` : `<h4>${esc(t.title || '')}</h4>${body}`; };
  const bossLink = id => id && M[id] ? link('monster', id, M[id].name) : '';
  const num = n => Number(n).toLocaleString('en-US');
  const row = a => `<tr><td><b>${esc(a.name)}</b>${a.boss && M[a.boss] ? `<br><span class="small">${bossLink(a.boss)}</span>` : ''}</td><td class="small">${esc(a.goal)}${a.target > 1 && !/\d/.test(a.goal) ? ` <span class="small">(${num(a.target)})</span>` : ''}</td><td class="small">${esc(a.reward)}</td>${a.scope && a.scope !== 'Character' ? `<td class="small">${esc(a.scope)}</td>` : '<td></td>'}</tr>`;
  P.achievements = (id, f) => {   /* #achievements/<name> (search hits) = search for that name */
    const cat = CATS.includes(f.cat) ? f.cat : CATS[0]; const q0 = f.q || id || ''; const q = q0.toLowerCase();
    const hit = a => !q || [a.name, a.goal, a.reward, a.group, a.boss && M[a.boss] ? M[a.boss].name : ''].join(' ').toLowerCase().includes(q);
    const rows = LIST.filter(a => (q ? true : a.category === cat) && hit(a));
    const groups = [...new Set(rows.map(a => (q ? a.category + ' · ' : '') + a.group))];
    const head = `<h2>${esc(PG.title || 'Achievements')}</h2><p>${esc(PG.what || '')}${PG.open ? ` <span class="small">· ${esc(PG.open)}</span>` : ''}</p>${(PG.how || []).length ? `<ol>${PG.how.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}${(PG.tips || []).length ? `<div class="card hi">${PG.tips.map(x => `<p style="margin:0">${esc(x)}</p>`).join('')}</div>` : ''}${(PG.tables || []).map(tableHtml).join('')}`;
    return `${head}<h3>Journal</h3>${q ? '' : subtabs('achievements', 'cat', CATS.map(c => [c, `${c} (${LIST.filter(a => a.category === c).length})`]), cat)}${filterBox('search every achievement (name, boss, goal, reward)', q0)}<p class="small">${rows.length} ${q ? 'matches in all tabs' : 'achievements in ' + esc(cat)}.</p>
      ${groups.map(g => { const rs = rows.filter(a => (q ? a.category + ' · ' : '') + a.group === g); return `<h4>${esc(g)} <span class="small">${rs.length}</span></h4><div class="tbl compact"><table><tr><th>Achievement</th><th>Goal</th><th>Reward</th><th></th></tr>${rs.map(row).join('')}</table></div>`; }).join('')}`;
  };
  KL.achievements = 'Achievement';
  for (const a of LIST) INDEX.push({ k: 'achievements', id: a.name, t: a.name, s: 'achievement · ' + a.goal, w: 1 });
})(window.WK);
