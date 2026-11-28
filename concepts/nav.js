/* Navigation des concepts : chaque bouton ouvre un vrai écran à l'intérieur de l'écran du concept. Les écrans s'empilent ;
   « Retour » revient au précédent, « Sauvegarder et quitter » ramène au début. */
(() => {
  const css = document.createElement('style');
  css.textContent = `
  .view { position: absolute; inset: 0; z-index: 5; animation: vin .35s cubic-bezier(.2,.8,.2,1) both; }
  .view.out { animation: vout .25s ease-in both; }
  @keyframes vin { from { opacity: 0; scale: 1.03; } to { opacity: 1; scale: 1; } }
  @keyframes vout { to { opacity: 0; scale: .98; } }
  .view .shade { position: absolute; inset: 0; background: rgba(3,6,12,.72); backdrop-filter: blur(.4cqw); }
  .dialog { position: absolute; left: 50%; top: 50%; translate: -50% -50%; padding: 2.4cqw 2.8cqw; }
  .row { display: flex; gap: 1cqw; }
  .row > .btn { flex: 1; margin: 0; }
  .list { display: flex; flex-direction: column; gap: .8cqw; }
  .item { position: relative; display: flex; align-items: center; gap: 1.2cqw; padding: .9cqw 1.3cqw; cursor: pointer;
    background: rgba(14,24,34,.75); border: 1px solid rgba(107,228,242,.12); transition: background .2s, border-color .2s; }
  .item:hover { border-color: rgba(107,228,242,.45); }
  .item.sel { background: linear-gradient(180deg, rgba(40,90,110,.7), rgba(12,40,54,.7)); border-color: var(--cyan); }
  .toast { position: absolute; left: 50%; bottom: 3cqw; translate: -50% 0; z-index: 20; padding: .9cqw 2cqw; font-weight: 700; letter-spacing: .12em;
    font-size: 1.15cqw; text-transform: uppercase; background: rgba(8,14,22,.92); border: 1px solid var(--cyan); color: var(--white);
    animation: toast 2.6s ease both; pointer-events: none; }
  @keyframes toast { 0% { opacity: 0; translate: -50% 1cqw; } 12%, 80% { opacity: 1; translate: -50% 0; } 100% { opacity: 0; } }
  .field { width: 100%; height: 3cqw; padding: 0 1cqw; background: rgba(4,8,14,.8); border: 1px solid var(--cyan-dim); color: var(--white);
    font: 700 1.3cqw Rajdhani, sans-serif; letter-spacing: .08em; outline: none; }
  .field:focus { border-color: var(--cyan); box-shadow: 0 0 1cqw rgba(107,228,242,.25); }
  .hudline { position: absolute; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; font-size: 1.15cqw; }
  .esc { position: absolute; left: 50%; top: 3cqw; translate: -50% 0; cursor: pointer; padding: .6cqw 1.6cqw; border: 1px solid rgba(107,228,242,.5);
    background: rgba(6,12,20,.6); color: var(--cyan); letter-spacing: .2em; font-weight: 700; font-size: 1.05cqw; animation: pulse 2s ease-in-out infinite; }
  @keyframes pulse { 50% { box-shadow: 0 0 1.4cqw rgba(107,228,242,.5); } }
  .adv { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1cqw; }
  .adv > div { padding: 1cqw; background: rgba(14,24,34,.75); border: 1px solid rgba(107,228,242,.12); text-align: center; }
  .adv > div.lock { opacity: .35; }
  .adv b { display: block; font-size: 1.05cqw; letter-spacing: .06em; margin-top: .4cqw; }
  .adv span { font-size: .85cqw; color: var(--dim); }
  .scroll { overflow: auto; scrollbar-width: thin; scrollbar-color: var(--cyan-dim) transparent; }
  .screen [data-act], .screen .btn, .screen .item { cursor: pointer; }
  .black { position: absolute; inset: 0; background: #000; display: grid; place-items: center; z-index: 30; animation: vin 1s ease both; }`;
  document.head.appendChild(css);

  // ------------------------------------------------------------------ pile d'écrans
  const stack = s => (s._stack ||= []);
  function open(screen, html, setup) {
    const v = document.createElement('div');
    v.className = 'view'; v.style.zIndex = 5 + stack(screen).length; v.innerHTML = html;
    screen.appendChild(v); stack(screen).push(v);
    wire(v, screen);
    if (setup) setup(v);
    return v;
  }
  function back(screen) {
    const v = stack(screen).pop(); if (!v) return;
    v.classList.add('out'); setTimeout(() => v.remove(), 250);
  }
  function home(screen) { while (stack(screen).length) back(screen); }
  function replace(screen, html, setup) { const v = stack(screen).pop(); if (v) v.remove(); return open(screen, html, setup); }
  function toast(screen, text) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = text; screen.appendChild(t); setTimeout(() => t.remove(), 2700); }
  const photo = screen => (screen.querySelector(':scope > img.photo') || {}).getAttribute?.('src') || '../images/7_vaudaire_flight.jpg';
  const btn = (label, act, cls = '') => `<div class="btn ${cls}" data-act="${act}">${label}</div>`;
  const title = t => `<div class="title">${t}</div><div class="line"></div>`;

  // ------------------------------------------------------------------ les écrans
  const VIEWS = {
    worlds: s => open(s, `<img class="photo blur" src="../images/4_moon_walk.jpg" alt=""><div class="shade" style="background:rgba(3,6,12,.4)"></div>
      <div style="position:absolute;left:8cqw;right:8cqw;top:4cqw">${title('Choisir un monde')}</div>
      <div class="list scroll" data-worldlist style="position:absolute;left:8cqw;right:8cqw;top:10cqw;bottom:9cqw"></div>
      <div class="row" style="position:absolute;left:8cqw;right:8cqw;bottom:3cqw">${btn('Jouer', 'play', 'on')}${btn('Nouveau monde', 'new')}${btn('Modifier', 'edit', 'small')}${btn('Retour', 'back', 'small orange')}</div>`,
      v => fillWorlds(v.querySelector('[data-worldlist]'))),
    servers: s => open(s, `<img class="photo blur" src="../images/9_shipyard.jpg" alt=""><div class="shade" style="background:rgba(3,6,12,.45)"></div>
      <div style="position:absolute;left:8cqw;right:8cqw;top:4cqw">${title('Multijoueur')}</div>
      <div class="list" data-servers style="position:absolute;left:8cqw;right:8cqw;top:10cqw"></div>
      <div class="row" style="position:absolute;left:8cqw;right:8cqw;bottom:3cqw">${btn('Rejoindre', 'join', 'on')}${btn('Connexion directe', 'direct')}${btn('Ajouter', 'add', 'small')}${btn('Retour', 'back', 'small orange')}</div>`,
      v => {
        const box = v.querySelector('[data-servers]');
        [['Station Périhélie', 'Système Sol · 12 / 40 pilotes', 3], ['Ceinture de Kuiper', 'Survie difficile · 4 / 20', 2], ['Les Anciens RP', 'Galaxie Khaos · 31 / 64', 4]].forEach(([n, d, b], i) => {
          const it = document.createElement('div'); it.className = 'item' + (i === 0 ? ' sel' : '');
          it.innerHTML = `<svg viewBox="0 0 20 20" style="width:3.4cqw"><circle cx="10" cy="10" r="8" fill="#0d2a5a" stroke="#6be4f2" stroke-width=".8"/><path d="M4 12Q10 6 16 9" stroke="#62e6a0" fill="none"/></svg>
            <div style="flex:1"><div style="font-weight:700;font-size:1.4cqw">${n}</div><div style="color:var(--soft);font-size:1cqw">${d}</div></div>
            <div style="display:flex;gap:.25cqw;align-items:flex-end;height:1.6cqw">${[1, 2, 3, 4].map(k => `<i style="width:.4cqw;height:${k * .4}cqw;background:${k <= b ? '#62e6a0' : '#4a6272'}"></i>`).join('')}</div>`;
          it.onclick = () => { box.querySelectorAll('.item').forEach(o => o.classList.remove('sel')); it.classList.add('sel'); };
          it.ondblclick = () => act(s, 'join');
          box.appendChild(it);
        });
      }),
    realms: s => open(s, `<div class="shade"></div><div class="panel dialog" style="width:44cqw">${title('Royaumes')}
      <p style="color:var(--soft);font-size:1.2cqw;margin:0 0 1.6cqw">Les Royaumes de Minecraft n'acceptent pas les mods. À la place, ce bouton pourrait ouvrir le <b style="color:var(--cyan)">guide du pilote</b> ou la <b style="color:var(--cyan)">carte des étoiles</b> du mod.</p>
      <div class="row">${btn('Guide du pilote', 'guide', 'on')}${btn('Retour', 'back', 'orange')}</div></div>`),
    guide: s => open(s, `<div class="shade"></div><div class="panel dialog" style="width:56cqw">${title('Guide du pilote')}
      <div class="list" style="margin-bottom:1.4cqw">${['Construire son premier vaisseau', 'Quitter l’atmosphère', 'Naviguer entre les systèmes', 'Survivre aux trous noirs'].map((t, i) =>
        `<div class="item${i === 0 ? ' sel' : ''}"><b style="color:var(--orange);font-size:1.3cqw">0${i + 1}</b><span style="font-size:1.25cqw">${t}</span></div>`).join('')}</div>
      ${btn('Retour', 'back', 'orange')}</div>`, v => v.querySelectorAll('.item').forEach(it => it.onclick = () => { v.querySelectorAll('.item').forEach(o => o.classList.remove('sel')); it.classList.add('sel'); })),
    options: s => open(s, `<img class="photo blur" src="../images/5_alize_disk.jpg" alt="">
      <div class="panel" style="left:10cqw;right:10cqw;top:5cqw;bottom:11cqw;padding:2.4cqw 3cqw">${title('Options')}
        <div data-tabs style="display:flex;gap:.6cqw;margin-bottom:1.6cqw"></div><div data-sliders style="display:grid;grid-template-columns:1fr 1fr;gap:1.2cqw 3cqw"></div></div>
      <div class="row" style="position:absolute;left:10cqw;right:10cqw;bottom:4cqw;justify-content:flex-end">${btn('Par défaut', 'default', 'small')}${btn('Terminé', 'done', 'on')}</div>`,
      v => setupOptions(v)),
    quit: s => open(s, `<div class="shade"></div><div class="panel dialog" style="width:38cqw;text-align:center">${title('Quitter Périhélie ?').replace('class="line"', 'class="line" style="margin-left:auto;margin-right:auto"')}
      <p style="color:var(--soft);font-size:1.25cqw;margin:0 0 1.8cqw">Votre vaisseau restera en orbite en attendant votre retour.</p>
      <div class="row">${btn('Quitter le jeu', 'bye', 'orange')}${btn('Annuler', 'back', 'on')}</div></div>`),
    bye: s => { const b = document.createElement('div'); b.className = 'black';
      b.innerHTML = `<div style="text-align:center"><div class="logo" style="position:static;font-size:4cqw">PÉRIHÉLIE</div><div style="color:var(--soft);margin-top:1.4cqw;font-size:1.4cqw;letter-spacing:.2em">À BIENTÔT, PILOTE</div></div>`;
      s.appendChild(b); setTimeout(() => { b.style.transition = 'opacity .8s'; b.style.opacity = 0; setTimeout(() => { b.remove(); home(s); }, 800); }, 2200); },
    loading: (s, label = 'Chargement du monde', after = 'ingame') => {
      const v = open(s, `<div style="position:absolute;inset:0;background:#02040c"></div><canvas class="fill" data-hyperview></canvas>
        <div class="logo" style="left:50%;top:6cqw;translate:-50% 0;font-size:3cqw">PÉRIHÉLIE</div>
        <div style="position:absolute;left:50%;bottom:7cqw;translate:-50% 0;width:46cqw;text-align:center">
          <div class="title" style="font-size:1.5cqw" data-step>${label}</div>
          <div class="gauge" style="height:.45cqw;margin:1cqw 0"><i data-p style="width:0"></i></div><div class="label" data-pc>0 %</div></div>`);
      const c = v.querySelector('canvas'), start = performance.now(), steps = [label, 'Génération des tronçons', 'Calcul des orbites', 'Allumage des moteurs', 'Sortie d’hyperespace'];
      const d = on(c, (g, w, h, t, st) => {
        hyper(g, w, h, st);
        const p = Math.min(1, (performance.now() - start) / 3200);
        v.querySelector('[data-p]').style.width = p * 100 + '%'; v.querySelector('[data-pc]').textContent = Math.floor(p * 100) + ' %';
        v.querySelector('[data-step]').textContent = steps[Math.min(4, Math.floor(p * 5))];
      }, true);
      setTimeout(() => { if (!v.isConnected) return; v.remove(); const k = stack(s).indexOf(v); if (k >= 0) stack(s).splice(k, 1); VIEWS[after](s); }, 3300);
    },
    ingame: s => open(s, `<img class="photo" src="../images/7_vaudaire_flight.jpg" alt="" style="animation:kb 30s ease-in-out infinite alternate">
      <div class="esc" data-act="pause">ÉCHAP · MENU PAUSE</div>
      <div class="hudline" style="left:2.4cqw;bottom:2.4cqw">Système Sol<div style="font-size:.85cqw;color:var(--soft);letter-spacing:.1em">Atmosphère terrestre</div></div>
      <div class="hudline" style="right:2.4cqw;bottom:2.4cqw;text-align:right">Chasseur Vaudaire<div style="font-size:.85cqw;color:var(--green, #62e6a0);letter-spacing:.1em">Moteurs actifs</div></div>
      <div class="hudline" style="left:50%;bottom:9cqw;translate:-50% 0;font-size:2.4cqw">312 <span style="font-size:.5em;color:var(--dim)">m/s</span></div>`),
    pause: s => open(s, `<img class="photo blur" src="../images/7_vaudaire_flight.jpg" alt="">
      <div class="panel slidein" style="left:0;top:0;bottom:0;width:30cqw;clip-path:none;padding:5cqw 3cqw">${title('Pause')}
        ${btn('Reprendre<span class="k">Échap</span>', 'resume', 'on')}${btn('Progrès', 'progress')}${btn('Statistiques', 'stats')}${btn('Réglages Périhélie', 'options')}${btn('Options', 'options')}
        ${btn('Ouvrir au réseau local', 'lan', 'small')}${btn('Sauvegarder et quitter', 'save', 'small orange')}</div>`),
    progress: s => open(s, `<div class="shade"></div><div class="panel dialog scroll" style="width:70cqw;max-height:48cqw">${title('Progrès')}
      <div class="adv">${[['Premiers pas', 'Monter dans un vaisseau', 1], ['Décollage', 'Quitter l’atmosphère', 1], ['Petit pas', 'Marcher sur la Lune', 1], ['Rouge', 'Atterrir sur Mars', 1],
        ['Premier contact', 'Être scanné par les Anciens', 1], ['Ils ne reviendront pas', 'Vaincre la Sentinelle', 0], ['Spaghettification', 'Passer l’horizon', 0], ['Bâtisseur', 'Finir un chantier naval', 1],
        ['Géants', 'Voir les trois titans', 0], ['Sphère', 'Trouver une sphère de Dyson', 1], ['Comète', 'Miner une comète', 0], ['Au bout', 'Atteindre Eschaton', 0]].map(([n, d, ok]) =>
        `<div class="${ok ? '' : 'lock'}"><svg viewBox="-10 -10 20 20" style="width:2.6cqw"><path d="M0 -8L8 0L0 8L-8 0Z" fill="${ok ? '#ff9f45' : 'none'}" stroke="#ff9f45"/></svg><b>${n}</b><span>${d}</span></div>`).join('')}</div>
      <div style="margin-top:1.6cqw">${btn('Retour', 'back', 'orange')}</div></div>`),
    stats: s => open(s, `<div class="shade"></div><div class="panel dialog" style="width:50cqw">${title('Statistiques')}
      ${[['Distance parcourue', '48 216 km'], ['Systèmes visités', '23 / 1 650'], ['Galaxies traversées', '3 / 13'], ['Sauts hyperespace', '61'], ['Pirates abattus', '128'], ['Trous noirs frôlés', '7'], ['Temps de jeu', '14 h 32']]
        .map(([a, b]) => `<div style="display:flex;justify-content:space-between;padding:.55cqw 0;border-bottom:1px solid rgba(107,228,242,.1)"><span class="label">${a}</span><b style="font-size:1.25cqw">${b}</b></div>`).join('')}
      <div style="margin-top:1.6cqw">${btn('Retour', 'back', 'orange')}</div></div>`),
    lan: s => open(s, `<div class="shade"></div><div class="panel dialog" style="width:44cqw">${title('Réseau local')}
      <div class="label">Mode de jeu des autres pilotes</div><div class="row" data-choice style="margin:.6cqw 0 1.4cqw">${btn('Survie', 'pick', 'small on')}${btn('Créatif', 'pick', 'small')}${btn('Aventure', 'pick', 'small')}</div>
      <div class="row">${btn('Ouvrir la partie', 'lanok', 'on')}${btn('Annuler', 'back', 'orange')}</div></div>`),
    save: s => { const v = open(s, `<div style="position:absolute;inset:0;background:#02040c"></div><div style="position:absolute;left:50%;top:50%;translate:-50% -50%;text-align:center;width:40cqw">
        <div class="title" style="font-size:1.6cqw">Sauvegarde du monde</div><div class="gauge" style="margin:1.2cqw 0"><i data-p style="width:0;transition:width 1.8s linear"></i></div>
        <div class="label">Le vaisseau est amarré · retour à l'écran titre</div></div>`);
      requestAnimationFrame(() => requestAnimationFrame(() => v.querySelector('[data-p]').style.width = '100%')); setTimeout(() => home(s), 2100); },
    newworld: s => open(s, `<div class="shade"></div><div class="panel dialog" style="width:50cqw">${title('Nouveau monde')}
      <div class="label">Nom du monde</div><input class="field" value="Nouvelle Frontière" style="margin:.6cqw 0 1.4cqw">
      <div class="label">Mode de jeu</div><div class="row" data-choice style="margin:.6cqw 0 1.4cqw">${btn('Survie', 'pick', 'small on')}${btn('Créatif', 'pick', 'small')}${btn('Extrême', 'pick', 'small orange')}</div>
      <div class="label">Départ</div><div class="row" data-choice style="margin:.6cqw 0 1.6cqw">${btn('Sur Terre', 'pick', 'small on')}${btn('En orbite', 'pick', 'small')}</div>
      <div class="row">${btn('Créer le monde', 'create', 'on')}${btn('Annuler', 'back', 'orange')}</div></div>`),
    edit: s => open(s, `<div class="shade"></div><div class="panel dialog" style="width:44cqw">${title('Modifier le monde')}
      <div class="label">Nom</div><input class="field" value="Nouvelle Frontière" style="margin:.6cqw 0 1.4cqw">
      <div class="row" style="margin-bottom:1cqw">${btn('Sauvegarde', 'backupok', 'small')}${btn('Dossier', 'folder', 'small')}</div>
      <div class="row">${btn('Enregistrer', 'savedname', 'on')}${btn('Annuler', 'back', 'orange')}</div></div>`),
  };

  function fillWorlds(box) {
    [['Nouvelle Frontière', 'Système Sol · Orbite lunaire', 'Capsule Alizé · 14 h 32', 'earth'], ['Expédition Khaos', 'Galaxie Khaos · trou noir', 'Terminator · 42 h 10', 'mars'],
     ['Colonie Titan', 'Titan · les trois titans', 'Vaudaire · 8 h 05', 'mars'], ['Créatif', 'Système Sol · Terre', 'Chantier naval · 3 h 40', 'earth']].forEach(([n, a, b, p], i) => {
      const it = document.createElement('div'); it.className = 'item' + (i === 0 ? ' sel' : '');
      it.innerHTML = `<canvas style="width:5cqw;height:5cqw"></canvas><div><div style="font-weight:700;font-size:1.4cqw;letter-spacing:.06em">${n}</div>
        <div style="color:var(--soft);font-size:1cqw">${a}</div><div class="label">${b}</div></div>`;
      const c = it.querySelector('canvas'); on(c, (g, w, h, t) => { g.clearRect(0, 0, w, h); sphere(g, w / 2, h / 2, w * .38, t * 2 + i * 7, p, [-.6, -.3, .75], false); }, true);
      it.onclick = () => { box.querySelectorAll('.item').forEach(o => o.classList.remove('sel')); it.classList.add('sel'); };
      it.ondblclick = () => act(box.closest('.screen'), 'play');
      box.appendChild(it);
    });
  }

  const TABS = { 'Général': [['Champ de vision', .55, 's'], ['Luminosité', .5, 's'], ['Langue : français', 1, 't'], ['Sous-titres', 0, 't']],
    'Vidéo': [['Distance d’affichage', .7, 's'], ['Fréquence d’images', .8, 's'], ['Nuages', 1, 't'], ['Synchronisation verticale', 0, 't']],
    'Sons': [['Volume général', .9, 's'], ['Musique du mod', .6, 's'], ['Moteurs', .8, 's'], ['Armes', .7, 's']],
    'Commandes': [['Sensibilité de la souris', .5, 's'], ['Sensibilité du vaisseau', .65, 's'], ['Inverser le tangage', 0, 't'], ['Roulis à la souris', 1, 't']],
    'Périhélie': [['Opacité du HUD', .8, 's'], ['Taille du HUD', .5, 's'], ['Éclairs à l’écran', .35, 's'], ['Distance des astres', .9, 's'], ['Sons des armes', 1, 't'], ['Guide du pilote', 1, 't']],
    'Accessibilité': [['Taille du texte', .5, 's'], ['Contraste élevé', 0, 't'], ['Réduire les secousses', 1, 't'], ['Éclairs désactivés', 0, 't']] };
  function setupOptions(root) {
    const tabs = root.querySelector('[data-tabs]'), box = root.querySelector('[data-sliders]');
    if (!tabs || !box) return;
    const show = name => {
      box.innerHTML = '';
      TABS[name].forEach(([n, v, k]) => {
        const d = document.createElement('div');
        if (k === 's') {
          d.innerHTML = `<div style="display:flex;justify-content:space-between" class="label"><span>${n}</span><span style="color:var(--white)" data-v>${Math.round(v * 100)} %</span></div>
            <div class="gauge" style="height:.7cqw;cursor:pointer" data-base="${v}"><i style="width:${v * 100}%"></i></div>`;
          const gg = d.querySelector('.gauge'), set = e => { const r = gg.getBoundingClientRect(), x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
            gg.firstElementChild.style.width = x * 100 + '%'; d.querySelector('[data-v]').textContent = Math.round(x * 100) + ' %'; };
          gg.onmousedown = e => { set(e); const mv = ev => set(ev), up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); }; addEventListener('mousemove', mv); addEventListener('mouseup', up); };
        } else {
          d.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><span class="label">${n}</span>
            <span data-t="${v}" data-base="${v}" style="width:3.6cqw;height:1.6cqw;border:1px solid var(--cyan-dim);position:relative;cursor:pointer"><span style="position:absolute;top:.2cqw;width:1.1cqw;height:1.1cqw;transition:left .25s"></span></span></div>`;
          const sw = d.querySelector('[data-t]'), paint = () => { const on = sw.dataset.t === '1'; sw.style.background = on ? 'rgba(107,228,242,.25)' : 'transparent';
            sw.firstElementChild.style.left = on ? '2.1cqw' : '.2cqw'; sw.firstElementChild.style.background = on ? 'var(--cyan)' : 'var(--faint)'; };
          paint(); sw.onclick = () => { sw.dataset.t = sw.dataset.t === '1' ? '0' : '1'; paint(); };
        }
        box.appendChild(d);
      });
    };
    tabs.innerHTML = '';
    Object.keys(TABS).forEach((n, i) => {
      const t = document.createElement('div'); t.className = 'btn small' + (n === 'Périhélie' ? ' on' : ''); t.style.margin = 0; t.style.fontSize = '1cqw'; t.textContent = n;
      t.onclick = () => { tabs.querySelectorAll('.btn').forEach(o => o.classList.remove('on')); t.classList.add('on'); show(n); };
      tabs.appendChild(t);
    });
    show('Périhélie');
    root._resetOptions = () => { const cur = tabs.querySelector('.btn.on'); show(cur ? cur.textContent : 'Périhélie'); };
  }

  function hyper(g, w, h, st) {
    if (!st.s) { const r = rng(9); st.s = Array.from({ length: 500 }, () => ({ a: r() * TAU, z: r(), c: r() })); }
    g.fillStyle = 'rgba(2,4,12,.55)'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h * .45;
    for (const s of st.s) {
      s.z -= .016; if (s.z <= .02) s.z += 1;
      const r1 = w * .03 / s.z, r2 = w * .03 / (s.z + .05);
      g.strokeStyle = s.c > .7 ? `rgba(160,140,255,${1 - s.z})` : `rgba(150,220,255,${1 - s.z})`; g.lineWidth = (1 - s.z) * w / 500;
      g.beginPath(); g.moveTo(cx + Math.cos(s.a) * r1, cy + Math.sin(s.a) * r1); g.lineTo(cx + Math.cos(s.a) * r2, cy + Math.sin(s.a) * r2); g.stroke();
    }
  }

  // ------------------------------------------------------------------ les actions
  function act(screen, a, el) {
    switch (a) {
      case 'solo': return VIEWS.worlds(screen);
      case 'multi': return VIEWS.servers(screen);
      case 'realms': return VIEWS.realms(screen);
      case 'guide': return VIEWS.guide(screen);
      case 'options': return VIEWS.options(screen);
      case 'quit': return VIEWS.quit(screen);
      case 'bye': back(screen); return VIEWS.bye(screen);
      case 'back': return stack(screen).length ? back(screen) : toast(screen, 'Retour à l’écran précédent');
      case 'play': return VIEWS.loading(screen, 'Chargement du monde');
      case 'join': return VIEWS.loading(screen, 'Connexion au serveur');
      case 'direct': return toast(screen, 'Adresse du serveur : à saisir');
      case 'add': return toast(screen, 'Serveur ajouté à la liste');
      case 'new': return VIEWS.newworld(screen);
      case 'create': back(screen); return VIEWS.loading(screen, 'Création du monde');
      case 'edit': return VIEWS.edit(screen);
      case 'savedname': back(screen); return toast(screen, 'Monde renommé');
      case 'backupok': return toast(screen, 'Sauvegarde créée');
      case 'folder': return toast(screen, 'Ouverture du dossier du monde');
      case 'pause': return VIEWS.pause(screen);
      case 'resume': return stack(screen).length ? back(screen) : VIEWS.ingame(screen);
      case 'progress': return VIEWS.progress(screen);
      case 'stats': return VIEWS.stats(screen);
      case 'lan': return VIEWS.lan(screen);
      case 'lanok': back(screen); return toast(screen, 'Partie ouverte sur le port 51 234');
      case 'save': return VIEWS.save(screen);
      case 'respawn': return VIEWS.loading(screen, 'Réapparition');
      case 'title': return toast(screen, 'Retour à l’écran titre');
      case 'default': { const r = el.closest('.view') || screen; r._resetOptions ? r._resetOptions() : null; return toast(screen, 'Réglages par défaut'); }
      case 'done': return stack(screen).length ? (back(screen), toast(screen, 'Réglages enregistrés')) : toast(screen, 'Réglages enregistrés');
      case 'pick': { const row = el.parentElement; row.querySelectorAll('.btn').forEach(o => o.classList.remove('on')); el.classList.add('on'); return; }
    }
  }

  // le texte d'un bouton, sans sa touche ni son icône, donne son action
  const BY_LABEL = { 'solo': 'solo', 'multijoueur': 'multi', 'royaumes': 'realms', 'options': 'options', 'quitter': 'quit', 'reprendre': 'resume', 'progrès': 'progress',
    'statistiques': 'stats', 'réglages périhélie': 'options', 'ouvrir au réseau local': 'lan', 'réseau local': 'lan', 'sauvegarder et quitter': 'save', 'sauver et quitter': 'save',
    'jouer': 'play', 'nouveau monde': 'new', 'modifier': 'edit', 'retour': 'back', 'réapparaître': 'respawn', 'écran titre': 'title', 'par défaut': 'default', 'terminé': 'done' };
  function label(el) { const c = el.cloneNode(true); c.querySelectorAll('.k,.sheen,svg').forEach(x => x.remove()); return c.textContent.trim().toLowerCase(); }
  function wire(root, screen) {
    root.querySelectorAll('.btn, [data-marker], [data-act]').forEach(b => {
      if (b._wired || b.closest('[data-tabs]')) return; b._wired = true;
      if (!b.dataset.act) { const a = BY_LABEL[b.dataset.marker || label(b)]; if (a) b.dataset.act = a; }
      if (b.dataset.act) b.addEventListener('click', e => { e.stopPropagation(); act(screen || b.closest('.screen'), b.dataset.act, b); });
    });
  }

  // les écrans de base : leurs boutons, les repères de la carte, les cartes de monde et les options
  function init() {
    document.querySelectorAll('.screen').forEach(s => {
      s.querySelectorAll('[data-markers] > div').forEach(m => { m.dataset.marker = m.querySelector('div').textContent.trim().toLowerCase(); });
      wire(s, s);
      s.querySelectorAll('[data-worlds] > .panel').forEach(p => p.addEventListener('click', () => {
        s.querySelectorAll('[data-worlds] > .panel').forEach(o => { o.classList.remove('on'); o.style.background = ''; });
        p.classList.add('on'); p.style.background = 'linear-gradient(180deg, rgba(40,90,110,.7), rgba(12,40,54,.7))'; }));
      if (s.querySelector(':scope > .panel [data-tabs]')) setupOptions(s.querySelector(':scope > .panel').parentElement);
    });
  }
  init();
})();
