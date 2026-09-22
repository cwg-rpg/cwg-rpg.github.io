/* Calculators: drop chance and enhancement cost */
(function (K) {
  const { W, I, M, R, esc, link, fmt, pct, ilink, mlink, P, subtabs } = K;
  const SY = W.systems || {}; const CALC = W.calc || {};
  const num = v => { const n = parseFloat(String(v).replace(/[,\s]/g, '')); return isNaN(n) ? 0 : n; };
  const readLS = k => { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } };
  const state = { drop: {}, enh: {} };

  /* ---- drop calculator ---- */
  const drop = () => {
    const s = state.drop; const mons = Object.values(M).filter(m => m.drops.length).sort((a, b) => a.name.localeCompare(b.name));
    const m = M[s.m] || null; const d = m ? m.drops.find(x => x.item === s.i) || m.drops[0] : null;
    const bonus = num(s.bonus); const p = d ? Math.min(100, d.chance * (1 + bonus / 100)) : 0;
    const avg = p > 0 ? 1 / (p / 100) : 0; const k90 = p > 0 && p < 100 ? Math.ceil(Math.log(0.1) / Math.log(1 - p / 100)) : (p >= 100 ? 1 : 0);
    return `<p class="small">Base drop chance times your drop bonus. Enter the bonus you see on your record (0 if none).</p>
    <div class="card"><div class="kv"><b>Monster</b><span><input class="calc" data-k="m" list="mons" value="${esc(m ? m.name : s.mtext || '')}" placeholder="type a monster name" style="width:100%;max-width:420px"><datalist id="mons">${mons.map(x => `<option value="${esc(x.name)}">`).join('')}</datalist></span>
    ${m ? `<b>Item</b><span><select class="calc" data-k="i">${m.drops.map(x => `<option value="${x.item}" ${d && d.item === x.item ? 'selected' : ''}>${esc((I[x.item] || {}).name || x.item)} (${pct(x.chance)})</option>`).join('')}</select></span>` : ''}
    <b>Your drop bonus</b><span><input class="calc" data-k="bonus" type="number" min="0" step="1" value="${esc(s.bonus || 0)}" style="width:90px"> %</span></div></div>
    ${d ? `<div class="card hi"><div class="kv"><b>Chance per kill</b><span>${pct(p)} <span class="small">(base ${pct(d.chance)}${d.rolls > 1 ? ', ' + d.rolls + ' rolls per kill' : ''})</span></span><b>Average kills</b><span>${fmt(Math.round(avg))}</span><b>Kills for a 90% chance</b><span>${fmt(k90)}</span><b>Kills for a 99% chance</b><span>${p > 0 && p < 100 ? fmt(Math.ceil(Math.log(0.01) / Math.log(1 - p / 100))) : 1}</span></div></div>` : ''}`;
  };

  /* ---- enhancement calculator ---- */
  const chains = (() => { const out = {}; for (const r of R) { if (!/^Enhancement/.test(r.kind)) continue; const o = I[r.out]; if (!o || o.level == null) continue; const cands = r.in.filter(([k]) => I[k] && (I[k].family === o.family || I[k].type === o.type) && !/Stone/.test(I[k].name) && (I[k].level || 0) < o.level).sort((a, b) => (I[b[0]].level || 0) - (I[a[0]].level || 0)); const base = cands[0]; if (!base) continue; const key = o.family + (o.variant ? ' [' + o.variant + ']' : ''); (out[key] = out[key] || []).push({ lv: o.level, chance: r.chance, out: r.out, base: base[0], stone: r.in.filter(([k]) => k !== base[0]).map(([k, n]) => (n > 1 ? n + '× ' : '') + ((I[k] || {}).name || k)).join(' + ') }); } for (const k of Object.keys(out)) out[k].sort((a, b) => a.lv - b.lv); return out; })();
  const chainKeys = Object.keys(chains).sort();
  const enh = () => {
    const s = state.enh; const mode = s.mode === 'attr' ? 'attr' : 'gear';
    let body = '';
    if (mode === 'gear') {
      const key = chains[s.chain] ? s.chain : chainKeys[0]; const ch = chains[key] || []; const lvs = ch.map(x => x.lv);
      const from = lvs.includes(num(s.from)) ? num(s.from) : (lvs[0] - 1); const to = lvs.includes(num(s.to)) ? num(s.to) : lvs[lvs.length - 1];
      const steps = ch.filter(x => x.lv > from && x.lv <= to); const stones = steps.reduce((a, x) => a + (x.chance > 0 ? 100 / x.chance : 0), 0);
      body = `<div class="card"><div class="kv"><b>Item</b><span><select class="calc" data-k="chain">${chainKeys.map(k => `<option ${k === key ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select></span><b>From</b><span><select class="calc" data-k="from">${[lvs[0] - 1, ...lvs.slice(0, -1)].map(l => `<option value="${l}" ${l === from ? 'selected' : ''}>+${l}</option>`).join('')}</select></span><b>To</b><span><select class="calc" data-k="to">${lvs.map(l => `<option value="${l}" ${l === to ? 'selected' : ''}>+${l}</option>`).join('')}</select></span></div></div>
      ${steps.length ? `<div class="card hi"><div class="kv"><b>Expected stones</b><span>${fmt(Math.round(stones))} <span class="small">(${esc(steps[0].stone)}; a failed try loses the stone, the item stays)</span></span><b>Steps</b><span>${steps.length}</span></div></div><div class="tbl compact"><table><tr><th>Step</th><th class="num">Chance</th><th class="num">Tries on average</th></tr>${steps.map(x => `<tr><td>${ilink(x.out)}</td><td class="num">${pct(x.chance)}</td><td class="num">${x.chance > 0 ? fmt(Math.round(100 / x.chance * 10) / 10) : '-'}</td></tr>`).join('')}</table></div>` : '<p class="small">Pick a higher target.</p>'}`;
    } else {
      const A = CALC.attribute || []; const from = Math.min(39, Math.max(0, num(s.afrom))); const to = Math.min(40, Math.max(from + 1, num(s.ato) || 40));
      // expected stones / lumber from level l to reach 'to': E[l] = cost + keep*E[l] + s*E[l+1] + d1*E[down1] + d2*E[down2]; floor = highest safe multiple of 5 reached
      const floorOf = l => { let f = 0; for (let x = 0; x <= l; x++) if (A[x] && A[x].safe) f = x; return f; };
      const solve = costKey => { const E = new Array(41).fill(0); for (let it = 0; it < 4000; it++) { for (let l = to - 1; l >= from; l--) { const r = A[l]; if (!r) continue; const dn1 = Math.max(floorOf(l), l - 1), dn2 = Math.max(floorOf(l), l - 2); const c = r[costKey] || 0; const keep = r.keep / 100, sp = r.s / 100, p1 = r.safe ? 0 : r.d1 / 100, p2 = r.safe ? 0 : r.d2 / 100; const kp = r.safe ? 1 - sp : keep; E[l] = (c + sp * E[l + 1] + p1 * E[dn1 < from ? from : dn1] + p2 * E[dn2 < from ? from : dn2]) / (1 - kp); } } return E[from]; };
      const st = solve('stones'), lu = solve('lumber');
      body = `<div class="card"><div class="kv"><b>From</b><span><input class="calc" data-k="afrom" type="number" min="0" max="39" value="${from}" style="width:70px"></span><b>To</b><span><input class="calc" data-k="ato" type="number" min="1" max="40" value="${to}" style="width:70px"></span></div></div>
      <div class="card hi"><div class="kv"><b>Expected Attribute Stones</b><span>${fmt(Math.round(st))}</span><b>Expected Lumber</b><span>${fmt(Math.round(lu))}</span></div><p class="small">Counts failures that drop you back (never below the last safe level) and that +0..+10, +15, +20, +30, +35 cannot drop. Without Destruction Protection.</p></div>
      <div class="tbl compact"><table><tr><th>Step</th><th class="num">Success</th><th class="num">Keep</th><th class="num">Drop 1</th><th class="num">Drop 2</th><th class="num">Stones</th><th class="num">Lumber</th></tr>${A.slice(from, to).map(r => `<tr><td>+${r.lv} → +${r.lv + 1}${r.safe ? ' <span class="tag ok">safe</span>' : ''}</td><td class="num">${pct(r.s)}</td><td class="num">${r.safe ? pct(100 - r.s) : pct(r.keep)}</td><td class="num">${r.safe ? '-' : pct(r.d1)}</td><td class="num">${r.safe ? '-' : pct(r.d2)}</td><td class="num">${r.stones}</td><td class="num">${fmt(r.lumber)}</td></tr>`).join('')}</table></div>`;
    }
    return `${subtabs('calc', 'mode', [['gear', 'Item enhancement'], ['attr', 'Attribute enhancement']], mode)}${body}`;
  };

  const TABS = [['drop', 'Drop chance'], ['enh', 'Enhancement']];
  P.calc = (_, f) => { const t = TABS.some(([k]) => k === f.tool) ? f.tool : 'drop'; if (f.mode) state.enh.mode = f.mode; return `<h2>Calculators</h2>${subtabs('calc', 'tool', TABS, t)}${({ drop, enh })[t]()}`; };
  K.hooks.push((page, out) => {
    if (page !== 'calc') return;
    const cur = (K.filters.tool && TABS.some(([k]) => k === K.filters.tool)) ? K.filters.tool : 'drop';
    out.querySelectorAll('.calc').forEach(el => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
      const s = state[cur]; const k = el.dataset.k;
      if (k === 'm') { const m = Object.values(M).find(x => x.name.toLowerCase() === el.value.trim().toLowerCase()); s.m = m ? m.id : ''; s.mtext = el.value; if (!m) return; }
      else s[k] = el.value;
      const pos = el.selectionStart; K.route(); const n = out.querySelector(`.calc[data-k="${k}"]`); if (n && n.tagName !== 'SELECT') { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { } }
    }));
  });

})(window.WK);
