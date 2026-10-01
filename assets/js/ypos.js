/* Núcleo partilhado por todos os componentes.
   Scripts clássicos (não módulos) para o site abrir também com duplo clique
   no index.html, sem servidor. */
window.YPOS = window.YPOS || {};

(function (Y) {
  'use strict';

  const ENTITIES = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};

  Y.esc = s => String(s).replace(/[&<>"']/g, c => ENTITIES[c]);

  /** Texto simples a partir de um trecho de HTML do conteúdo. */
  Y.strip = html => String(html).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

  /** Minúsculas e sem acentos, para pesquisar "fatura" e encontrar "Fatura". */
  Y.norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  Y.icon = (name, cls = '') => `<span class="mdi mdi-${name}${cls ? ' ' + cls : ''}" aria-hidden="true"></span>`;

  Y.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Tema efetivo: o escolhido no botão ou, sem escolha, o do sistema. */
  Y.isDark = () => {
    const t = document.documentElement.dataset.theme;
    return t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  // O armazenamento pode falhar (janela privada, dados bloqueados): nunca é essencial.
  Y.store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem('ypos-site:' + key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem('ypos-site:' + key, JSON.stringify(value));
      } catch (e) {
        /* sem armazenamento: segue sem lembrar */
      }
    },
  };

  const bus = new EventTarget();
  Y.emit = (name, detail) => bus.dispatchEvent(new CustomEvent(name, {detail}));
  Y.on = (name, fn) => bus.addEventListener(name, e => fn(e.detail));

  Y.chapterById = id => (Y.chapters || []).find(c => c.id === id);

  /** Minutos de leitura aproximados de um capítulo. */
  Y.readingMinutes = chapter => {
    const text = JSON.stringify(chapter).replace(/<[^>]+>/g, ' ');
    return Math.max(1, Math.round(text.split(/\s+/).length / 220));
  };
})(window.YPOS);
