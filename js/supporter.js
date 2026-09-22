/* Supporter rewards, Companions (Anya etc.), Pets, Commands - public wording */
(function (K) {
  const { W, I, M, esc, link, tag, fmt, ilink, mlink, gen, P, INDEX, KL, subtabs, filterBox } = K;
  const S = W.supporter, CO = W.companions, PE = W.pets, CM = W.commands;
  const ul = a => a && a.length ? `<ul>${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
  const TABS = [['overview', 'What is sold'], ['wings', 'Wings'], ['auras', 'Auras'], ['tiers', 'Supporter tiers']];
  const byGroup = g => S.flags.filter(x => x.group === g);
  const TIERS = [[1, 8, 5], [2, 16, 8], [3, 24, 10], [4, 32, 12], [5, 44, 18], [6, 56, 25], [7, 68, 35], [8, 92, 40], [9, 116, 50], [10, 140, 60], [11, 170, 70], [12, 200, 90], [13, 230, 120], [14, 265, 150], [15, 300, 185], [16, 335, 220], [17, 370, 250], [18, 405, 280], [19, 440, 310], [20, 475, 340]];
  const roman = n => ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'][n];
  const overview = () => {
    const heroes = byGroup('hero'); const slots = S.flags.filter(x => x.group === 'slot'); const potion = S.flags.filter(x => x.group === 'potion');
    return `<p class="small">Buy through a Discord ticket. Rewards are account-wide.</p>
    <div class="grid">
      <div class="card"><h3>Hero unlock - $20</h3><p>One supporter hero for your account. Hero swap $25, swap + unlock $35.</p><p class="small">${[...new Set(heroes.flatMap(h => (h.items || []).map(o => { const u = (W.heroes || []).find(x => x.id === o.id); return u ? u.lineage : ''; }).filter(Boolean)))].map(l => link('hero', l, l)).join(' · ')}</p><p>${link('heroes', '', 'Heroes')}</p></div>
      <div class="card"><h3>Wings - $10 each</h3><p>+3% attack speed per wing you own. All 14 add another +20%.</p><p>${link('supporter?tab=wings', '', 'Wings')}</p></div>
      <div class="card"><h3>Auras - $10 each</h3><p>+3% damage per aura you own. All 14 add another +28%.</p><p>${link('supporter?tab=auras', '', 'Auras')}</p></div>
      <div class="card"><h3>Pets - $15 each</h3><p>Only the equipped pet gives its bonus. Bonuses don't stack. Slot 2 is not for sale yet.</p><p>${link('pets', '', 'Pets')}</p></div>
      <div class="card"><h3>Auto-Pot - $5</h3><p>Drinks your potion for you at 70% HP or lower. Heals 10% of max HP, 20% from level 100, 30% from level 500. 20 s cooldown.</p></div>
      <div class="card"><h3>Stat slots - $10 / $15</h3><p>4th slot: buy it or unlock it free in game. 5th slot $10. Both for $15.</p></div>
    </div>
    <p>Permanent EXP / Gold / Drop bonuses are sold separately: ${link('supporter?tab=tiers', '', 'Supporter tiers')}.</p>`;
  };
  const tiers = () => `<p>Permanent EXP / Gold / Drop bonus. Each tier is bought separately.</p><div class="tbl"><table><tr><th>Tier</th><th class="num">EXP / Gold / Drop</th><th class="num">Price</th></tr>${TIERS.map(([n, p, d]) => `<tr><td>Tier ${roman(n)}</td><td class="num">+${p}%</td><td class="num">$${d}</td></tr>`).join('')}</table></div><p class="small">No top tier. After Tier XVI ($220), each tier adds +35% EXP / Gold / Currency for +$30. The bonus caps at +1000%.</p>`;
  const wings = () => `<div class="card hi"><h3>Permanent wing bonuses</h3><ul style="margin:0"><li>Per owned wing: +3% attack speed.</li><li>Own all 14 wings: another +20% attack speed.</li></ul></div><p class="small">The wing you show is cosmetic. w1 to w14 picks one, w0 is automatic, -wingoff hides it. A hidden wing keeps its bonus.</p>`;
  const auras = () => `<div class="card hi"><h3>Permanent aura bonuses</h3><ul style="margin:0"><li>Per owned aura: +3% damage. Every attack adds 3% of your Strength + Agility + Intelligence.</li><li>Own all 14 auras: another +28% damage.</li></ul></div><p class="small">The aura you show is cosmetic. a1 to a14 picks one, a0 is automatic, -auraoff hides it, -auraon shows it again. A hidden aura keeps its bonus.</p>`;
  P.supporter = (_, f) => { const t = TABS.some(([k]) => k === f.tab) ? f.tab : 'overview'; return `<h2>Supporter</h2>${subtabs('supporter', 'tab', TABS, t)}${({ overview, wings, auras, tiers })[t](f)}`; };

  /* ---- companions ---- */
  const compCard = c => `<div class="card"><h3>${I[c.item.id] ? ilink(c.item.id) : esc(c.item.name)} <span class="small">becomes ${mlink(c.unit.id)}</span></h3><div class="kv"><b>Effect</b><span>${esc(c.effect)}</span><b>How to get</b><span>${esc(c.obtained)}${(c.drops_from || []).length ? ' ' + c.drops_from.map(d => mlink(d.id)).join(', ') : ''}</span>${(c.made_from || []).length ? `<b>Made from</b><span>${gen(c.made_from)}</span>` : ''}${(c.crafts_into || []).length ? `<b>Crafts into</b><span>${gen(c.crafts_into)}</span>` : ''}${(c.notes || []).length ? `<b>Notes</b><span>${ul(c.notes)}</span>` : ''}</div></div>`;
  /* ---- pets ---- */
  const first = s => String(s).split(/(?<=[.;])\s/)[0];
  const aura = p => (p.summoned || []).filter(s => !/^(Magic immunity|Nothing|No aura|No magic)/.test(s) && !/only a label/.test(s)).map(first).map(s => s.replace(/\s*No magic immunity\.?$/, ''));
  P.pets = id => {
    if (id) { const p = PE.pets.find(x => x.code === id); if (!p) return '<p>Unknown pet.</p>';
      return `<h2>${esc(p.name)}</h2><p class="small">${link('pets', '', 'All pets')}</p><div class="card"><div class="kv">${p.passive ? `<b>Bonus to you</b><span>${esc(p.passive.text)}</span><b>Value</b><span>${esc(p.passive.base)}${p.passive.evolution_stone && !/^no/i.test(p.passive.evolution_stone) ? ` · with an Evolution Stone ${esc(p.passive.evolution_stone)}` : ''}${p.passive.full_collection ? ` · full collection ${esc(p.passive.full_collection)}` : ''}${p.passive.both ? ` · stone + full collection ${esc(p.passive.both)}` : ''}</span>` : `<b>Bonus to you</b><span>None, only the effects below</span>`}<b>What the pet itself does</b><span>${ul((p.summoned || []).filter(s => !/^Magic immunity/.test(s)))}</span>${p.evolved ? `<b>Evolved form</b><span>${mlink(p.evolved.id)}, with an Evolution Stone in the pet's inventory</span>` : ''}${p.obtained_item ? `<b>How to get</b><span>carry ${ilink(p.obtained_item.id)}</span>` : ''}</div></div>`; }
    return `<h2>Pets</h2>
    <div class="card hi"><ul style="margin:0"><li>Pets 1-12 are supporter rewards, $15 each. Lumipaca comes from the Alpaca bundle item.</li><li>Pet slot 1 is for sale. Slot 2 is not for sale yet.</li><li>Only the pet you have out gives its bonus. Owning several doesn't stack them.</li><li>If you own Kain, equipping another pet gives a weaker lifesteal.</li></ul></div>
    <div class="tbl"><table><tr><th>Pet</th><th>Bonus to you</th><th>What the pet itself does</th></tr>${PE.pets.map(p => `<tr><td>${link('pets', p.code, p.name.split(',')[0].replace(' - Hero Form', ''))}</td><td class="small">${p.passive ? `${esc(first(p.passive.text).replace(/:.*$/, ''))}: <b>${esc(p.passive.base)}</b>` : '-'}</td><td class="small">${aura(p).map(esc).join('<br>') || '-'}</td></tr>`).join('')}</table></div>
    <h3>Companions</h3><p class="small">Put one in a storage bag and the bag becomes the companion. Anya is free with every hero and handles -autopickup.</p><div class="tbl"><table><tr><th>Companion</th><th>Bonus</th></tr>${CO.items.map(c => `<tr><td>${ilink(c.item.id)}</td><td class="small">${esc((s => /^No (aura|stats)/.test(s) ? (/Anya/.test(c.item.name) ? 'Auto-pickup helper' : 'Cosmetic') : s.charAt(0).toUpperCase() + s.slice(1).replace(/[;,]$/, '.'))(String(c.effect).replace(/^Ownership bonus \([^)]*\): /, '').split(/(?<=[.;])\s/)[0]))}</td></tr>`).join('')}</table></div>
    <details><summary>Pet handling, Full Collection, Evolution Stone</summary>${ul(PE.rules.filter(r => !/^Two pet slots/.test(r)))}${PE.evolution_stone ? `<p>${ilink(PE.evolution_stone.id)}</p>` : ''}</details>`;
  };
  /* ---- commands (only what the map's Help lists) ---- */
  P.commands = () => `<h2>Commands</h2>${CM.sections.map(s => `<h3>${esc(s.title)}</h3><div class="tbl"><table><tr><th>Command</th><th>What it does</th></tr>${s.commands.map(c => `<tr><td><code>${esc(c.command)}</code>${c.argument ? `<br><span class="small">${esc(c.argument)}</span>` : ''}${(c.aliases || []).filter(a => !/[ㄱ-힝]/.test(a)).length ? `<br><span class="small">also: ${c.aliases.filter(a => !/[ㄱ-힝]/.test(a)).map(a => `<code>${esc(a)}</code>`).join(' ')}</span>` : ''}</td><td class="small">${esc(c.does)}</td></tr>`).join('')}</table></div>`).join('')}`;

  KL.supporter = 'Supporter'; KL.companions = 'Companion'; KL.pets = 'Pet'; KL.commands = 'Command'; KL['supporter?tab=overview'] = 'Supporter reward';
  for (const x of S.flags) if (['potion'].includes(x.group)) INDEX.push({ k: 'supporter?tab=overview', id: '', t: x.name, s: 'supporter reward · ' + x.effect.slice(0, 120), w: 2 });
  for (const c of CO.items) INDEX.push({ k: 'pets', id: '', t: c.item.name + ' (' + c.unit.name + ')', s: 'companion · ' + c.effect.slice(0, 100), w: 3 });
  for (const p of PE.pets) INDEX.push({ k: 'pets', id: p.code, t: p.code + ' ' + p.name, s: 'pet · ' + (p.passive ? p.passive.text : (p.summoned || [''])[0]).slice(0, 100), w: 3 });
  for (const s of CM.sections) for (const c of s.commands) INDEX.push({ k: 'commands', id: '', t: c.command, s: c.does.slice(0, 100), w: 3 });
})(window.WK);
