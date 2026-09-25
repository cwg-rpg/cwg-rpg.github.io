/* Game systems (verified tables) and the community guide */
(function (K) {
  const { W, I, M, Z, esc, link, tag, fmt, ilink, mlink, gen, P, INDEX, KL, subtabs, tbl } = K;
  const SY = W.systems || {};
  const NAMES = { attribute_enhancement: 'Attribute enhancement', relic_enhancement: 'Relic enhancement', ability_slots: 'Ability slots', potential: 'Potential', sailing: 'Sailing', party_dungeon: 'Party dungeon', awakening: 'Awakening', potions: 'Potions', stat_shop: 'Stat shop', hidden_items: 'Hidden items', dimension_link: 'Dimension Link' };
  if (W.supporter && W.supporter.link && !SY.dimension_link) SY.dimension_link = { summary: W.supporter.link.summary + ' ' + (W.supporter.link.points || ''), tables: [{ title: 'Perks by points', columns: ['Points', 'Perk'], rows: (W.supporter.link.perks || []).map(p => [p.points, p.perk]) }] };
  const SORDER = ['potions', 'stat_shop', 'awakening', 'ability_slots', 'attribute_enhancement', 'party_dungeon', 'potential', 'sailing', 'relic_enhancement', 'dimension_link'];
  const KEYS0 = Object.keys(SY).filter(k => !['unverified', 'rules'].includes(k) && SY[k] && typeof SY[k] === 'object' && !Array.isArray(SY[k]));
  const KEYS = [...KEYS0].sort((a, b) => (SORDER.indexOf(a) + 1 || 99) - (SORDER.indexOf(b) + 1 || 99));
  const cell = c => typeof c === 'object' && c && c.id ? (I[c.id] ? ilink(c.id) : M[c.id] ? mlink(c.id) : esc(c.name)) : esc(c);
  const table0 = t => `<h4>${esc(t.title || '')}${(t.events || []).map(x => `<span class="evtag">${esc(x)}</span>`).join('')}</h4>${t.note ? `<p class="small">${esc(t.note)}</p>` : ''}<div class="tbl compact${t.fit || (t.columns || []).length <= 3 ? ' fit' : ''}"><table><tr>${(t.columns || []).map(c => `<th>${esc(c)}</th>`).join('')}</tr>${(t.rows || []).map(r => `<tr>${r.map(c => `<td class="${typeof c === 'number' || (c && c.ev) ? 'num' : ''}">${c == null ? '' : typeof c === 'number' ? fmt(c) : K.evCell(c) || cell(c)}</td>`).join('')}</tr>`).join('')}</table></div>`;
  const table = t => t.collapsed ? `<details class="tcol"><summary>${esc(t.title || '')}</summary>${table0(Object.assign({}, t, { title: '' }))}</details>` : table0(t);
  P.systems = (_, f) => {
    if (!KEYS.length) return '<h2>Game systems</h2><p class="small">Not built yet.</p>';
    const k = KEYS.includes(f.sys) ? f.sys : KEYS[0]; const s = SY[k];
    const head = `<h2>Game systems</h2>${subtabs('systems', 'sys', KEYS.map(x => [x, s && SY[x].title || NAMES[x] || x.replace(/_/g, ' ')]), k)}`;
    const shops = '';   /* stat shop towns are named in the page's own table */
    if (s.how) return `${head}<h3>${esc(s.title || NAMES[k] || k)}</h3><p>${esc(s.what || '')}${s.open ? ` <span class="small">· ${esc(s.open)}</span>` : ''}</p>${(s.live || []).length ? `<div class="evstrip small-strip"><span class="evl"><span class="evdot"></span>Live event</span>${s.live.map(e => `<div><a class="evchip" href="#events">${esc(e.chip)}</a> <span class="evw">${esc(e.what)}</span></div>`).join('')}</div>` : ''}${(s.how || []).length || (s.tips || []).length ? `<div class="sys-grid${(s.tips || []).length && (s.how || []).length ? '' : ' one'}">${(s.how || []).length ? `<div class="card"><h4 style="margin-top:0">How</h4><ol>${s.how.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>` : ''}${(s.tips || []).length ? `<div class="card tips"><h4 style="margin-top:0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/></svg>Tips</h4><ul>${s.tips.map(x => { const [h, ...ls] = String(x).split('\n'); return `<li>${esc(h)}${ls.length ? `<ul class="tip-list">${ls.map(l => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}</li>`; }).join('')}</ul></div>` : ''}</div>` : ''}${shops}${(s.items || []).length ? `<p class="small">Items: ${gen(s.items)}</p>` : ''}${(s.monsters || []).length ? `<p class="small">Bosses: ${gen(s.monsters)}</p>` : ''}${(s.tables || []).map(table).join('')}`;
    return `${head}<h3>${esc(NAMES[k] || k)}</h3><p>${esc(s.summary || '')}</p>${(s.rules || []).length ? `<ul>${s.rules.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${shops}${(s.items || []).length ? `<p>Items: ${gen(s.items)}</p>` : ''}${(s.tables || []).map(table).join('')}`;
  };
  /* ---- events (read from the map at build time) ---- */
  P.events = () => {
    const E = W.events || []; const on = E.filter(e => e.on), off = E.filter(e => !e.on);
    const where = e => (e.links || []).map(l => `<a href="#${l[0]}">${esc(l[1])}</a>`).join(' · ');
    const card = e => `<div class="card ${e.on ? 'evon' : 'evoff'}"><h3>${esc(e.name)}${e.on ? '<span class="evtag">Live</span>' : ''}</h3><p>${esc(e.what)}</p>${(e.links || []).length ? `<p class="small">${e.on ? 'Boosted values shown on' : 'Changes'}: ${where(e)}</p>` : ''}</div>`;
    return `<h2>Events</h2><p class="small">Events are switched on by the map maker in each map version. Tables across the wiki show the event value in <span class="evv">gold</span> with the normal value <span class="evb" style="margin:0">crossed out</span>.</p>`
      + (K.ezLine && K.ezLine() ? `<div class="evstrip col">${K.ezLine()}</div>` : '')
      + (on.length ? `<h3>Live now (${on.length})</h3><div class="evgrid">${on.map(card).join('')}</div>` : '<p>No events are live in this map version.</p>')
      + (off.length ? `<h3>Off in this map version (${off.length})</h3><div class="evgrid">${off.map(card).join('')}</div>` : '');
  };
  /* ---- guides (verified progression + Stoner's route) ---- */
  P.guides = id => {
    const G = W.guides || [];
    let stat = 'STR'; try { stat = localStorage.getItem('cwgStat') || 'STR'; } catch (e) { }
    const swap = c => K.swapVar(c, stat);
    const rich = s => esc(s).replace(/\{\{i:([A-Z0-9]{4})\}\}/g, (m, c) => ilink(swap(c))).replace(/\{\{m:([A-Za-z0-9]{4})\}\}/g, (m, c) => mlink(c)).replace(/\{\{z:(z\d\d)\}\}/g, (m, c) => Z[c] ? link('zone', c, Z[c].name) : c).replace(/\{\{l:([^|}]+)\|([^}]+)\}\}/g, (m, h, txt) => `<a href="#${h.replace(/&amp;/g, '&')}">${txt}</a>`);
    const f = K.filters; const g = G.find(x => x.id === id) || G[0]; if (!g) return '<h2>Guides</h2>';
    let done = {}; try { done = JSON.parse(localStorage.getItem('cwgGuideDone') || '{}') || {}; } catch (e) { done = {}; }
    let owned = {}; try { owned = JSON.parse(localStorage.getItem('cwgOwned') || '{}') || {}; } catch (e) { }
    const results = txt => { const i = txt.lastIndexOf('->'); return i < 0 ? [] : [...txt.slice(i).matchAll(/\{\{i:([A-Z0-9]{4})\}\}/g)].map(m => swap(m[1])); };
    const stepsHtml = (steps, key) => g.plain ? `<table class="steps plain">${(steps || []).map(st => `<tr>${st.h ? `<td class="small"><b>${esc(st.h)}</b></td>` : ''}<td${st.h ? '' : ' colspan="2"'}>${rich(st.t)}</td></tr>`).join('')}</table>` : (() => { let zone = null, n = 0; const numbered = g.id === 'gear'; const ownedDone = (steps || []).map(st => { const res = results(st.t); return g.id !== 'early-game' && res.length && res.every(x => owned[x]); }); let lastOwned = -1; ownedDone.forEach((v, i) => { if (v) lastOwned = i; }); const rowOf = (st, i, n) => { const k = key + ':' + i; const res = results(st.t); const isDone = done[k] || i <= lastOwned; const parts = numbered && st.t.includes('->') ? [st.t.slice(0, st.t.lastIndexOf('->')).trim(), st.t.slice(st.t.lastIndexOf('->') + 2).trim()] : null; return `<tr class="${isDone ? 'done' : ''}"><td><input type="checkbox" class="gstep" data-k="${k}" data-res="${res.join(',')}" ${isDone ? 'checked' : ''}></td>${numbered ? `<td class="small num">${n}</td><td>${parts ? rich(parts[0]) : rich(st.t)}</td><td>${parts ? '→ ' + rich(parts[1]) : ''}</td>` : `<td class="small"><b>${esc(st.h)}</b></td><td>${rich(st.t)}</td>`}</tr>`; };
      const isDoneAt = i => !!(done[key + ':' + i] || i <= lastOwned);
      if (!numbered) return `<table class="steps">${(steps || []).map((st, i) => rowOf(st, i, i + 1)).join('')}</table>`;
      /* gear routes: one foldable block per zone (user 2026-09-25); finished zones fold to one line, the first zone with an open step opens by itself */
      const groups = []; (steps || []).forEach((st, i) => { if (!groups.length || (st.h !== zone && !/^Step /.test(st.h))) { zone = st.h; groups.push({ z: /^Step /.test(st.h) ? 'Start' : st.h, ix: [] }); } groups[groups.length - 1].ix.push(i); });
      const curG = groups.findIndex(gp => gp.ix.some(i => !isDoneAt(i)));
      const nz = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
      const realmOfZid = zid => Z[zid] ? Z[zid].realm : '';
      const realmOfMon = mid => { const m = M[mid]; if (!m || !m.zones.length) return ''; const z = m.zones.map(x => Z[x.zone]).filter(Boolean).sort((a, b) => a.order - b.order)[0]; return z ? z.realm : ''; };
      let lastRealm = '';
      for (const gp of groups) { const hz = W.zones.find(z => nz(z.name) === nz(gp.z) || nz(z.name.split(' - ')[0]) === nz(gp.z)); let r = hz ? hz.realm : '';
        for (const i of gp.ix) { if (r) break; const s = steps[i].t; const mz = s.match(/\{\{z:(z\d\d)\}\}/); const mm = s.match(/\{\{m:([A-Za-z0-9]{4})\}\}/); r = (mz && realmOfZid(mz[1])) || (mm && realmOfMon(mm[1])) || ''; }
        gp.realm = r || lastRealm; lastRealm = gp.realm; }
      const realmStat = r => { const gs = groups.filter(gp => gp.realm === r); return [gs.filter(gp => gp.ix.every(isDoneAt)).length, gs.length]; };
      let shownRealm = null;
      /* finished zones are hidden (user 2026-09-25), one link brings them back in case a tick was a mistake */
      let hideDone = true; try { hideDone = localStorage.getItem('cwgGuideHideDone') !== '0'; } catch (e) { }
      const nDone = groups.filter(gp => gp.ix.every(isDoneAt)).length;
      const bar = `<p class="small zf-all">${nDone ? (hideDone ? `✓ ${nDone} finished zone${nDone > 1 ? 's' : ''} hidden · <a href="#" data-zdone="0">Show</a> · ` : `<a href="#" data-zdone="1">Hide finished zones</a> · `) : ''}<a href="#" data-zall="1">Open all</a> · <a href="#" data-zall="0">Close all</a></p>`;
      if (curG < 0 && hideDone && nDone) return bar + '<p>Route finished. Every zone is done.</p>';
      const AHEAD = 3, more = !!ZMORE[key]; const upto = curG < 0 ? groups.length : curG + AHEAD;
      const nLater = groups.filter((gp, gi) => gi > upto && !(gp.ix.every(isDoneAt) && hideDone)).length;
      const moreLink = nLater ? `<p class="small zf-more"><a href="#" data-zmore="${more ? 0 : 1}">${more ? 'Show fewer zones' : `Show ${nLater} more zone${nLater > 1 ? 's' : ''}`}</a></p>` : '';
      return `${bar}<div class="zfolds">${groups.map((gp, gi) => { const nd = gp.ix.filter(isDoneAt).length, all = nd === gp.ix.length, zk = key + '|' + gi; if (all && hideDone) return ''; if (!more && gi > upto) return ''; let rdiv = ''; if (gp.realm && gp.realm !== shownRealm) { shownRealm = gp.realm; const [rd, rn] = realmStat(gp.realm); rdiv = `<div class="zf-realm">${esc(gp.realm)}<span>${rd}/${rn} done</span></div>`; } const open = ZSTATE[zk] !== undefined ? ZSTATE[zk] : gi === curG; return `${rdiv}<details class="zfold${all ? ' done' : ''}${gi === curG ? ' cur' : ''}" data-z="${esc(zk)}"${open ? ' open' : ''}><summary><span class="zf-n">${esc(gp.z)}</span><span class="zf-c">${all ? '✓ ' : ''}${nd}/${gp.ix.length}</span></summary><table class="steps route">${gp.ix.map(i => rowOf(steps[i], i, i + 1)).join('')}</table></details>`; }).join('')}</div>${moreLink}`; })();
    const secs = g.sections || [{ h: 'Steps', steps: g.steps }]; const cur = secs.some(s => s.h === f.gsec) && g.id === f.gid ? f.gsec : secs[0].h; f.gid = g.id;
    const si = secs.findIndex(s => s.h === cur);
    return `<h2>Guides</h2>${K.profileBar()}<div class="sub-tabs">${G.map(x => `<a href="#guides/${x.id}" class="${x.id === g.id ? 'on' : ''}">${esc(x.title)}</a>`).join('')}</div>${g.intro ? `<p class="small">${rich(g.intro)}</p>` : ''}${g.plain ? '' : `${K.statBar('stat', 'Items switch to this version')}<p><span class="small">☑ Tick steps as you go. A tick fills in everything above, an untick clears everything below. Early-game ticks carry over to the gear guide. Saved in this browser only</span></p>`}${secs.length > 1 ? subtabs('guides/' + g.id, 'gsec', secs.map(s => [s.h, s.h]), cur) : ''}<div class="card"><h3>${esc(g.title)}${secs.length > 1 ? ' · ' + esc(cur) : ''}</h3>${secs[si].table ? `<div class="tbl"><table><tr>${secs[si].table.columns.map(c => `<th>${esc(c)}</th>`).join('')}</tr>${secs[si].table.rows.map(r => `<tr>${r.map((c, ci) => `<td class="${ci === 0 ? 'num' : ci === 1 ? '' : 'small'}">${ci === 1 ? `<b>${esc(c)}</b>` : esc(c)}</td>`).join('')}</tr>`).join('')}</table></div>` : stepsHtml(secs[si].steps, g.id + ':' + si)}</div>`;
  };
  const CHANGES = [   /* one entry per DAY (date only, no version numbers), newest first; every category once, in ORDER; merge same-day lines into that day */
    ['25 Sep 2026', [
      ['Monsters and items', [
        'Pick a zone under the realm tabs to see only that zone. No more scrolling through a whole realm.',
      ]],
      ['Heroes', [
        'Ability keys rechecked against the map: every active shows the key you press (transformation skills too), passives show none.',
        'No more Offtank tag: White King, Aran, Emberclaw and Death Spirit are tagged Damage, their kits carry real damage procs. Tank stays Nature\'s, the only taunt.',
      ]],
      ['Tier list', [
        'Scores redone from the kit recheck. Big movers: Tidecaller\'s skills stack about -19% armor (Utility #2), Heavenly Path hits harder and executes bosses at 15% HP, Crimson Night and Galeheart get their real critical strikes, Cinderstar, Fallen Emperor and White King\'s flag were counted too high.',
        'Grades are measured against the 3rd-best hero, so one standout can no longer empty the A tier.',
        'Demon Realm\'s Fate of London drops one blast on every locked enemy, so packs take it many times over: AoE up about 20 to 50%.',
        'Venomrose\'s Lumir now also counts its +40% party attack damage, and her always-on party lifesteal now counts on top of the healing cap: Venomrose is S in Utility at every stage.',
        'Near-ties go up: a hero only a few points under the S line, clearly with the top group, is S too.',
        'Party buffs: every attack-speed aura in the party now adds up (they all stack in the map), up to the +400% cap. Before, only the strongest one counted.',
        'AFK farm now counts the damage a hero really deals in a 30-minute AFK stretch, half on a monster pack (area hits included) and half on a field boss: a hero that slowly loses HP only counts until it dies. On the AFK board every card says whether it survives alone.',
      ]],
      ['Calculators', [
        'Roll odds: pick the effect you want too (STR, Crit, Execute...), not just the grade. Every effect is equally likely in the map.',
        'Drop chance asks how many copies you need (e.g. 200 fragments) and gives the kills for all of them, average and unlucky.',
        'Number boxes keep what you type: clearing a box and typing a new number no longer jumbles the digits.',
      ]],
      ['Guides', [
        'Gear routes fit on one screen, grouped by realm: you see the zone you are in (open) and the next three. Finished zones hide, with a Show link in case of a wrong tick, and later zones sit behind Show more.',
      ]],
      ['Whole wiki', [
        'Changelog: older days fold into one line with their categories.',
      ]],
    ]],
    ['24 Sep 2026', [
      ['Heroes', [
        'New Heroes tab: three columns by main stat with compact cards, role tags in colour, a star for supporter heroes, and Free / Supporter / role filters. No more long table.',
        'Hero pages are much shorter: Damage, Utility and Survival scores fold into one line each, and a transformation folds into one card with the same ability rows as the kit.',
      ]],
      ['Tier list', [
        'No more supporter tag on the tier list. Use Free heroes only, or open the hero page.',
        'Armor shred reworked. Bosses have 3,000 to 21,000+ armor that blocks over 99% of every hero\'s damage, so -10% armor is about +11% damage for the whole party. Shredders score it in Utility and in their own Boss and AoE damage.',
        'Utility counts every damage effect by the real party damage it adds: armor shred, attack-speed auras, and damage auras (those only boost basic attacks, so they count less than before).',
        'Different shred auras stack, so the Party setting now adds every other hero\'s shred. Late gear\'s Nirvahel gem (-8% armor) and a Sailing Armor Weakening slot count too.',
        'Utility grades now rank only heroes with a party effect, and armor shred counts on top of the gem and Sailing shred a party already has (about +14% damage per -10% late). Shredders move up to A.',
        'New tier board: heroes in S to D rows for the ranking you pick (Solo, Boss, AoE, AFK, Utility, Survival). The table with every score is one click away.',
      ]],
      ['Whole wiki', [
        'The header now shows the date the wiki was last updated.',
        'The big banner is only on Home. Every other page gets a slim one, so content starts higher.',
      ]],
    ]],
    ['23 Sep 2026', [
      ['Events', [
        'New Events tab: every event the map can run, live or off, read straight from the map. Live events glow on the Home page.',
        'The current Event Zone is on Home in one line, with its drops and what they turn into on the Events tab. It updates with the map.',
        'Tables follow the live events. Boosted values show in gold with the normal value crossed out: recipes, Awakening, Attribute enhancement, Potential, Sailing and the calculators. A new map version that flips an event updates the wiki on its own.',
      ]],
      ['Heroes', [
        'Brand-new hero pages: a summary card with rank chips, then Tier 2, Tier 1 and How it\'s scored tabs. No more endless scrolling.',
        'Every ability now shows its in-game icon in a compact list. Tap one for the full tooltip.',
      ]],
      ['Tier list', [
        'Survival: Strength-based self-heals now count the real share of your HP that Strength gives (gear HP is flat). Fallen Emperor\'s War God Unleashed heals about 17% of max HP, not 20%. Fallen Emperor, Frenzy, Nature and White King score a bit lower and still hold up alone.',
        'Stages rebuilt: Early = end of the Middle Realm, Mid = end of the Upper Realm, Late = best in slot, and the list now opens on Late. Every stage counts the progression systems you can reach by then (attributes, relics, Potential, Sailing, ability slots, Engraving, Awakening, Dimension Link), each hero with its own best damage picks, shown on its page. Early skips Attributes and Sailing, Mid skips Sailing and ability Engraving: their stones and voyages only show up later.',
        'New Buffs box: None, Party (the strongest aura of each kind from another hero) or Party + Supporter (full wing and aura collections). Plus a What each stage assumes table and a clearer How this list is made box.',
        'The Tier 1 view is gone because you reach tier 2 fast. Survival stays the hero\'s own kit, the same in every stage.',
        'AoE now counts the real number of monsters a hit reaches, measured from the map\'s spawns, up to a 1500 radius. Wide skills like Abyss\'s 1000-radius hits finally get proper credit.',
        'Each hero\'s How it\'s scored tab shows every ability\'s radius and how many monsters it hits.',
        'Smarter Utility: party protection counts most, then damage buffs and armor shred, then attack speed, then healing. Nature\'s taunt finally gets its due.',
        'The Tank column is now Survival, a pure measure of how long a hero stays alive. Tank is now the role of the one taunter, Nature, and the other sturdy heroes are Offtanks.',
        'Fresh hand-written notes, survival lines and role lines for all 26 heroes.',
        'Cleaner tags: knockbacks, pulls and stuns no longer count as debuffs, and "Only hero with" chips highlight what makes a hero unique.',
      ]],
      ['Items', [
        'Taegeuk Guardian Aura: a gold warning on every level. A failed upgrade destroys both auras and you start over from a fresh base aura. The skip-a-level chance now reads as a share of successes.',
        'Taegeuk Guardian Aura is now its own Aura type with a plain explanation of how it works. Its upgrade recipes list every material, and Next points to the next level.',
        'Recipes always show enhancement ladders, one compact row each right after the item, so the old toggle is gone. Pet gear reads as two clean ladders, weapon then armor.',
      ]],
      ['Game systems', [
        'Sailing now says where voyages start: the Voyage Content portal in Arcadia.',
        'How steps on every system page cut down to the 1-3 rules you won\'t figure out by playing.',
        'Stat shops: one clean table, every shop by town and zone with the Lumber it takes to cap one stat. No How box.',
        'Attribute enhancement Tips: a Progression Route from an endgame player.',
        'Party dungeons: new Titles table (rank-up chance, Attack Power, bonus hit, ticket keep chance per rank), one Dungeons table with ticket realm, Lumber per run and boss drops, and Engraving tracks show the Contribution to reach level 25.',
        'Awakening: every boss in the table links to its page.',
        'Attribute enhancement: one short Key levels table (floors and Progression Route levels) on top, the full 40-level tables fold open below.',
        'Dimension Link tables reworked: points read left to right, and every perk is split into Points, Perk and Effect.',
        'Small tables fit their content instead of stretching across the page.',
        'Potential: Crit % and Crit Damage % get their own columns, easier to read next to Bonus Damage.',
        'Sailing: the Grades table shows all 9 effects (Execute, Armor, Mana and HP Regen were missing), plus a table of how each one stacks and its cap.',
        'Fewer Tips, real tricks only: Ability slots, Potential, Awakening, Party dungeons and Primordial relics lost the ones that weren\'t. Sailing\'s group-up rule moved into How.',
        'Watch out is now Tips: a short gold card with the clever tricks only, checked in the map. Rules moved into the How steps, table repeats are gone.',
        'Fixed on the way: engraving gives real stats (+50,000 all stats per level), there is no single-slot ability roll, slot 4 is supporter only, +25 is an attribute floor, Dimension Link updates with -link, Party Engraving is saved per character.',
        'Attribute enhancement is much easier to read: every step now shows exactly what a failed try does, and the levels you can never drop below are spelled out.',
        'Ability slots and Potential: the preset reroll trick, checked in the map. Save, reroll everything at base cost, load back if it rolls worse.',
      ]],
      ['Pets', [
        'Pets tab rebuilt from scratch: in-game icons, Hero bonus and While summoned side by side, evolved and full-set values in every row.',
        'Lumipaca got a portrait worthy of its legend.',
      ]],
      ['Calculators', [
        'New Taegeuk aura mode: base auras and Hidden Aura Fragments to reach any level, counting every restart after a fail, with or without Craft Supporter.',
        'Engraving: Lumber earned comes straight from the new Lumber per run column.',
        'Roll odds works again for all three roll systems and counts the real Reroll All price for ability slots. The attribute calculator now treats +25 as a floor.',
        'Relic enhancement works again (it showed broken numbers) and lists every step with its reset chance. Roll odds no longer breaks on Normal or better.',
        'Drop chance: new Pick an item mode lists every monster that drops it, best first. Items with several rolls per kill now count every roll.',
        'Attribute enhancement: a Destruction Protection switch adds the protection Lumber and turns destroys into stay or drop 1.',
        'Potential odds count the cheap way: ALL with nothing locked, 1 Lumber for all free slots. Costs are shown in Lumber, the endgame currency, and every calculator says what it answers.',
      ]],
      ['Whole wiki', [
        'Two full wording passes over every tab: shorter, clearer, written like a player would say it, with nothing left out.',
        'All 1,049 item icons now come straight from the map, fixing a batch of wrong ones.',
        'Tables line up properly, and the Relics, Sailing, Dimension Link and Party dungeon pages got missing details back.',
      ]],
    ]],
    ['22 Sep 2026', [
      ['Tier list', [
        'Rebuilt from the ground up: real gear and bought stats at Early, Mid and Late stages, survival tested against the map\'s own bosses and monster packs.',
        'Solo now needs both survival and damage, Healer means real party healing, and a lifesteal pet option re-ranks every column.',
      ]],
      ['Game systems', [
        'Party dungeons now cover Contribution and Permanent Engraving: every track and the cost of each level.',
      ]],
      ['Calculators', [
        'New calculators: roll odds for Ability, Potential and Sailing slots, Engraving cost in party dungeon clears, and Relic enhancement.',
      ]],
      ['Planner', [
        'New "Where to farm next" page: pick what you wear and get one clear next step per slot, with exactly which monster to farm and about how many kills it takes.',
        'Profiles keep separate gear, main stat and checklist progress for every character you play.',
        'A clear STR / AGI / INT switch sits on top of the planner and the checklists, and hides once set.',
      ]],
      ['Guides', [
        'Complete gear checklists for every slot, from the first piece to the last enhancement, with every material and where it drops.',
      ]],
    ]],
  ];
  /* same layout as the Adventurer's Path wiki (user 2026-09-25): newest day open, older days folded to one line (date · count · categories); categories are small labels, not headings */
  P.changelog = () => `<h2>Changelog</h2>${CHANGES.map(([d, cats], i) => { const nn = cats.reduce((a, c) => a + c[1].length, 0);
    return `<details class="cg-day"${i ? '' : ' open'}><summary><b>${esc(d)}</b><span class="small"> · ${nn} change${nn === 1 ? '' : 's'}</span><span class="small cg-cats">: ${esc(cats.map(c => c[0]).join(', '))}</span></summary>${cats.map(([c, xs]) => `<div class="cg-cat"><span class="tag">${esc(c)}</span><ul>${xs.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</details>`; }).join('')}`;
  P.credits = () => `<h2>Credits</h2><ul><li>CWG RPG - Covenant of Warring Gods 1.1.0 by TheMidLane / Gwelawyr's RPG Ports. Discord: <a href="https://discord.gg/Z5Pf8exufw" target="_blank" rel="noopener">discord.gg/Z5Pf8exufw</a>.</li><li>All numbers come straight from the map's data.</li><li>Early-game route based on Stoner's guide. Hero portraits from the community wiki, item icons from the community 3.81 planner.</li><li>Gear planner based on Gwelawyr's planner.</li><li>Built with Anthropic's Claude. The tier list is math, not in-game testing.</li></ul>`;
  const ZSTATE = {}, ZMORE = {};   /* ZMORE[route] = the user asked to see every upcoming zone */   /* zone folds the user opened or closed by hand (guide route), kept while the page is open */
  K.hooks.push((page, out) => { if (page !== 'guides') return;
    out.querySelectorAll('details.zfold > summary').forEach(s => s.addEventListener('click', () => { const d = s.parentElement; setTimeout(() => { ZSTATE[d.dataset.z] = d.open; }, 0); }));
    out.querySelectorAll('[data-zmore]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); const f = out.querySelector('details.zfold'); const k = f ? f.dataset.z.split('|')[0] : ''; ZMORE[k] = a.dataset.zmore === '1'; K.route(); }));
    out.querySelectorAll('[data-zdone]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); try { localStorage.setItem('cwgGuideHideDone', a.dataset.zdone); } catch (x) { } K.route(); }));
    out.querySelectorAll('[data-zall]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); const o = a.dataset.zall === '1'; out.querySelectorAll('details.zfold').forEach(d => { d.open = o; ZSTATE[d.dataset.z] = o; }); }));
  });
  K.hooks.push((page, out) => { if (page !== 'guides') return; out.querySelectorAll('input[name=stat]').forEach(r => r.addEventListener('change', () => { try { localStorage.setItem('cwgStat', r.value); } catch (e) { } K.route(); })); out.querySelectorAll('input.gstep').forEach(cb => cb.addEventListener('change', () => { let d = {}; try { d = JSON.parse(localStorage.getItem('cwgGuideDone') || '{}') || {}; } catch (e) { } let o = {}; try { o = JSON.parse(localStorage.getItem('cwgOwned') || '{}') || {}; } catch (e) { } const all = [...out.querySelectorAll('input.gstep')]; const targets = cb.checked ? all.slice(0, all.indexOf(cb) + 1) : all.slice(all.indexOf(cb)); for (const c of targets) { c.checked = cb.checked; if (cb.checked) d[c.dataset.k] = 1; else delete d[c.dataset.k]; { const early = out.querySelector('.sub-tabs a.on') && /early-game/.test(out.querySelector('.sub-tabs a.on').getAttribute('href') || ''); for (const id of (c.dataset.res || '').split(',').filter(Boolean)) { if (!early && !K.GEAR_TYPES.has((K.I[id] || {}).type)) continue; if (cb.checked) o[id] = 1; else delete o[id]; } } c.closest('tr').classList.toggle('done', cb.checked); } try { localStorage.setItem('cwgGuideDone', JSON.stringify(d)); localStorage.setItem('cwgOwned', JSON.stringify(o)); } catch (e) { } if (out.querySelector('details.zfold')) K.route(); })); });
  KL.guides = 'Guide'; for (const k of KEYS) KL['systems?sys=' + k] = 'Game system';
  for (const g of (W.guides || [])) INDEX.push({ k: 'guides', id: g.id, t: g.title, s: 'guide · ' + (g.intro || '').slice(0, 80), w: 4 });
  for (const k of KEYS) INDEX.push({ k: 'systems?sys=' + k, id: '', t: NAMES[k] || k, s: String((SY[k] || {}).what || (SY[k] || {}).summary || '').slice(0, 100), w: 3 });
})(window.WK);
