/* CWG RPG Wiki - core: data access, shared helpers, search index, router. Pages register themselves on WK.P. */
window.WK = (function () {
  const W = window.CWG, ICONS = window.CWG_ICONS || {};
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const link = (kind, id, text) => `<a href="#${kind}/${encodeURIComponent(id)}">${esc(text != null ? text : id)}</a>`;
  const fmt = n => { if (n == null || n === '') return ''; const v = Number(n); if (!isFinite(v)) return String(n); let d = 3; if (v !== 0 && Math.abs(v) < 0.001) d = Math.min(12, Math.ceil(-Math.log10(Math.abs(v))) + 2); return v.toLocaleString(undefined, { maximumFractionDigits: d }); };
  const pct = c => c == null ? '' : (c >= 1 ? fmt(c) : Number(c).toPrecision(2).replace(/\.?0+$/, '')) + '%';
  const tag = (t, cls) => `<span class="tag ${cls || ''}">${esc(t)}</span>`;

  /* ---- items ---- */
  const I = W.items, M = W.monsters, R = W.recipes, Z = {}; for (const z of W.zones) Z[z.id] = z;
  const icon = id => ICONS[id] ? `<img class="ico" src="data:image/webp;base64,${ICONS[id]}" alt="">` : '';
  const iname = i => `<span style="${i.color ? 'color:' + i.color : ''}">${esc(i.name)}</span>`;
  const ilink = id => { const i = I[id]; return i ? `<a href="#item/${id}">${icon(id)}${iname(i)}</a>` : esc(id); };
  const statLine = s => esc(s[0]) + ' +' + fmt(s[1]) + (s[2] ? '%' : '');
  const tipHtml = t => esc(t || '').replace(/\|n/g, '<br>').replace(/\|c[0-9a-fA-F]{2}([0-9a-fA-F]{6})/g, (m, c) => `<span style="color:#${c}">`).replace(/\|r/gi, '</span>');
  const madeBy = id => R.filter(r => r.out === id);
  const usedIn = id => R.filter(r => r.in.some(([k]) => k === id));
  const mlink = id => { const m = M[id]; return m ? link('monster', id, m.name) : esc((W.units || {})[id] || id); };
  const zlink = id => { const z = Z[id]; return z ? link('zone', id, z.name) + ` <span class="small">(${esc(z.realm)})</span>` : esc(id || ''); };

  /* ---- recipes ---- */
  const rrow = r => `<tr><td>${ilink(r.out)}</td><td class="small">${r.in.map(([k, n]) => (n > 1 ? fmt(n) + '× ' : '') + ilink(k)).join(' + ')}</td><td class="num">${(r.chance_eff != null ? r.chance_eff : r.chance) != null ? pct(r.chance_eff != null ? r.chance_eff : r.chance) : ''}</td><td class="small">${esc(r.kind)}</td></tr>`;
  const rtable = rs => rs.length ? `<div class="tbl"><table><tr><th>Result</th><th>Materials</th><th class="num">Success</th><th>Kind</th></tr>${rs.map(rrow).join('')}</table></div>` : '';

  /* ---- generic renderer for findings prose (dict/list/string) ---- */
  function gen(v, depth) {
    depth = depth || 0;
    if (v == null) return '';
    if (typeof v === 'object' && !Array.isArray(v) && v.id && v.name && Object.keys(v).length <= 2) return I[v.id] ? ilink(v.id) : M[v.id] ? mlink(v.id) : esc(v.name);
    if (Array.isArray(v)) { if (!v.length) return '<span class="small">-</span>'; return v.every(x => typeof x !== 'object') ? `<ul>${v.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : v.every(x => x && x.id && x.name && Object.keys(x).length <= 2) ? v.map(x => gen(x)).join(', ') : v.map(x => `<div class="card">${gen(x, depth + 1)}</div>`).join(''); }
    if (typeof v === 'object') return `<div class="kv">${Object.entries(v).filter(([k]) => !k.startsWith('_')).map(([k, x]) => `<b>${esc(k.replace(/_/g, ' '))}</b><span>${typeof x === 'object' ? gen(x, depth + 1) : esc(x)}</span>`).join('')}</div>`;
    return esc(v);
  }

  /* ---- search index ---- */
  const INDEX = []; const KL = {};
  function search(q) {
    q = q.trim().toLowerCase(); if (q.length < 2) return []; const words = q.split(/\s+/);
    return INDEX.map(e => { const t = e.t.toLowerCase(), s = (e.s || '').toLowerCase(); let sc = 0; for (const w of words) { if (t === w) sc += 10; else if (t.startsWith(w)) sc += 6; else if (t.includes(w)) sc += 4; else if (s.includes(w)) sc += 1; else return null; } return { e, sc: sc + e.w }; })
      .filter(Boolean).sort((a, b) => b.sc - a.sc || a.e.t.length - b.e.t.length).slice(0, 80);
  }
  function fuzzy(q) { q = q.trim().toLowerCase(); if (q.length < 4) return []; return INDEX.map(e => { const best = Math.max(...e.t.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map(w => sim(q, w))); return { e, sc: best }; }).filter(x => x.sc >= 0.5).sort((a, b) => b.sc - a.sc).slice(0, 30); }
  function renderSearch(q) {
    let hits = search(q); const out = $('#out'); let note = '';
    if (!hits.length) { hits = fuzzy(q); note = hits.length ? `<p class="small">No exact match - showing close names.</p>` : ''; }
    $('#qcount').textContent = hits.length ? hits.length + ' results' : '';
    if (!hits.length) { out.innerHTML = `<p class="small">No match for "${esc(q)}".</p>`; return; }
    const g = {}; for (const h of hits) (g[h.e.k] = g[h.e.k] || []).push(h);
    out.innerHTML = `<h2>Search: ${esc(q)}</h2>${note}` + Object.keys(KL).filter(k => g[k]).map(k => `<h3>${KL[k]}</h3>` + g[k].map(h => `<div class="hit"><a href="#${h.e.k}/${encodeURIComponent(h.e.id)}">${h.e.k === 'item' ? icon(h.e.id) : ''}${esc(h.e.t)}</a> <span class="small">${esc(String(h.e.s || '').split(' · ')[0]).slice(0, 40)}</span></div>`).join('')).join('');
  }

  /* ---- router ---- */
  const P = {}; const filters = {}; const hooks = [];
  let lastView = '';
  function route() {
    const out = $('#out'); const raw = location.hash.slice(1) || 'home'; let [page, rest] = raw.split('/'); const id = rest ? decodeURIComponent(rest) : '';
    const y0 = window.scrollY;
    if (page.includes('?')) { const [p, qs] = page.split('?'); page = p; Object.assign(filters, Object.fromEntries(new URLSearchParams(qs))); history.replaceState(null, '', '#' + page + (rest ? '/' + rest : '')); }
    const f = { ...filters };
    document.querySelectorAll('nav.tabs a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + page));
    const fn = P[page] || P.home; out.innerHTML = fn(id, f);
    out.querySelectorAll('.sub-tabs a[data-f]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); const [k, v] = a.dataset.f.split('='); filters[k] = decodeURIComponent(v); route(); }));
    const q = out.querySelector('input.filter'); if (q) q.addEventListener('input', e => { filters[q.dataset.key || 'q'] = e.target.value; const pos = e.target.selectionStart; route(); const n = out.querySelector('input.filter'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } });
    out.querySelectorAll('table.sortable').forEach(tb => tb.querySelectorAll('tr:first-child th').forEach((th, ci) => { th.style.cursor = 'pointer'; th.title = 'click to sort'; th.addEventListener('click', () => {
      const rows = [...tb.querySelectorAll('tr')].slice(1); const num = s => { const v = parseFloat(String(s).replace(/[,%+]/g, '')); return isNaN(v) ? null : v; };
      const dir = th.dataset.dir === 'asc' ? 'desc' : 'asc'; th.dataset.dir = dir;
      rows.sort((a, b) => { const x = a.children[ci] ? a.children[ci].textContent.trim() : '', y = b.children[ci] ? b.children[ci].textContent.trim() : ''; const nx = num(x), ny = num(y); const r = nx != null && ny != null ? nx - ny : x.localeCompare(y); return dir === 'asc' ? r : -r; });
      rows.forEach(r => tb.appendChild(r)); }); }));
    for (const h of hooks) h(page, out);
    alignNums(out);
    const view = page + '/' + id; const same = view === lastView; lastView = view;
    if (out.querySelector('input.filter:focus') || same) window.scrollTo(0, y0); else window.scrollTo(0, 0);
    saveLast();
  }
  /* come back to the same page after the viewer reloads the wiki (a republish reloads every open copy) */
  const LAST = 'cwgLast'; const saveLast = () => { try { localStorage.setItem(LAST, JSON.stringify({ h: location.hash, f: filters, y: window.scrollY, t: Date.now() })); } catch (e) { } };
  function start() {
    try { const s = JSON.parse(localStorage.getItem(LAST) || 'null'); if (s && !location.hash && s.h && Date.now() - s.t < 30 * 60 * 1000) { Object.assign(filters, s.f || {}); history.replaceState(null, '', s.h); setTimeout(() => window.scrollTo(0, s.y || 0), 50); } } catch (e) { }
    window.addEventListener('scroll', () => { clearTimeout(window._cwgT); window._cwgT = setTimeout(saveLast, 300); }, { passive: true });
    window.addEventListener('pagehide', saveLast);
    window.addEventListener('hashchange', () => { $('#q').value = ''; $('#qcount').textContent = ''; route(); });
    $('#q').addEventListener('input', e => { const v = e.target.value; if (v.trim().length >= 2) renderSearch(v); else { $('#qcount').textContent = ''; route(); } });
    route();
  }
  const subtabs = (page, key, list, cur) => `<div class="sub-tabs">${list.map(([k, l]) => `<a href="#${page}" data-f="${key}=${encodeURIComponent(k)}" class="${k === cur ? 'on' : ''}">${esc(l)}</a>`).join('')}</div>`;
  const filterBox = (ph, val, key) => `<div class="search"><input class="filter" data-key="${key || 'q'}" type="search" placeholder="${esc(ph)}" value="${esc(val || '')}"></div>`;
  const bigrams = s => { const b = new Set(); s = ' ' + s + ' '; for (let i = 0; i < s.length - 1; i++) b.add(s.slice(i, i + 2)); return b; };
  const sim = (a, b) => { const x = bigrams(a), y = bigrams(b); let n = 0; for (const g of x) if (y.has(g)) n++; return 2 * n / (x.size + y.size); };
  const tbl = (rows, h) => `<div class="tbl"><table class="sortable"><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div>`;
  const GEAR_TYPES = new Set(['Weapon', 'Armor', 'Gloves', 'Accessory', 'Gem', 'Hidden', 'Pet gear']);
  /* ---- profiles: one set of checklist ticks, owned gear, main stat and part ticks per character ----
     The live keys always hold the current profile, so every page keeps reading them as before. */
  const PKEYS = ['cwgGuideDone', 'cwgOwned', 'cwgStat', 'cwgPlanParts'];
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { } };
  const profs = () => { let p = null; try { p = JSON.parse(lsGet('cwgProfiles') || 'null'); } catch (e) { } if (!p || !Array.isArray(p.list) || !p.list.length) p = { cur: 'p1', list: [{ id: 'p1', name: 'Main' }], data: {} }; if (!p.list.some(x => x.id === p.cur)) p.cur = p.list[0].id; p.data = p.data || {}; return p; };
  const saveProfs = p => lsSet('cwgProfiles', JSON.stringify(p));
  const snapLive = () => { const o = {}; for (const k of PKEYS) { const v = lsGet(k); if (v != null) o[k] = v; } return o; };
  const loadLive = o => { for (const k of PKEYS) lsSet(k, o && o[k] != null ? o[k] : null); };
  const useProfile = (p, id) => { if (id !== p.cur) { p.data[p.cur] = snapLive(); loadLive(p.data[id] || {}); delete p.data[id]; p.cur = id; } saveProfs(p); window.dispatchEvent(new Event('cwgprofile')); };
  let profUi = null; /* null | 'new' | 'ren' | 'del' */
  /* every column whose body cells are all numbers (or empty) gets right-aligned header and cells, so headers sit over their numbers */
  const NUMCELL = /^[-+−]?\$?[\d][\d.,]*\s*(%|s|x)?$/;
  const alignNums = root => root.querySelectorAll('table').forEach(tb => {
    if (tb.querySelector('[rowspan],[colspan]')) return;
    const rows = [...tb.rows]; if (rows.length < 2) return; const head = rows[0]; if (!head.querySelector('th')) return;
    const body = rows.slice(1).filter(r => !r.querySelector('th'));
    [...head.cells].forEach((th, ci) => {
      let n = 0, ok = true;
      for (const r of body) { const c = r.cells[ci]; if (!c) continue; const t = c.textContent.trim(); if (!t || t === '-') continue; if (NUMCELL.test(t)) n++; else { ok = false; break; } }
      if (ok && n) { th.classList.add('num'); for (const r of body) if (r.cells[ci]) r.cells[ci].classList.add('num'); }
    });
  });
  const statBar = (name, hint) => { let s = 'STR', hid = false; try { s = localStorage.getItem('cwgStat') || 'STR'; hid = localStorage.getItem('cwgStatBar') === 'off'; } catch (e) { }
    if (hid) return `<p class="small sb-min">Main stat: <b class="sb-${s.toLowerCase()}-t">${s}</b> · <a href="#" data-statbar="on">Change</a></p>`;
    return `<div class="statbar"><span class="sb-l">Your main stat</span><span class="sb-seg" role="radiogroup" aria-label="Your main stat">${['STR', 'AGI', 'INT'].map(x => `<label class="sb-${x.toLowerCase()}${x === s ? ' on' : ''}"><input type="radio" name="${name}" value="${x}" ${x === s ? 'checked' : ''}>${x}</label>`).join('')}</span><span class="sb-h">${hint}</span><a href="#" data-statbar="off" class="small sb-hide">Hide</a></div>`; };
  const profileBar = () => { const p = profs(); const cur = p.list.find(x => x.id === p.cur);
    const edit = profUi === 'new' || profUi === 'ren' ? `<input class="prof-in" maxlength="24" placeholder="${profUi === 'new' ? 'name, e.g. Nature' : ''}" value="${profUi === 'ren' ? esc(cur.name) : ''}"> <a href="#" data-prof="ok">Save</a> <a href="#" data-prof="x" class="small">Cancel</a>`
      : profUi === 'del' ? `<span class="small">Delete "${esc(cur.name)}" and its ticks?</span> <a href="#" data-prof="delok">Yes</a> <a href="#" data-prof="x" class="small">No</a>`
      : `<a href="#" data-prof="new" class="small">+ New</a><a href="#" data-prof="ren" class="small">Rename</a>${p.list.length > 1 ? `<a href="#" data-prof="del" class="small">Delete</a>` : ''}`;
    return `<div class="prof"><span class="small">Profile</span><select class="prof-sel" aria-label="Profile">${p.list.map(x => `<option value="${esc(x.id)}" ${x.id === p.cur ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>${edit}</div>`; };
  /* one page-level listener, so the bar keeps working after the planner redraws itself */
  const profRedraw = () => { route(); const i = document.querySelector('.prof-in'); if (i) { i.focus(); i.select(); } };
  const profSave = () => { const inp = document.querySelector('.prof-in'); const name = ((inp && inp.value) || '').trim().slice(0, 24); if (name) { const p = profs(); if (profUi === 'new') { p.data[p.cur] = snapLive(); const id = 'p' + Date.now().toString(36); p.list.push({ id, name }); loadLive({}); p.cur = id; saveProfs(p); window.dispatchEvent(new Event('cwgprofile')); } else { p.list.find(x => x.id === p.cur).name = name; saveProfs(p); } } profUi = null; route(); };
  document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('[data-prof]'); if (!a) return; e.preventDefault(); const k = a.dataset.prof;
    if (k === 'ok') return profSave();
    if (k === 'delok') { const p = profs(); const gone = p.cur; p.list = p.list.filter(x => x.id !== gone); delete p.data[gone]; const next = p.list[0].id; loadLive(p.data[next] || {}); delete p.data[next]; p.cur = next; saveProfs(p); window.dispatchEvent(new Event('cwgprofile')); profUi = null; return route(); }
    profUi = k === 'x' ? null : k; profRedraw(); });
  document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('[data-statbar]'); if (!a) return; e.preventDefault(); try { localStorage.setItem('cwgStatBar', a.dataset.statbar); } catch (x) { } route(); });
  document.addEventListener('change', e => { if (!e.target.classList || !e.target.classList.contains('prof-sel')) return; profUi = null; useProfile(profs(), e.target.value); route(); });
  document.addEventListener('keydown', e => { if (!e.target.classList || !e.target.classList.contains('prof-in')) return; if (e.key === 'Enter') { e.preventDefault(); profSave(); } if (e.key === 'Escape') { profUi = null; route(); } });
  let VARMAP = null;
  const varKey = it => { const base = k => { const x = I[k]; return x ? (x.variant ? (x.family || x.name) : x.name) : k; }; const r = madeBy(it.id)[0]; const sig = r ? 'R:' + r.in.map(([k]) => base(k)).sort().join('+') : 'D:' + [...new Set((it.drops || []).map(x => x.m))].sort().join(','); return it.family + '|' + it.type + '|' + (it.level || 0) + '|' + sig; };
  const swapVar = (id, stat) => { const it = I[id]; if (!it || !it.variant || !stat || it.variant === stat) return id; if (!VARMAP) { VARMAP = {}; for (const x of Object.values(I)) if (x.variant) (VARMAP[varKey(x)] = VARMAP[varKey(x)] || {})[x.variant] = x.id; } const v = VARMAP[varKey(it)]; return v && v[stat] ? v[stat] : id; };
  return { statBar, profileBar, swapVar, GEAR_TYPES, W, I, M, R, Z, $, esc, link, fmt, pct, tag, icon, iname, ilink, statLine, tipHtml, madeBy, usedIn, mlink, zlink, rrow, rtable, gen, INDEX, KL, P, filters, hooks, route, start, subtabs, filterBox, tbl };
})();
