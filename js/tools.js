/* Calculators: drop chance and enhancement cost */
(function (K) {
  const { W, I, M, R, esc, link, fmt, pct, ilink, mlink, P, subtabs } = K;
  const SY = W.systems || {}; const CALC = W.calc || {};
  const num = v => { const n = parseFloat(String(v).replace(/[,\s]/g, '')); return isNaN(n) ? 0 : n; };
  const readLS = k => { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } };
  const state = { drop: {}, enh: {}, roll: {}, engr: {}, title: {} };

  /* ---- drop calculator ---- */
  const perKill = (chance, rolls, bonus) => { const p = Math.min(1, chance * (1 + bonus / 100) / 100); return 1 - Math.pow(1 - p, Math.max(1, rolls || 1)); };   /* every roll is its own chance */
  const kills = pk => pk >= 1 ? [1, 1] : pk > 0 ? [Math.round(1 / pk), Math.ceil(Math.log(0.1) / Math.log(1 - pk))] : [0, 0];
  /* N copies (user 2026-09-25): drops after K kills = Binomial(K x rolls, p) */
  const lgam = z => { const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61503916999185, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]; if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgam(1 - z); z -= 1; let x = c[0]; for (let i = 1; i < g + 2; i++) x += c[i] / (z + i); const tt = z + g + 0.5; return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(tt) - tt + Math.log(x); };
  const atLeast = (n, p, N) => { if (N <= 0) return 1; if (p >= 1) return n >= N ? 1 : 0; if (n < N) return 0; const lp = Math.log(p), lq = Math.log(1 - p), ln = lgam(n + 1); let below = 0; for (let k = 0; k < N; k++) below += Math.exp(ln - lgam(k + 1) - lgam(n - k + 1) + k * lp + (n - k) * lq); return Math.max(0, 1 - below); };
  const killsFor = (N, pRoll, rolls) => { rolls = Math.max(1, rolls || 1); if (!(pRoll > 0)) return [0, 0]; if (N <= 1) return kills(1 - Math.pow(1 - pRoll, rolls)); const avg = N / (rolls * pRoll); let lo = Math.floor(avg), hi = Math.max(lo + 1, Math.ceil(avg * 2) + 10); while (atLeast(hi * rolls, pRoll, N) < 0.9) hi *= 2; while (hi - lo > 1) { const mid = Math.floor((lo + hi) / 2); if (atLeast(mid * rolls, pRoll, N) >= 0.9) hi = mid; else lo = mid; } return [Math.round(avg), hi]; };
  const pRollOf = (chance, bonus) => Math.min(1, chance * (1 + bonus / 100) / 100);
  const drop = () => {
    const s = state.drop; const by = s.by === 'item' ? 'item' : 'mon'; const bonus = num(s.bonus);
    const byBox = `<div class="sub-tabs">${[['mon', 'Pick a monster'], ['item', 'Pick an item']].map(([v, l]) => `<a href="#calc?tool=drop" class="calc-by ${by === v ? 'on' : ''}" data-by="${v}">${l}</a>`).join('')}</div>`;
    const need = Math.max(1, Math.round(num(s.need) || 1));
    const needRow = `<b>How many</b><span><input class="calc" data-k="need" type="number" min="1" step="1" value="${esc(s.need || 1)}" style="width:90px"> <span class="small">copies you need</span></span>`;
    const bonusRow = `<b>Your drop bonus</b><span><input class="calc" data-k="bonus" type="number" min="0" step="1" value="${esc(s.bonus || 0)}" style="width:90px"> % <span class="small">from -supporterstatus, or 0</span></span>`;
    if (by === 'item') {
      const drops = Object.values(I).filter(x => (x.drops || []).length).sort((a, b) => a.name.localeCompare(b.name));
      const it = I[s.it] || null; const src = it ? it.drops.map(d => ({ m: d.m, pk: perKill(d.c, d.r, bonus), pr: pRollOf(d.c, bonus), base: d.c, r: d.r })).filter(x => M[x.m]).sort((a, b) => b.pk - a.pk) : [];
      return `<p class="small">Where to farm an item: every monster that drops it, best first.</p>${byBox}
    <div class="card"><div class="kv"><b>Item</b><span><input class="calc" data-k="it" list="dropitems" value="${esc(it ? it.name : s.ittext || '')}" placeholder="Type an item name" style="width:100%;max-width:420px"><datalist id="dropitems">${drops.map(x => `<option value="${esc(x.name)}">`).join('')}</datalist></span>${needRow}${bonusRow}</div></div>
    ${src.length ? `<div class="tbl compact"><table><tr><th>Monster</th><th class="num">Per kill</th><th class="num">Usually${need > 1 ? ' for ' + fmt(need) : ''}</th><th class="num">If unlucky</th></tr>${src.map(x => { const [u, k] = killsFor(need, x.pr, x.r); return `<tr><td>${mlink(x.m)}</td><td class="num">${pct(100 * x.pk)}${x.r > 1 ? ` <span class="small">${x.r} rolls</span>` : ''}</td><td class="num">${fmt(u)} kills</td><td class="num">${fmt(k)} kills</td></tr>`; }).join('')}</table></div><p class="small">"If unlucky": only 1 player in 10 needs more.</p>` : (it ? '<p class="small">No monster drops this item. Check its page for recipes.</p>' : '')}`;
    }
    const mons = Object.values(M).filter(m => m.drops.length).sort((a, b) => a.name.localeCompare(b.name));
    const m = M[s.m] || null; const d = m ? m.drops.find(x => x.item === s.i) || m.drops[0] : null;
    const pk = d ? perKill(d.chance, d.rolls, bonus) : 0; const [avg, k90] = d ? killsFor(need, pRollOf(d.chance, bonus), d.rolls) : [0, 0];
    return `<p class="small">How many kills an item takes: base drop chance raised by your drop bonus.</p>${byBox}
    <div class="card"><div class="kv"><b>Monster</b><span><input class="calc" data-k="m" list="mons" value="${esc(m ? m.name : s.mtext || '')}" placeholder="Type a monster name" style="width:100%;max-width:420px"><datalist id="mons">${mons.map(x => `<option value="${esc(x.name)}">`).join('')}</datalist></span>
    ${m ? `<b>Item</b><span><select class="calc" data-k="i">${m.drops.map(x => `<option value="${x.item}" ${d && d.item === x.item ? 'selected' : ''}>${esc((I[x.item] || {}).name || x.item)} (${pct(x.chance)})</option>`).join('')}</select></span>` : ''}
    ${needRow}${bonusRow}</div></div>
    ${d ? `<div class="card hi"><div class="kv"><b>Chance per kill</b><span>${pct(100 * pk)}${bonus > 0 || d.rolls > 1 ? ` <span class="small">base ${pct(d.chance)}${d.rolls > 1 ? ' per roll · ' + d.rolls + ' rolls per kill' : ''}</span>` : ''}</span><b>Usually${need > 1 ? ' for ' + fmt(need) : ''}</b><span><b>${fmt(Math.round(avg))} kills</b></span><b>If unlucky</b><span><b>${fmt(k90)} kills</b></span></div><p class="small" style="margin:8px 0 0">"If unlucky": only 1 player in 10 needs more.</p></div>` : ''}`;
  };


  /* ---- shared: read the verified tables from the Game Systems pages, so a rebuild keeps these in sync ---- */
  const unev = c => c && typeof c === 'object' && 'ev' in c ? c.ev : c; /* event cells {ev, b}: calculators use the live value */
  const tbl = (sys, re) => { const T = ((SY[sys] || {}).tables || []).find(x => re.test(x.title)); return T ? { ...T, rows: T.rows.map(r => r.map(unev)) } : null; };
  const FX = W.event_fx || {};
  const EV_TOOL = { enh: ['craft', 'attribute_x3', 'attribute_x2', 'attribute_lumber_half'], roll: ['ability_top3', 'ability_high2', 'ability_halfcost', 'potential_top3', 'potential_halfcost', 'sailing_top2'], engr: ['party_contribution2', 'party_bonus_gold'] };
  const evNote = tool => { const on = (W.events || []).filter(e => e.on && (EV_TOOL[tool] || []).includes(e.id)); return on.length ? `<p class="small">Live events included: ${on.map(e => `<a class="evchip" href="#events">${esc(e.chip)}</a>`).join(' ')}</p>` : ''; };
  const col = (T, re) => T ? T.columns.findIndex(c => re.test(c)) : -1;
  const sel = (k, opts, v) => `<select class="calc" data-k="${k}">${opts.map(([val, lab]) => `<option value="${esc(val)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(lab)}</option>`).join('')}</select>`;
  const big = x => x >= 1e12 ? (x / 1e12).toFixed(1) + 'T' : x >= 1e9 ? (x / 1e9).toFixed(1) + 'B' : x >= 1e6 ? (x / 1e6).toFixed(1) + 'M' : fmt(Math.round(x));
  const nfmt = x => x > 0 && x < 1 ? String(+x.toPrecision(2)) : x >= 1e6 ? fmt(Math.round(x)) : fmt(Math.round(x * 10) / 10);

  /* ---- roll odds: Ability slots, Potential, Sailing Potential ---- */
  const ROLL = [
    ['ability_slots', 'Ability slots', /grade/i, '', 'gold'],
    ['potential', 'Potential', /grade/i, '', 'all'],
    ['sailing', 'Sailing Potential slot', /grade/i, '', [['Voyage Essence', 1], ['Lumber', 2]]],
  ];
  const AB_TRY = 10000, AB_OPEN = 3, POT_OPEN = 3; /* map: Reroll All with nothing kept costs 10,000 gold and rolls every open slot (3 free slots) */
  /* effect type = one even roll, separate from the grade; no event, link or supporter perk touches it (findings/checks/roll_types.md, user 2026-09-25) */
  const RTYPES = { ability_slots: ['STR', 'AGI', 'INT', 'Max HP'], potential: ['Bonus STR', 'Bonus AGI', 'Bonus INT', 'All Stats', 'Bonus Damage', 'Crit (chance and damage)'], sailing: ['Execute', 'Armor Weakening', 'Magic DR', 'Mana', 'HP Regen', 'Attack speed', 'Move speed'] };
  const PITY = 50000;
  /* Sailing grade chances out of 1,000,000 for a bad-luck counter RR (0..100) and top-grade multiplier th (x2 while the Sailing top-grade event is on). Index 0 = Normal ... 12 = Divinity, same order as the Grades table. */
  const sailP = (RR, th) => { let c = [2, 5 + Math.floor(RR / 5), 10 + Math.floor(RR / 3), 25 + RR, 100 + RR * 3, 500 + RR * 8, 2500 + RR * 20, 12000 + RR * 40, 50000 + RR * 80, 140000 + RR * 120, 300000 + RR * 150, 550000 + RR * 200];
    if (th > 1) { const y9 = (th - 1) * c[3]; c = c.map((x, i) => i < 4 ? x * th : x + y9); }
    const out = new Array(13).fill(0); let prev = 0; c.forEach((x, i) => { out[12 - i] = (x - prev) / 1e6; prev = x; }); out[0] = (1e6 - prev) / 1e6; return out; };
  const sailNext = (RR, g) => g >= 9 ? 0 : g === 8 ? Math.floor(RR / 4) : g === 7 ? Math.floor(RR / 2) : g === 6 ? Math.floor(RR * 3 / 4) : Math.min(100, RR + 1);
  const SAILC = {};
  /* survival S[n] = chance of no hit after n normal rolls (n < PITY), starting from an empty counter; the PITY-th roll is Divinity with a random effect */
  const sailSurv = (k, share, th) => { const key = k + '|' + share + '|' + th; if (SAILC[key]) return SAILC[key];
    const PT = []; for (let r = 0; r <= 100; r++) PT.push(sailP(r, th));
    let m = new Float64Array(101), nx = new Float64Array(101); m[0] = 1; const S = new Float64Array(PITY); S[0] = 1; let n = 1;
    for (; n < PITY; n++) { nx.fill(0); let tot = 0; for (let r = 0; r <= 100; r++) { const x = m[r]; if (!x) continue; const pr = PT[r];
        for (let g = 0; g < 13; g++) { const miss = g >= k ? pr[g] * (1 - share) : pr[g]; if (miss > 0) { const y = x * miss; nx[sailNext(r, g)] += y; tot += y; } } }
      [m, nx] = [nx, m]; S[n] = tot; if (tot < 1e-15) { n++; break; } }
    for (; n < PITY; n++) S[n] = 0;
    return (SAILC[key] = S); }; /* sailing: every 50,000 Voyage Essence spent guarantees a Divinity roll (1 essence per roll) */
  const roll = () => {
    const s = state.roll; const sysI = Math.max(0, ROLL.findIndex(r => r[0] === s.sys)); const [sys, label, re, note, cost] = ROLL[sysI];
    const T = tbl(sys, re); if (!T) return '<p class="small">No data.</p>';
    const gi = col(T, /^Grade$/), ci = col(T, /Chance/); const grades = T.rows.map(r => [r[gi], Number(r[ci])]);
    const tgt = grades.some(g => g[0] === s.g) ? s.g : grades[Math.min(5, grades.length - 1)][0];
    const types = RTYPES[sys] || []; const ty = types.includes(s.t) ? s.t : 'any'; const share = ty === 'any' ? 1 : 1 / types.length;
    const k = grades.findIndex(g => g[0] === tgt); const p1 = Math.min(1, grades.slice(k).reduce((a, g) => a + g[1], 0) / 100) * share; const p = cost === 'gold' ? 1 - Math.pow(1 - p1, AB_OPEN) : cost === 'all' ? 1 - Math.pow(1 - p1, POT_OPEN) : p1;
    const pity = sys === 'sailing';
    /* sailing: exact chain over the bad-luck counter; every PITY-th roll is Divinity with a random effect (hits a chosen effect 1 time in 7) and empties the counter, so cycles repeat */
    const sEv = (W.events || []).find(e => e.id === 'sailing_top2'), th = sEv && sEv.on ? 2 : 1;
    const S = pity ? sailSurv(k, share, th) : null, F = pity ? S[PITY - 1] * (1 - share) : 0;
    const expRolls = pity ? S.reduce((a, x) => a + x, 0) / (1 - F) : p > 0 ? 1 / p : Infinity;
    const q = x => { const left = 1 - x; if (!pity) return p >= 1 ? 1 : Math.ceil(Math.log(left) / Math.log(1 - p));   /* a 100% grade (e.g. Normal or better) sums to a hair over 1 */
      let kk = 0; while (F > 0 && Math.pow(F, kk + 1) > left && kk < 1000) kk++; const f = Math.pow(F, kk); let r = 0; while (r < PITY && f * S[r] > left) r++; return kk * PITY + r; };
    const unlucky = q(0.9);
    let lum = n => 0, extra = null;
    const gold = AB_TRY * (FX.ability_gold || 1);
    if (sys === 'potential') lum = n => n;   /* ALL with nothing locked costs 1 Lumber and rolls every free slot */
    else if (sys === 'sailing') { lum = n => 2 * n; extra = n => ` + ${nfmt(n)} Voyage Essence`; }
    const line = n => cost === 'gold' ? `<b>${nfmt(n * gold / 1e6)} Lumber</b> <span class="small">· ${fmt(Math.round(n * gold))} gold · ${nfmt(n)} Reroll All presses</span>` : cost === 'all' ? `<b>${nfmt(lum(n))} Lumber</b> <span class="small">· ${nfmt(n)} ALL presses</span>` : `<b>${nfmt(lum(n))} Lumber</b>${extra ? extra(n) : ''} <span class="small">· ${nfmt(n)} rolls</span>`;
    return `<p class="small">What it costs to roll one slot up to a grade you want, with live events.</p><div class="card"><div class="kv"><b>Roll</b><span>${sel('sys', ROLL.map(r => [r[0], r[1]]), sys)}</span><b>Until</b><span>${sel('g', grades.map(g => [g[0], g[0] + ' or better']), tgt)}</span><b>Effect</b><span>${sel('t', [['any', 'Any effect'], ...types.map(x => [x, x])], ty)}</span></div></div>
    <div class="card hi"><div class="kv"><b>Usually</b><span>${line(expRolls)}</span><b>If unlucky</b><span>${line(unlucky)}</span></div>
    <p class="small" style="margin:8px 0 0">"If unlucky": only 1 player in 10 needs more.${ty !== 'any' ? ` Every effect is equally likely: 1 roll in ${types.length} is ${esc(ty)}, whatever the grade.` : ''}${pity ? (ty === 'any' ? ` Every ${fmt(PITY)} Voyage Essence spent guarantees Divinity, so ${fmt(PITY)} rolls at most.` : ` Every ${fmt(PITY)} Voyage Essence spent guarantees Divinity, but its effect is still random.`) + ' Counts the bad-luck boost too, starting from an empty counter.' : ''}${cost === 'gold' ? ` Each press is a Reroll All with nothing equipped or protected: ${fmt(gold)} gold, all ${AB_OPEN} free slots roll at once. Lumber at 1,000,000 gold each.` : ''}${cost === 'all' ? ` Each press is ALL with nothing locked: 1 Lumber, all ${POT_OPEN} free slots roll at once. Save a preset first and load it back if the set gets worse.` : ''}${sys === 'sailing' ? ' Each roll costs 1 Voyage Essence and 2 Lumber.' : ''}</p></div>`;
  };

  /* ---- engraving: contribution and party dungeon clears ---- */
  const engr = () => {
    const s = state.engr; const C = tbl('party_dungeon', /Contribution cost|cost in Contribution/), Dg = tbl('party_dungeon', /^Dungeons$/);
    if (!C || !Dg) return '<p class="small">No data.</p>';
    const gold = s.track === 'gold'; const ci = gold ? 2 : 1;
    const from = Math.min(24, Math.max(0, Math.round(num(s.from)))); const to = Math.min(25, Math.max(from + 1, Math.round(num(s.to) || 25)));
    const need = C.rows.slice(from, to).reduce((a, r) => a + Number(r[ci]), 0);
    const di = col(Dg, /Dungeon/), pi = col(Dg, /Contribution per clear/), li = col(Dg, /Lumber per run/);
    const per = r => Number(r[pi]) + (/Snowfield/.test(r[di]) ? 0.2 * (FX.contribution || 1) : 0); /* Snowfield wave 10: 10% chance of +2 (x2 with the Contribution event) */
    return `<p class="small">Contribution for one Permanent Engraving track, and the clears it takes in each party dungeon.</p>
    <div class="card"><div class="kv"><b>Track</b><span>${sel('track', [['stat', 'Life, Balance, Guard, Battle, Move or Haste'], ['gold', 'Gold or Luck']], gold ? 'gold' : 'stat')}</span><b>From level</b><span><input class="calc" data-k="from" type="number" min="0" max="24" value="${from}" style="width:70px"></span><b>To level</b><span><input class="calc" data-k="to" type="number" min="1" max="25" value="${to}" style="width:70px"></span></div></div>
    <div class="card hi"><div class="kv"><b>Contribution needed</b><span>${fmt(need)}</span></div>
    <div class="tbl compact"><table><tr><th>Dungeon</th><th class="num">Per clear</th><th class="num">Clears</th><th class="num">Est. tickets</th><th class="num">Lumber earned</th></tr>${Dg.rows.map(r => { const n = Math.ceil(need / per(r)); return `<tr><td>${esc(r[di])}</td><td class="num">${nfmt(per(r))}</td><td class="num">${fmt(n)}</td><td class="num">${fmt(Math.ceil(n * 0.9))}</td><td class="num">${fmt(Math.floor(n * Number(r[li])))}</td></tr>`; }).join('')}</table></div>
    <p class="small">About 1 ticket in 10 is kept on entry. Lumber earned = clears x Lumber per run, before gold bonuses.</p></div>`;
  };

  /* ---- party dungeon titles: every wave-10 clear rolls one rank-up at the chance of your CURRENT rank (map 1.1.0, findings/22-party-dungeon-titles.md).
     Reads the Game Systems "Titles" table: rank cell "0-19" or a number, chance "0.5%", keep-ticket "10%". Base chances (no supporter bonus). ---- */
  const title = () => {
    const s = state.title; const T = tbl('party_dungeon', /^Titles$/); if (!T) return '<p class="small">No data.</p>';
    const ri = col(T, /^Rank$/), ci = col(T, /Rank-up chance/), ki = col(T, /keep ticket/i);
    const P = [], KEEP = []; let top = 0;
    T.rows.forEach(r => { const rk = String(r[ri]).split('-').map(Number), lo = rk[0], hi = rk.length > 1 ? rk[1] : rk[0];
      const c = parseFloat(String(r[ci])) / 100, k = parseFloat(String(r[ki])) / 100 || 0;
      for (let x = lo; x <= hi; x++) { P[x] = c > 0 ? c : 0; KEEP[x] = k; } top = Math.max(top, hi); });
    const from = Math.min(top - 1, Math.max(0, Math.round(num(s.from)))), to = Math.min(top, Math.max(from + 1, Math.round(num(s.to) || top)));
    let avg = 0, tickets = 0; for (let r = from; r < to; r++) { const e = 1 / P[r]; avg += e; tickets += e * (1 - KEEP[r]); }
    /* "if unlucky": clears until 9 players in 10 have reached the target rank (exact, rank by rank) */
    let m = new Float64Array(top + 1); m[from] = 1; let n = 0;
    while (m[to] < 0.9 && n < 1e6) { const nx = new Float64Array(top + 1); nx[to] = m[to]; for (let r = from; r < to; r++) { if (!m[r]) continue; nx[r + 1] += m[r] * P[r]; nx[r] += m[r] * (1 - P[r]); } m = nx; n++; }
    const opts = a => a.map(x => [String(x), String(x)]);
    return `<p class="small">Dungeon title rank-ups. Every wave-10 clear rolls one rank-up at the chance of your current rank.</p>
    <div class="card"><div class="kv"><b>From rank</b><span>${sel('from', opts([...Array(top).keys()]), from)}</span><b>To rank</b><span>${sel('to', opts([...Array(top).keys()].map(x => x + 1).filter(x => x > from)), to)}</span></div></div>
    <div class="card hi"><div class="kv"><b>Usually</b><span><b>${fmt(Math.round(avg))} clears</b></span><b>If unlucky</b><span><b>${fmt(n)} clears</b></span><b>Tickets used</b><span>about ${fmt(Math.round(tickets))} <span class="small">(the rest are kept on entry)</span></span></div>
    <p class="small" style="margin:8px 0 0">"If unlucky": only 1 player in 10 needs more. A clear = one full run to wave 10. Base chances, the supporter bonus is not counted.</p></div>`;
  };

  /* ---- relic enhancement: expected tries with the reset to +0 ---- */
  const relic = s => {
    const T = tbl('relic_enhancement', /Enhancement chances/); if (!T) return '<p class="small">No data.</p>';
    const si = col(T, /Success/), di = col(T, /Destroy|Reset/); const st = T.rows.map(r => ({ s: Number(r[si]) / 100, d: Number(r[di]) / 100 }));
    const from = Math.min(11, Math.max(0, Math.round(num(s.rfrom)))); const to = Math.min(12, Math.max(from + 1, Math.round(num(s.rto) || 12)));
    /* E[k] = 1 + s E[k+1] + stay E[k] + d E[0], solved as E[k] = a[k] + b[k] E[0] from the top down */
    const a = new Array(13).fill(0), b = new Array(13).fill(0);
    for (let k = to - 1; k >= 0; k--) { const x = st[k]; const m = x.s + x.d; a[k] = (1 + x.s * a[k + 1]) / m; b[k] = (x.s * b[k + 1] + x.d) / m; }
    const E0 = a[0] / (1 - b[0]); const tries = a[from] + b[from] * E0;
    return `<div class="card"><div class="kv"><b>From</b><span><input class="calc" data-k="rfrom" type="number" min="0" max="11" value="${from}" style="width:70px"></span><b>To</b><span><input class="calc" data-k="rto" type="number" min="1" max="12" value="${to}" style="width:70px"></span></div></div>
    <div class="card hi"><div class="kv"><b>Tries on average</b><span>${nfmt(tries)}</span><b>Relic Fragments</b><span>${fmt(Math.round(tries * 300))} <span class="small">· 300 per try</span></span></div><p class="small">For one relic, counting the tries that reset it to +0. Enhance picks a random unlocked relic, so lock every other relic to aim it.</p></div>
    <div class="tbl compact"><table><tr><th>Step</th><th class="num">Success</th><th class="num">Stays</th><th class="num">Resets to +0</th></tr>${st.slice(from, to).map((x, i) => `<tr><td>+${from + i} → +${from + i + 1}</td><td class="num">${pct(100 * x.s)}</td><td class="num">${pct(100 * Math.max(0, 1 - x.s - x.d))}</td><td class="num">${x.d > 0 ? pct(100 * x.d) : '-'}</td></tr>`).join('')}</table></div>`;
  };

  /* ---- enhancement calculator ---- */
  const chains = (() => { const out = {}; for (const r of R) { if (!/^Enhancement/.test(r.kind)) continue; const o = I[r.out]; if (!o || o.level == null) continue; const cands = r.in.filter(([k]) => I[k] && (I[k].family === o.family || I[k].type === o.type) && !/Stone/.test(I[k].name) && (I[k].level || 0) < o.level).sort((a, b) => (I[b[0]].level || 0) - (I[a[0]].level || 0)); const base = cands[0]; if (!base) continue; const key = o.family + (o.variant ? ' [' + o.variant + ']' : ''); (out[key] = out[key] || []).push({ lv: o.level, chance: r.chance, out: r.out, base: base[0], stone: r.in.filter(([k]) => k !== base[0]).map(([k, n]) => (n > 1 ? n + '× ' : '') + ((I[k] || {}).name || k)).join(' + ') }); } for (const k of Object.keys(out)) out[k].sort((a, b) => a.lv - b.lv); return out; })();
  const chainKeys = Object.keys(chains).sort();
  const aura = st => {
    const D = CALC.aura; if (!D || !(D.steps || []).length) return '<p class="small">No data.</p>';
    const sup = st.sup === '1'; const S = {}; D.steps.forEach(x => { S[x.frm] = { p: Math.min(100, x.p * (sup ? 1.2 : 1)) / 100, q: Math.min(100, x.q * (sup ? 1.2 : 1)) / 100 }; });
    const from = Math.min(9, Math.max(1, Math.round(num(st.tfrom) || 1))); const to = Math.min(10, Math.max(from + 1, Math.round(num(st.tto) || 10)));
    /* E[k] = base auras still needed from holding +k; a fail destroys both auras (back to nothing: E0 = 1 + E[1]) */
    const a = {}, b = {}; for (let k = 10; k >= 1; k--) { if (k >= to) { a[k] = 0; b[k] = 0; continue; } const x = S[k]; const k1 = Math.min(10, k + 1), k2 = Math.min(10, k + 2);
      a[k] = 1 + x.p * (1 - x.q) * a[k1] + x.p * x.q * a[k2]; b[k] = x.p * (1 - x.q) * b[k1] + x.p * x.q * b[k2] + (1 - x.p); }
    const E0 = (1 + a[1]) / (1 - b[1]); const E = k => a[k] + b[k] * E0;
    const P = {}; for (let k = 10; k >= 1; k--) P[k] = k >= to ? 1 : S[k].p * (1 - S[k].q) * P[Math.min(10, k + 1)] + S[k].p * S[k].q * P[Math.min(10, k + 2)];
    const fr = D.frag && I[D.frag.id] ? `${ilink(D.frag.id)}` : 'fragments';
    return `<div class="card"><div class="kv"><b>You hold</b><span><select class="calc" data-k="tfrom">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => `<option value="${l}" ${l === from ? 'selected' : ''}>+${l}</option>`).join('')}</select></span><b>Goal</b><span><select class="calc" data-k="tto">${[2, 3, 4, 5, 6, 7, 8, 9, 10].filter(l => l > from).map(l => `<option value="${l}" ${l === to ? 'selected' : ''}>+${l}</option>`).join('')}</select></span><b>Craft Supporter</b><span><label><input type="checkbox" class="calc" data-k="sup" ${sup ? 'checked' : ''}> x1.2 chances</label></span></div></div>
    <div class="card warn"><p style="margin:0"><b>A fail destroys both auras.</b> The averages below include starting over from nothing after every fail.</p></div>
    <div class="card hi"><div class="kv"><b>Base auras on average</b><span>${nfmt(E(from))}${D.frag ? ` <span class="small">= ${fmt(Math.round(E(from) * D.frag.n))} ${fr}</span>` : ''}</span><b>From nothing</b><span>${nfmt(E0)} base auras</span><b>No fail all the way</b><span>${nfmt(100 * P[from])}%</span></div></div>
    <div class="tbl compact fit"><table><tr><th>Step</th><th class="num">Success</th><th class="num">Skip a level</th><th class="num">Fail = lose both</th></tr>${D.steps.filter(x => x.frm >= from && x.frm < to).map(x => `<tr><td>+${x.frm} → +${x.to}</td><td class="num">${nfmt(100 * S[x.frm].p)}%</td><td class="num">${nfmt(100 * S[x.frm].p * S[x.frm].q)}%</td><td class="num">${nfmt(100 - 100 * S[x.frm].p)}%</td></tr>`).join('')}</table></div>
    <p class="small">Each try uses the aura you hold plus one base aura (+1 to +2 uses two base auras). The crafting event does not change these chances.</p>`;
  };
  const enh = () => {
    const s = state.enh; const mode = ['attr', 'relic', 'aura'].includes(s.mode) ? s.mode : 'gear';
    let body = '';
    if (mode === 'gear') {
      const key = chains[s.chain] ? s.chain : chainKeys[0]; const ch = chains[key] || []; const lvs = ch.map(x => x.lv);
      const from = lvs.includes(num(s.from)) ? num(s.from) : (lvs[0] - 1); const to = lvs.includes(num(s.to)) ? num(s.to) : lvs[lvs.length - 1];
      const steps = ch.filter(x => x.lv > from && x.lv <= to); const stones = steps.reduce((a, x) => a + (x.chance > 0 ? 100 / x.chance : 0), 0);
      body = `<div class="card"><div class="kv"><b>Item</b><span><select class="calc" data-k="chain">${chainKeys.map(k => `<option ${k === key ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select></span><b>From</b><span><select class="calc" data-k="from">${[lvs[0] - 1, ...lvs.slice(0, -1)].map(l => `<option value="${l}" ${l === from ? 'selected' : ''}>+${l}</option>`).join('')}</select></span><b>To</b><span><select class="calc" data-k="to">${lvs.map(l => `<option value="${l}" ${l === to ? 'selected' : ''}>+${l}</option>`).join('')}</select></span></div></div>
      ${steps.length ? `<div class="card hi"><div class="kv"><b>Stones on average</b><span>${fmt(Math.round(stones))} <span class="small">${esc(steps[0].stone)}</span></span><b>Steps</b><span>${steps.length}</span></div></div><div class="tbl compact"><table><tr><th>Step</th><th class="num">Chance</th><th class="num">Tries on average</th></tr>${steps.map(x => `<tr><td>${ilink(x.out)}</td><td class="num">${pct(x.chance)}</td><td class="num">${x.chance > 0 ? fmt(Math.round(100 / x.chance * 10) / 10) : '-'}</td></tr>`).join('')}</table></div>` : '<p class="small">Pick a higher target.</p>'}`;
    } else {
      const PROT = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 20, 20, 20, 20, 50, 50, 50, 50, 50, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300];   /* map: extra Lumber per try with Destruction Protection */
      const prot = s.prot === '1';
      const A = (CALC.attribute || []).map(r => prot && r.lv >= 15 ? { ...r, keep: r.keep + r.d2 / 2, d1: r.d1 + r.d2 / 2, d2: 0, lumber: r.lumber + Math.ceil(PROT[r.lv] * ((r.lumber_base && r.lumber_base !== r.lumber) ? 0.5 : 1)) } : r); const from = Math.min(39, Math.max(0, num(s.afrom))); const to = Math.min(40, Math.max(from + 1, num(s.ato) || 40));
      // expected stones / lumber from level l to reach 'to': E[l] = cost + keep*E[l] + s*E[l+1] + d1*E[down1] + d2*E[down2]; floor = highest safe multiple of 5 reached
      const floorOf = l => l - l % 5; /* a fail never drops below the last multiple of 5 */ const isSafe = r => r.safe || (r.lv >= 10 && r.lv % 5 === 0);
      const solve = costKey => { const E = new Array(41).fill(0); for (let it = 0; it < 4000; it++) { for (let l = to - 1; l >= from; l--) { const r = A[l]; if (!r) continue; const dn1 = Math.max(floorOf(l), l - 1), dn2 = Math.max(floorOf(l), l - 2); const c = r[costKey] || 0; const keep = r.keep / 100, sp = r.s / 100, p1 = isSafe(r) ? 0 : r.d1 / 100, p2 = isSafe(r) ? 0 : r.d2 / 100; const kp = isSafe(r) ? 1 - sp : keep; E[l] = (c + sp * E[l + 1] + p1 * E[dn1 < from ? from : dn1] + p2 * E[dn2 < from ? from : dn2]) / (1 - kp); } } return E[from]; };
      const st = solve('stones'), lu = solve('lumber');
      body = mode === 'aura' ? aura(s) : mode === 'relic' ? relic(s) : `<div class="card"><div class="kv"><b>From</b><span><input class="calc" data-k="afrom" type="number" min="0" max="39" value="${from}" style="width:70px"></span><b>To</b><span><input class="calc" data-k="ato" type="number" min="1" max="40" value="${to}" style="width:70px"></span><b>Destruction Protection</b><span><label><input class="calc" data-k="prot" type="checkbox" ${prot ? 'checked' : ''}> on from +15</label></span></div></div>
      <div class="card hi"><div class="kv"><b>Attribute Stones on average</b><span>${fmt(Math.round(st))}</span><b>Lumber on average</b><span>${fmt(Math.round(lu))}</span></div><p class="small">Includes failures that drop you back, never below the last multiple of 5. +0 to +10, +15, +20, +25, +30 and +35 cannot drop. ${prot ? 'Protection turns a destroy into stay or drop 1 and adds its Lumber to every try from +15.' : 'Without Destruction Protection: a destroy drops 2 levels.'}</p></div>
      <div class="tbl compact"><table><tr><th>Step</th><th class="num">Success</th><th class="num">Keep</th><th class="num">Drop 1</th><th class="num">Drop 2</th><th class="num">Stones</th><th class="num">Lumber</th></tr>${A.slice(from, to).map(r => `<tr><td>+${r.lv} → +${r.lv + 1}${isSafe(r) ? ' <span class="tag ok">safe</span>' : ''}</td><td class="num">${r.s_base != null && r.s_base !== r.s ? `<span class="evv">${pct(r.s)}</span><span class="evb">${pct(r.s_base)}</span>` : pct(r.s)}</td><td class="num">${isSafe(r) ? pct(100 - r.s) : pct(r.keep)}</td><td class="num">${isSafe(r) ? '-' : pct(r.d1)}</td><td class="num">${isSafe(r) ? '-' : pct(r.d2)}</td><td class="num">${r.stones}</td><td class="num">${r.lumber_base != null ? `<span class="evv">${fmt(r.lumber)}</span><span class="evb">${fmt(r.lumber_base)}</span>` : fmt(r.lumber)}</td></tr>`).join('')}</table></div>`;
    }
    const intro = { gear: 'Enhancement Stones an item takes on average. A failed try only loses the stone.', attr: 'Attribute Stones and Lumber from one level to another, with the chances of the live events.', relic: 'Relic Fragments one relic takes on average.', aura: 'Taegeuk Guardian Aura upgrades: base auras it takes on average, counting every restart after a fail.' }[mode];
    return `${subtabs('calc', 'mode', [['gear', 'Item enhancement'], ['attr', 'Attribute enhancement'], ['relic', 'Relic enhancement'], ['aura', 'Taegeuk aura']], mode)}<p class="small">${intro}</p>${body}`;
  };

  const TABS = [['drop', 'Drop chance'], ['enh', 'Enhancement'], ['roll', 'Roll odds'], ['engr', 'Engraving'], ['title', 'Dungeon titles']];
  P.calc = (_, f) => { const t = TABS.some(([k]) => k === f.tool) ? f.tool : 'drop'; if (f.mode) state.enh.mode = f.mode; return `<h2>Calculators</h2>${subtabs('calc', 'tool', TABS, t)}${evNote(t)}${({ drop, enh, roll, engr, title })[t]()}`; };
  K.hooks.push((page, out) => {
    if (page !== 'calc') return;
    const cur = (K.filters.tool && TABS.some(([k]) => k === K.filters.tool)) ? K.filters.tool : 'drop';
    out.querySelectorAll('.calc-by').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); state.drop.by = a.dataset.by; K.route(); }));
    out.querySelectorAll('.calc').forEach(el => el.addEventListener(el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input', () => {
      const s = state[cur]; const k = el.dataset.k;
      if (k === 'm') { const m = Object.values(M).find(x => x.name.toLowerCase() === el.value.trim().toLowerCase()); s.m = m ? m.id : ''; s.mtext = el.value; if (!m) return; }
      else if (k === 'it') { const it = Object.values(I).find(x => (x.drops || []).length && x.name.toLowerCase() === el.value.trim().toLowerCase()); s.it = it ? it.id : ''; s.ittext = el.value; if (!it) return; }
      else if (el.type === 'checkbox') s[k] = el.checked ? '1' : '0';
      else s[k] = el.value;
      /* keep exactly what the user typed (an emptied box stays empty) and the cursor where it was: number boxes
         cannot report the cursor, so theirs goes to the end (bug 2026-09-25: clearing then typing 100 gave 001) */
      const pos = el.selectionStart, raw = el.value; K.route(); const n = out.querySelector(`.calc[data-k="${k}"]`);
      if (n && n.tagName !== 'SELECT') { n.focus(); if (n.type === 'number') { n.value = ''; n.value = raw; } else { try { n.setSelectionRange(pos, pos); } catch (e) { } } }
    }));
  });

})(window.WK);
