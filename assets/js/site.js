/* Página do YPOS: tema, menu, o telemóvel do topo e a escolha de plano. */
(function (Y) {
  'use strict';

  /* ---------- Tema ---------- */

  const themeBtn = document.querySelector('.theme-btn');

  function syncTheme() {
    const dark = Y.isDark();
    themeBtn.innerHTML = Y.icon(dark ? 'white-balance-sunny' : 'weather-night');
    themeBtn.setAttribute('aria-label', dark ? 'Mudar para modo claro' : 'Mudar para modo escuro');
  }

  themeBtn.addEventListener('click', () => {
    const dark = !Y.isDark();
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    Y.store.set('theme', dark ? 'dark' : 'light');
    syncTheme();
    Y.emit('theme', dark);
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    syncTheme();
    Y.emit('theme');
  });
  syncTheme();

  /* ---------- Menu (ecrãs estreitos) ---------- */

  const menuBtn = document.querySelector('.menu-btn');
  const nav = document.getElementById('nav');

  function setMenu(open) {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menuBtn.innerHTML = Y.icon(open ? 'close' : 'menu');
  }

  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.addEventListener('click', e => {
    if (e.target.closest('a')) setMenu(false);
  });

  /* ---------- Telemóvel do topo ---------- */

  const phone = document.querySelector('.hero-phone .phone');
  const screenEl = phone.querySelector('.ph-screen');
  const stage = phone.querySelector('.ph-stage');
  const tabs = [...document.querySelectorAll('.screen-tabs [data-screen]')];

  screenEl.insertAdjacentHTML('beforeend', Y.app.tabbar());
  const tabbar = screenEl.querySelector('.a-tabbar');

  const STATES = {
    pos: {cart: {1: 1, 2: 2, 5: 6}},
    painel: {per: 'Hoje'},
    faturas: {},
  };
  const ORDER = tabs.map(t => t.dataset.screen);
  let current = ORDER[0];

  function setTab(tab) {
    const idx = Y.app.TABS.findIndex(t => t[0] === tab);
    const [, icon, label] = Y.app.TABS[idx];
    tabbar.style.setProperty('--i', idx);
    tabbar.querySelectorAll('.a-tab').forEach((t, n) => t.classList.toggle('active', n === idx));
    tabbar.querySelector('.a-fabcircle').innerHTML = Y.icon(icon);
    tabbar.querySelector('.a-fablabel').textContent = label;
  }

  function show(name, animate) {
    const def = Y.app.screens[name];
    const dark = Y.isDark();
    const state = Object.assign({dark}, STATES[name]);
    phone.classList.toggle('app-dark', dark);
    phone.classList.toggle('app-light', !dark);

    const scr = document.createElement('div');
    scr.className = 'scr' + (animate && !Y.reducedMotion ? ' enter' : '');
    scr.innerHTML = def.render(state);
    // Ao abrir ou trocar de tema, o ecrã aparece já pronto, sem animações.
    if (!animate) scr.querySelectorAll('[data-k]').forEach(n => n.classList.add('held'));
    stage.replaceChildren(scr);
    setTab(def.tab);

    current = name;
    tabs.forEach(t => t.setAttribute('aria-selected', String(t.dataset.screen === name)));
  }

  // Roda sozinho entre os ecrãs até a pessoa escolher um.
  let timer = null;
  const stop = () => clearInterval(timer);

  tabs.forEach(t =>
    t.addEventListener('click', () => {
      stop();
      if (t.dataset.screen !== current) show(t.dataset.screen, true);
    }),
  );

  Y.on('theme', () => show(current, false));
  show(current, false);

  if (!Y.reducedMotion) {
    timer = setInterval(() => {
      if (document.hidden) return;
      show(ORDER[(ORDER.indexOf(current) + 1) % ORDER.length], true);
    }, 4500);
  }

  /* ---------- Escolha de plano ---------- */

  const cta = document.getElementById('contacto');
  const chosen = document.querySelector('.chosen');
  const baseHref = cta.href.split('?')[0];

  document.querySelectorAll('[data-plan]').forEach(btn =>
    btn.addEventListener('click', () => {
      const plan = btn.dataset.plan;
      chosen.textContent = `Plano escolhido: ${plan}.`;
      cta.href = `${baseHref}?text=${encodeURIComponent(`Olá, quero uma licença do YPOS no plano ${plan}.`)}`;
    }),
  );

  document.querySelector('.year').textContent = new Date().getFullYear();
})(window.YPOS);
