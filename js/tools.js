/* Calculators: drop chance and enhancement cost */
(function (K) {
  const { W, I, M, R, esc, link, fmt, pct, ilink, mlink, P, subtabs } = K;
  const SY = W.systems || {}; const CALC = W.calc || {};
  const num = v => { const n = parseFloat(String(v).replace(/[,\s]/g, '')); return isNaN(n) ? 0 : n; };
  const readLS = k => { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } };
  const state = { drop: {}, enh: {}, roll: {}, engr: {} };

  /* ---- drop calculator ---- */
  const drop = () => {
    const s = state.drop; const mons = Object.values(M).filter(m => m.drops.length).sort((a, b) => a.name.localeCompare(b.name));
    const m = M[s.m] || null; const d = m ? m.drops.find(x => x.item === s.i) || m.drops[0] : null;
    const bonus = num(s.bonus); const p = d ? Math.min(100, d.chance * (1 + bonus / 100)) : 0;
    const avg = p > 0 ? 1 / (p / 100) : 0; const k90 = p > 0 && p < 100 ? Math.ceil(Math.log(0.1) / Math.log(1 - p / 100)) : (p >= 100 ? 1 : 0);
    return `<p class="small">Base drop chance raised by your drop bonus. Enter the bonus from -supporterstatus, or 0.</p>
    <div class="card"><div class="kv"><b>Monster</b><span><input class="calc" data-k="m" list="mons" value="${esc(m ? m.name : s.mtext || '')}" placeholder="Type a monster name" style="width:100%;max-width:420px"><datalist id="mons">${mons.map(x => `<option value="${esc(x.name)}">`).join('')}</datalist></span>
    ${m ? `<b>Item</b><span><select class="calc" data-k="i">${m.drops.map(x => `<option value="${x.item}" ${d && d.item === x.item ? 'selected' : ''}>${esc((I[x.item] || {}).name || x.item)} (${pct(x.chance)})</option>`).join('')}</select></span>` : ''}
    <b>Your drop bonus</b><span><input class="calc" data-k="bonus" type="number" min="0" step="1" value="${esc(s.bonus || 0)}" style="width:90px"> %</span></div></div>
    ${d ? `<div class="card hi"><div class="kv"><b>Chance per kill</b><span>${pct(p)} <span class="small">base ${pct(d.chance)}${d.rolls > 1 ? ' · ' + d.rolls + ' rolls per kill' : ''}</span></span><b>Usually</b><span><b>${fmt(Math.round(avg))} kills</b></span><b>If unlucky</b><span><b>${fmt(k90)} kills</b></span></div><p class="small" style="margin:8px 0 0">"If unlucky": only 1 player in 10 needs more.</p></div>` : ''}`;
  };


  /* ---- shared: read the verified tables from the Game Systems pages, so a rebuild keeps these in sync ---- */
  const tbl = (sys, re) => ((SY[sys] || {}).tables || []).find(x => re.test(x.title)) || null;
  const col = (T, re) => T ? T.columns.findIndex(c => re.test(c)) : -1;
  const sel = (k, opts, v) => `<select class="calc" data-k="${k}">${opts.map(([val, lab]) => `<option value="${esc(val)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(lab)}</option>`).join('')}</select>`;
  const nfmt = x => x > 0 && x < 1 ? String(+x.toPrecision(2)) : x >= 1e6 ? fmt(Math.round(x)) : fmt(Math.round(x * 10) / 10);

  /* ---- roll odds: Ability slots, Potential, Sailing Potential ---- */
  const ROLL = [
    ['ability_slots', 'Ability slot', /grade chances/i, 'A roll costs gold by the slot\'s current grade: Normal 10,000, Magic 50,000, Rare 100,000, Epic 150,000, Unique and up 200,000. Starts from Normal. Every 1,000,000 gold is 1 Lumber.', 'gold'],
    ['potential', 'Potential slot', /grade chances/i, '', [['Lumber', 1]]],
    ['sailing', 'Sailing Potential slot', /grade chances/i, '', [['Voyage Essence', 1], ['Lumber', 2]]],
  ];
  const AB_GOLD = [10000, 50000, 100000, 150000]; /* map: roll cost by current grade 1-4, then 200,000 */
  const abGold = g => AB_GOLD[g] != null ? AB_GOLD[g] : 200000;
  const PITY = 50000; /* sailing: every 50,000 Voyage Essence spent guarantees a Divinity roll (1 essence per roll) */
  const roll = () => {
    const s = state.roll; const sysI = Math.max(0, ROLL.findIndex(r => r[0] === s.sys)); const [sys, label, re, note, cost] = ROLL[sysI];
    const T = tbl(sys, re); if (!T) return '<p class="small">No data.</p>';
    const gi = col(T, /^Grade$/), ci = col(T, /Chance/); const grades = T.rows.map(r => [r[gi], Number(r[ci])]);
    const tgt = grades.some(g => g[0] === s.g) ? s.g : grades[Math.min(5, grades.length - 1)][0];
    const k = grades.findIndex(g => g[0] === tgt); const p = grades.slice(k).reduce((a, g) => a + g[1], 0) / 100;
    const pity = sys === 'sailing';
    const expRolls = p > 0 ? (pity ? (1 - Math.pow(1 - p, PITY)) / p : 1 / p) : Infinity;
    const q = x => { const n = Math.ceil(Math.log(1 - x) / Math.log(1 - p)); return pity ? Math.min(n, PITY) : n; };
    const unlucky = q(0.9);
    let lum = n => 0, extra = null;
    if (cost === 'gold') { const below = grades.slice(0, k); const pb = below.reduce((a, g) => a + g[1], 0); const avgG = pb > 0 ? below.reduce((a, g, i) => a + g[1] * abGold(i), 0) / pb : abGold(0); lum = n => n <= 0 ? 0 : (abGold(0) + (n - 1) * avgG) / 1e6; }
    else if (sys === 'potential') lum = n => n;
    else if (sys === 'sailing') { lum = n => 2 * n; extra = n => ` + ${nfmt(n)} Voyage Essence`; }
    const line = n => `<b>${nfmt(lum(n))} Lumber</b>${extra ? extra(n) : ''} <span class="small">· ${nfmt(n)} rolls</span>`;
    return `<div class="card"><div class="kv"><b>Roll</b><span>${sel('sys', ROLL.map(r => [r[0], r[1]]), sys)}</span><b>Until</b><span>${sel('g', grades.map(g => [g[0], g[0] + ' or better']), tgt)}</span></div></div>
    <div class="card hi"><div class="kv"><b>Usually</b><span>${line(expRolls)}</span><b>If unlucky</b><span>${line(unlucky)}</span></div>
    <p class="small" style="margin:8px 0 0">"If unlucky": only 1 player in 10 needs more.${pity ? ` Every ${fmt(PITY)} Voyage Essence spent guarantees Divinity, so ${fmt(PITY)} rolls at most.` : ''}${cost === 'gold' ? ' Paid in gold, shown as Lumber at 1,000,000 gold each.' : ''}</p></div>`;
  };

  /* ---- engraving: contribution and party dungeon clears ---- */
  const engr = () => {
    const s = state.engr; const C = tbl('party_dungeon', /Contribution cost/), Dg = tbl('party_dungeon', /^Dungeons$/);
    if (!C || !Dg) return '<p class="small">No data.</p>';
    const gold = s.track === 'gold'; const ci = gold ? 2 : 1;
    const from = Math.min(24, Math.max(0, Math.round(num(s.from)))); const to = Math.min(25, Math.max(from + 1, Math.round(num(s.to) || 25)));
    const need = C.rows.slice(from, to).reduce((a, r) => a + Number(r[ci]), 0);
    const di = col(Dg, /Dungeon/), pi = col(Dg, /Contribution per clear/), gi = col(Dg, /gold/i);
    const per = r => Number(r[pi]) + (/Snowfield/.test(r[di]) ? 0.2 : 0); /* Snowfield wave 10: 10% chance of +2 */
    return `<p class="small">Contribution for one Permanent Engraving track, and the clears it takes in each party dungeon.</p>
    <div class="card"><div class="kv"><b>Track</b><span>${sel('track', [['stat', 'Life, Balance, Guard, Battle, Move or Haste'], ['gold', 'Gold or Luck']], gold ? 'gold' : 'stat')}</span><b>From level</b><span><input class="calc" data-k="from" type="number" min="0" max="24" value="${from}" style="width:70px"></span><b>To level</b><span><input class="calc" data-k="to" type="number" min="1" max="25" value="${to}" style="width:70px"></span></div></div>
    <div class="card hi"><div class="kv"><b>Contribution needed</b><span>${fmt(need)}</span></div>
    <div class="tbl compact"><table><tr><th>Dungeon</th><th class="num">Per clear</th><th class="num">Clears</th><th class="num">Est. tickets</th><th class="num">Lumber earned</th></tr>${Dg.rows.map(r => { const n = Math.ceil(need / per(r)); return `<tr><td>${esc(r[di])}</td><td class="num">${nfmt(per(r))}</td><td class="num">${fmt(n)}</td><td class="num">${fmt(Math.ceil(n * 0.9))}</td><td class="num">${fmt(Math.floor(n * Number(r[gi]) / 1e6))}</td></tr>`; }).join('')}</table></div>
    <p class="small">About 1 ticket in 10 is kept on entry. Run gold is shown as Lumber at 1,000,000 gold each.</p></div>`;
  };

  /* ---- relic enhancement: expected tries with the reset to +0 ---- */
  const relic = s => {
    const T = tbl('relic_enhancement', /Enhancement chances/); if (!T) return '<p class="small">No data.</p>';
    const si = col(T, /Success/), di = col(T, /Destroy/); const st = T.rows.map(r => ({ s: Number(r[si]) / 100, d: Number(r[di]) / 100 }));
    const from = Math.min(11, Math.max(0, Math.round(num(s.rfrom)))); const to = Math.min(12, Math.max(from + 1, Math.round(num(s.rto) || 12)));
    /* E[k] = 1 + s E[k+1] + stay E[k] + d E[0], solved as E[k] = a[k] + b[k] E[0] from the top down */
    const a = new Array(13).fill(0), b = new Array(13).fill(0);
    for (let k = to - 1; k >= 0; k--) { const x = st[k]; const m = x.s + x.d; a[k] = (1 + x.s * a[k + 1]) / m; b[k] = (x.s * b[k + 1] + x.d) / m; }
    const E0 = a[0] / (1 - b[0]); const tries = a[from] + b[from] * E0;
    return `<div class="card"><div class="kv"><b>From</b><span><input class="calc" data-k="rfrom" type="number" min="0" max="11" value="${from}" style="width:70px"></span><b>To</b><span><input class="calc" data-k="rto" type="number" min="1" max="12" value="${to}" style="width:70px"></span></div></div>
    <div class="card hi"><div class="kv"><b>Tries on average</b><span>${nfmt(tries)}</span><b>Relic Fragments</b><span>${fmt(Math.round(tries * 300))} <span class="small">· 300 per try</span></span></div><p class="small">Includes resets to +0 from +4 and up. Lock relics you don't want to risk.</p></div>`;
  };

  /* ---- enhancement calculator ---- */
  const chains = (() => { const out = {}; for (const r of R) { if (!/^Enhancement/.test(r.kind)) continue; const o = I[r.out]; if (!o || o.level == null) continue; const cands = r.in.filter(([k]) => I[k] && (I[k].family === o.family || I[k].type === o.type) && !/Stone/.test(I[k].name) && (I[k].level || 0) < o.level).sort((a, b) => (I[b[0]].level || 0) - (I[a[0]].level || 0)); const base = cands[0]; if (!base) continue; const key = o.family + (o.variant ? ' [' + o.variant + ']' : ''); (out[key] = out[key] || []).push({ lv: o.level, chance: r.chance, out: r.out, base: base[0], stone: r.in.filter(([k]) => k !== base[0]).map(([k, n]) => (n > 1 ? n + '× ' : '') + ((I[k] || {}).name || k)).join(' + ') }); } for (const k of Object.keys(out)) out[k].sort((a, b) => a.lv - b.lv); return out; })();
  const chainKeys = Object.keys(chains).sort();
  const enh = () => {
    const s = state.enh; const mode = ['attr', 'relic'].includes(s.mode) ? s.mode : 'gear';
    let body = '';
    if (mode === 'gear') {
      const key = chains[s.chain] ? s.chain : chainKeys[0]; const ch = chains[key] || []; const lvs = ch.map(x => x.lv);
      const from = lvs.includes(num(s.from)) ? num(s.from) : (lvs[0] - 1); const to = lvs.includes(num(s.to)) ? num(s.to) : lvs[lvs.length - 1];
      const steps = ch.filter(x => x.lv > from && x.lv <= to); const stones = steps.reduce((a, x) => a + (x.chance > 0 ? 100 / x.chance : 0), 0);
      body = `<div class="card"><div class="kv"><b>Item</b><span><select class="calc" data-k="chain">${chainKeys.map(k => `<option ${k === key ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select></span><b>From</b><span><select class="calc" data-k="from">${[lvs[0] - 1, ...lvs.slice(0, -1)].map(l => `<option value="${l}" ${l === from ? 'selected' : ''}>+${l}</option>`).join('')}</select></span><b>To</b><span><select class="calc" data-k="to">${lvs.map(l => `<option value="${l}" ${l === to ? 'selected' : ''}>+${l}</option>`).join('')}</select></span></div></div>
      ${steps.length ? `<div class="card hi"><div class="kv"><b>Stones on average</b><span>${fmt(Math.round(stones))} <span class="small">${esc(steps[0].stone)} · a failed try only loses the stone</span></span><b>Steps</b><span>${steps.length}</span></div></div><div class="tbl compact"><table><tr><th>Step</th><th class="num">Chance</th><th class="num">Tries on average</th></tr>${steps.map(x => `<tr><td>${ilink(x.out)}</td><td class="num">${pct(x.chance)}</td><td class="num">${x.chance > 0 ? fmt(Math.round(100 / x.chance * 10) / 10) : '-'}</td></tr>`).join('')}</table></div>` : '<p class="small">Pick a higher target.</p>'}`;
    } else {
      const A = CALC.attribute || []; const from = Math.min(39, Math.max(0, num(s.afrom))); const to = Math.min(40, Math.max(from + 1, num(s.ato) || 40));
      // expected stones / lumber from level l to reach 'to': E[l] = cost + keep*E[l] + s*E[l+1] + d1*E[down1] + d2*E[down2]; floor = highest safe multiple of 5 reached
      const floorOf = l => { let f = 0; for (let x = 0; x <= l; x++) if (A[x] && A[x].safe) f = x; return f; };
      const solve = costKey => { const E = new Array(41).fill(0); for (let it = 0; it < 4000; it++) { for (let l = to - 1; l >= from; l--) { const r = A[l]; if (!r) continue; const dn1 = Math.max(floorOf(l), l - 1), dn2 = Math.max(floorOf(l), l - 2); const c = r[costKey] || 0; const keep = r.keep / 100, sp = r.s / 100, p1 = r.safe ? 0 : r.d1 / 100, p2 = r.safe ? 0 : r.d2 / 100; const kp = r.safe ? 1 - sp : keep; E[l] = (c + sp * E[l + 1] + p1 * E[dn1 < from ? from : dn1] + p2 * E[dn2 < from ? from : dn2]) / (1 - kp); } } return E[from]; };
      const st = solve('stones'), lu = solve('lumber');
      body = mode === 'relic' ? relic(s) : `<div class="card"><div class="kv"><b>From</b><span><input class="calc" data-k="afrom" type="number" min="0" max="39" value="${from}" style="width:70px"></span><b>To</b><span><input class="calc" data-k="ato" type="number" min="1" max="40" value="${to}" style="width:70px"></span></div></div>
      <div class="card hi"><div class="kv"><b>Attribute Stones on average</b><span>${fmt(Math.round(st))}</span><b>Lumber on average</b><span>${fmt(Math.round(lu))}</span></div><p class="small">Includes failures that drop you back, never below the last safe level. +0 to +10, +15, +20, +30 and +35 cannot drop. Without Destruction Protection.</p></div>
      <div class="tbl compact"><table><tr><th>Step</th><th class="num">Success</th><th class="num">Keep</th><th class="num">Drop 1</th><th class="num">Drop 2</th><th class="num">Stones</th><th class="num">Lumber</th></tr>${A.slice(from, to).map(r => `<tr><td>+${r.lv} → +${r.lv + 1}${r.safe ? ' <span class="tag ok">safe</span>' : ''}</td><td class="num">${pct(r.s)}</td><td class="num">${r.safe ? pct(100 - r.s) : pct(r.keep)}</td><td class="num">${r.safe ? '-' : pct(r.d1)}</td><td class="num">${r.safe ? '-' : pct(r.d2)}</td><td class="num">${r.stones}</td><td class="num">${fmt(r.lumber)}</td></tr>`).join('')}</table></div>`;
    }
    return `${subtabs('calc', 'mode', [['gear', 'Item enhancement'], ['attr', 'Attribute enhancement'], ['relic', 'Relic enhancement']], mode)}${body}`;
  };

  const TABS = [['drop', 'Drop chance'], ['enh', 'Enhancement'], ['roll', 'Roll odds'], ['engr', 'Engraving']];
  P.calc = (_, f) => { const t = TABS.some(([k]) => k === f.tool) ? f.tool : 'drop'; if (f.mode) state.enh.mode = f.mode; return `<h2>Calculators</h2>${subtabs('calc', 'tool', TABS, t)}${({ drop, enh, roll, engr })[t]()}`; };
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
