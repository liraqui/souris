/* Progression des exercices : objectifs de score, déblocage de l'exercice suivant, mots de passe de secours.
   Partagé par la page d'accueil et par les 5 exercices (même origine, même localStorage). */
(function () {
  'use strict';
  var KEY = 'techno5e-progression-v1';

  /* goal : score à atteindre pour débloquer la suite (null = exercice guidé, à terminer).
     pw   : empreinte du mot de passe qui ouvre CET exercice sans avoir réussi le précédent.
           Règle : le numéro de l'exercice en espagnol, écrit à l'envers (dos -> SOD, tres -> SERT, cuatro -> ORTAUC, cinco -> OCNIC, seis -> SIES). */
  var EXOS = [
    { n: 1, file: 'ex1.html', title: 'Ballons Éclair', goal: 350, stars: [350, 450, 550], pw: null,
      desc: "Jeu de réflexes de 30 secondes : éclate les ballons avant qu'ils rétrécissent et disparaissent." },
    { n: 2, file: 'ex2.html', title: 'Trio de Clics', goal: 280, stars: [280, 350, 420], pw: '3o4hzrh7sw',
      desc: "Jeu de 45 secondes pour s'entraîner au clic gauche, au clic droit et au double-clic, avec score et combo." },
    { n: 3, file: 'ex3.html', title: 'La souris au travail', goal: null, pw: 'vru3bu7x8g',
      desc: 'Exercice guidé dans un faux ordinateur : ouvrir un fichier, copier, coller et supprimer avec les trois clics.' },
    { n: 4, file: 'ex4.html', title: 'Tri Express', goal: 200, stars: [200, 250, 300], pw: 'q3yojrvo7z',
      desc: "Jeu de 45 secondes pour s'entraîner au glisser-déposer : trie les déchets dans les bons bacs avant qu'ils soient perdus." },
    { n: 5, file: 'ex5.html', title: 'Le glisser-déposer au travail', goal: null, pw: '1azifatkk0e',
      desc: 'Exercice guidé dans un faux ordinateur : ranger un fichier, entourer plusieurs fichiers, joindre un document à un message, réordonner une liste.' },
    { n: 6, file: 'ex6.html', title: 'Défi Final', goal: null, challenge: true, stars: [500, 800, 1200], pw: 'n6ewn238ez',
      desc: 'Le grand défi de 60 secondes : ballons, clics et glisser-déposer en même temps, avec combos et bonus Trio. Qui fera le meilleur score ?' }
  ];

  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, ''); }
  function hash(str) {
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }

  /* Stockage : si le navigateur le refuse, on ouvre tout plutôt que de bloquer la classe. */
  var broken = false, mem = { done: {}, pw: {}, best: {} };
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      var s = raw ? JSON.parse(raw) : {};
      s.done = s.done || {}; s.pw = s.pw || {}; s.best = s.best || {};
      return s;
    } catch (e) { broken = true; return mem; }
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { broken = true; mem = s; } }
  function exo(n) { return EXOS[n - 1]; }
  /* Étoiles : 0 à 3 selon les seuils de l'exercice (la 1re étoile = l'objectif pour passer). */
  function starsFor(n, score) {
    var e = exo(n); if (!e || !e.stars) return 0;
    var k = 0; for (var i = 0; i < 3; i++) if ((score || 0) >= e.stars[i]) k = i + 1;
    return k;
  }
  function starsHTML(k, big) {
    var h = '<span class="pg-stars' + (big ? ' big' : '') + '" role="img" aria-label="' + k + ' étoile' + (k > 1 ? 's' : '') + ' sur 3">';
    for (var i = 0; i < 3; i++) h += '<span class="' + (i < k ? 'on' : 'off') + '" aria-hidden="true">' + (i < k ? '★' : '☆') + '</span>';
    return h + '</span>';
  }
  function nextStarText(n, score) {
    var e = exo(n), k = starsFor(n, score);
    if (!e.stars) return '';
    if (k >= 3) return 'Trois étoiles : score parfait !';
    return 'Encore ' + (e.stars[k] - score) + ' points pour ' + (k + 1) + ' étoile' + (k + 1 > 1 ? 's' : '') + '.';
  }

  function unlocked(n) {
    var s = load();
    return n <= 1 || broken || !!s.done[n - 1] || !!s.pw[n];
  }
  function info(n) {
    var s = load(), e = exo(n);
    return { n: n, file: e.file, title: e.title, desc: e.desc, goal: e.goal, challenge: !!e.challenge, unlocked: unlocked(n), done: !!s.done[n], best: s.best[n] || 0, stars: starsFor(n, s.best[n] || 0), thresholds: e.stars || null };
  }
  function all() { return EXOS.map(function (e) { return info(e.n); }); }
  function isBroken() { load(); return broken; }

  function tryPassword(n, text) {
    var e = exo(n);
    if (!e || !e.pw) return false;
    if (hash(norm(text)) !== e.pw) return false;
    var s = load(); s.pw[n] = true; save(s);
    return true;
  }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} mem = { done: {}, pw: {}, best: {} }; }

  function goalText(n) {
    var e = exo(n), last = n === EXOS.length;
    if (e.challenge) return 'Défi final : pas d’objectif minimal. Étoiles : ★ ' + e.stars[0] + ' · ★★ ' + e.stars[1] + ' · ★★★ ' + e.stars[2] + ' points.';
    if (e.goal) return 'Objectif : ' + e.goal + ' points (1 étoile) pour débloquer la suite. ★★ ' + e.stars[1] + ' · ★★★ ' + e.stars[2] + ' points.';
    return last ? 'Termine toutes les étapes pour finir les exercices.' : 'Termine toutes les étapes pour débloquer l’exercice suivant.';
  }

  /* ---------- Styles (neutres, lisibles sur tous les fonds) ---------- */
  function injectCss() {
    if (document.getElementById('pg-css')) return;
    var st = document.createElement('style');
    st.id = 'pg-css';
    st.textContent =
      '.pg-goal{margin:0;padding:8px 12px;border:2px dashed currentColor;border-radius:10px;align-self:flex-start;font-size:14px;font-weight:800;line-height:1.35}' +
      '.pg-result{display:flex;flex-direction:column;gap:10px;padding:12px 14px;border:2px solid currentColor;border-radius:14px;text-align:left}' +
      '.pg-result p{margin:0;font-size:15px;font-weight:800;line-height:1.4}' +
      '.pg-result .pg-sub{font-weight:600;font-size:13.5px;opacity:.85}' +
      '.pg-row{display:flex;flex-wrap:wrap;align-items:center;gap:14px}' +
      '.pg-btn{display:inline-flex;align-items:center;min-height:46px;padding:0 20px;border:3px solid #14213d;border-radius:14px;background:#ffd23f;color:#14213d;font-weight:900;font-size:16px;text-decoration:none;box-shadow:0 4px 0 #14213d}' +
      '.pg-link{color:inherit;font-weight:800;font-size:14px;text-decoration:underline;text-underline-offset:3px}' +
      '.pg-gate{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:16px;background:rgba(13,21,35,.94);overflow:auto}' +
      '.pg-box{width:min(100%,420px);display:flex;flex-direction:column;gap:12px;padding:22px;background:#fff;color:#14213d;border:3px solid #14213d;border-radius:18px;box-shadow:0 6px 0 #14213d;text-align:left}' +
      '.pg-box h2{margin:0;font-size:28px;line-height:1.1}' +
      '.pg-box p{margin:0;font-size:15px;font-weight:600;line-height:1.45}' +
      '.pg-box form{display:flex;flex-wrap:wrap;gap:8px}' +
      '.pg-box input{flex:1;min-width:140px;min-height:46px;padding:0 12px;border:3px solid #14213d;border-radius:12px;font:inherit;font-size:18px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#14213d;background:#fff}' +
      '.pg-box input:focus-visible,.pg-btn:focus-visible,.pg-link:focus-visible{outline:3px solid #3d7bff;outline-offset:3px}' +
      '.pg-box .pg-btn{cursor:pointer;font-family:inherit}' +
      '.pg-err{color:#b3123f;font-weight:800}' +
      '.pg-lock{width:44px;height:44px}' +
      '.pg-goal.pg-goal{display:flex;flex-direction:column;gap:8px;border-style:solid}.pg-gt{font-size:15px;font-weight:900}.pg-chips{display:flex;flex-wrap:wrap;gap:6px}.pg-chip{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border:2px solid currentColor;border-radius:999px;font-size:13px;font-weight:700}.pg-chip .pg-stars{font-size:15px}.pg-best{font-size:13px;font-weight:700;display:flex;align-items:center;gap:6px;flex-wrap:wrap}.pg-best .pg-stars{font-size:16px}' +
      '.pg-stars{display:inline-flex;gap:2px;font-size:22px;line-height:1;letter-spacing:0}.pg-stars.big{font-size:44px;gap:6px}.pg-stars .on{color:#ffb000;text-shadow:0 0 0 #14213d;-webkit-text-stroke:1px #14213d}.pg-stars .off{color:#8a97ad}';
    document.head.appendChild(st);
  }

  var LOCK = '<svg class="pg-lock" viewBox="0 0 44 44" aria-hidden="true"><rect x="8" y="19" width="28" height="21" rx="5" fill="#ffd23f" stroke="#14213d" stroke-width="3"/><path d="M14 19v-5a8 8 0 0 1 16 0v5" fill="none" stroke="#14213d" stroke-width="3.5" stroke-linecap="round"/><circle cx="22" cy="29" r="3" fill="#14213d"/></svg>';

  /* ---------- Fin d'un exercice : enregistre le résultat et affiche la suite ---------- */
  function finish(n, score, el) {
    try {
      var e = exo(n), s = load(), wasDone = !!s.done[n], passed;
      if (e.goal) {
        passed = score >= e.goal;
        if (score > (s.best[n] || 0)) s.best[n] = score;
      } else {
        passed = true;
        if (e.challenge && score != null && score > (s.best[n] || 0)) s.best[n] = score;
      }
      if (passed) s.done[n] = true;
      save(s);
      if (el) mount(el, n, score, passed, wasDone);
      return { passed: passed, done: passed || wasDone };
    } catch (err) { return { passed: true, done: true }; }
  }
  function mount(el, n, score, passed, wasDone) {
    injectCss();
    var e = exo(n), next = exo(n + 1), ok = passed || wasDone, html = '';
    if (e.stars) html += '<div>' + starsHTML(starsFor(n, score), true) + '</div>' + (passed ? '<p>' + nextStarText(n, score) + '</p>' : '');
    if (e.goal) {
      if (passed) html += '<p>Bien joué ! Tu as gagné au moins 1 étoile : l’exercice suivant est débloqué.</p>';
      else if (wasDone) html += '<p>L’exercice suivant reste débloqué : tu avais déjà gagné ta 1re étoile.</p>';
      else html += '<p>Il te manque ' + (e.goal - score) + ' points pour ta 1re étoile et débloquer la suite : rejoue !</p>';
    } else {
      html += '<p>' + (next ? 'Exercice terminé ! L’exercice suivant est débloqué.' : 'Bravo, tu as terminé tous les exercices !') + '</p>';
    }
    html += '<div class="pg-row">' +
      (ok && next ? '<a class="pg-btn" href="' + next.file + '">Exercice suivant →</a>' : '') +
      '<a class="pg-link" href="index.html">Liste des exercices</a></div>';
    el.innerHTML = '<div class="pg-result" role="status">' + html + '</div>';
  }

  /* ---------- Barrière sur la page d'un exercice verrouillé ---------- */
  function guard(n) {
    if (unlocked(n)) return;
    injectCss();
    var prev = exo(n - 1);
    var g = document.createElement('div');
    g.className = 'pg-gate';
    g.innerHTML = '<div class="pg-box" role="dialog" aria-modal="true" aria-labelledby="pgT">' + LOCK +
      '<h2 id="pgT">Exercice verrouillé</h2>' +
      '<p>Pour ouvrir cet exercice, ' + (prev.goal ? 'gagne d’abord au moins 1 étoile (' + prev.goal + ' points) à « ' + prev.title + ' ».' : 'termine d’abord « ' + prev.title + ' ».') + '</p>' +
      '<p>Tu as un mot de passe de ton professeur ? Écris-le ici.</p>' +
      '<form id="pgForm"><input id="pgPw" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Mot de passe"><button class="pg-btn" type="submit">Débloquer</button></form>' +
      '<p class="pg-err" id="pgErr" hidden>Mot de passe incorrect. Vérifie les lettres.</p>' +
      '<a class="pg-link" href="index.html">← Liste des exercices</a></div>';
    document.body.appendChild(g);
    var input = g.querySelector('#pgPw');
    g.querySelector('#pgForm').addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (tryPassword(n, input.value)) g.remove();
      else { g.querySelector('#pgErr').hidden = false; input.select(); }
    });
    setTimeout(function () { try { input.focus(); } catch (e) {} }, 50);
  }

  window.Progress = {
    EXOS: EXOS, all: all, info: info, unlocked: unlocked, tryPassword: tryPassword, reset: reset,
    finish: finish, starsFor: starsFor, starsHTML: starsHTML, nextStarText: nextStarText, guard: guard, goalText: goalText, isBroken: isBroken, injectCss: injectCss,
    /* Remplit un élément « Objectif » dans l'écran d'accueil d'un exercice. */
    showGoal: function (n, el) {
      if (!el) return; injectCss();
      var e = exo(n), b = load().best[n] || 0;
      el.className = 'pg-goal';
      if (!e.stars) { el.textContent = goalText(n); return; }
      var h = '<span class="pg-gt">' + (e.challenge ? 'Décroche tes étoiles !' : 'Gagne des étoiles ! La 1re ouvre l’exercice suivant.') + '</span><span class="pg-chips">';
      for (var i = 0; i < 3; i++) h += '<span class="pg-chip">' + starsHTML(i + 1, false).replace('role="img"', 'role="presentation"').replace(/<span class="off"[^>]*>☆<\/span>/g, '') + ' <b>' + e.stars[i] + '</b> pts</span>';
      h += '</span>';
      if (b) h += '<span class="pg-best">Ton record : ' + starsHTML(starsFor(n, b), false) + ' <b>' + b + '</b> pts</span>';
      el.innerHTML = h;
    }
  };
})();
