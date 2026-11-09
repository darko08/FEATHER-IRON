/* Feather & Iron: UI icons (stroke, currentColor) */
(function (global) {
  'use strict';
  const ICON = {
    zrno: '<path d="M12 21V8"/><path d="M12 8c-2.6-.6-4-2.6-4-5 2.6 0 4 1.8 4 4 0-2.2 1.4-4 4-4 0 2.4-1.4 4.4-4 5z"/><path d="M12 14c-2.6-.6-4-2.4-4-4.6 2.6 0 4 1.6 4 3.4 0-1.8 1.4-3.4 4-3.4 0 2.2-1.4 4-4 4.6z"/>',
    krec: '<path d="M4 9l8-5 8 5v7l-8 5-8-5z"/><path d="M4 9l8 5 8-5M12 14v7"/>',
    ulje: '<path d="M12 3c3 5 6 8 6 12a6 6 0 0 1-12 0c0-4 3-7 6-12z"/>',
    snaga: '<path d="M13 2L5 13h6l-1 9 8-12h-6z"/>',
    jaja: '<path d="M12 3c4 0 7 6 7 11a7 7 0 0 1-14 0c0-5 3-11 7-11z"/>',
    perje: '<path d="M20 4C11 4 6 10 6 18"/><path d="M6 18c7 0 13-5 14-14"/><path d="M4 20l2-2M9 14h4M11 11h4"/>',
    pregled: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
    zgrade: '<path d="M14 4l6 6-3 3-6-6z"/><path d="M11 7L4 14l3 3 7-7"/><path d="M4 20h9"/>',
    istrazivanja: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.5 15h9"/>',
    inkubator: '<path d="M12 6c3 0 5 4 5 7.5a5 5 0 0 1-10 0C7 10 9 6 12 6z"/><path d="M6 3l1.5 2M18 3l-1.5 2M12 2v2"/><path d="M4 21h16"/>',
    odbrana: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    odred: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
    komsiluk: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
    jato: '<path d="M3 14c3-4 6-4 9 0 3-4 6-4 9 0"/><path d="M6 9c2-2.6 4-2.6 6 0 2-2.6 4-2.6 6 0"/>',
    poruke: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 7l9 6 9-6"/>',
    rang: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
    novcanik: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 12h5v3h-5a1.5 1.5 0 0 1 0-3z"/><path d="M5 6l10-3 1 3"/>',
    upozorenje: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
    sat: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    strelica: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    uhodi: '<circle cx="12" cy="12" r="3"/><path d="M2 12c3-5 6-7 10-7s7 2 10 7c-3 5-6 7-10 7s-7-2-10-7z"/>',
    napad: '<path d="M14 4l6 0 0 6-9 9-3-3 9-9"/><path d="M4 20l4-4M6 14l4 4"/>',
    transport: '<rect x="2" y="7" width="13" height="10" rx="1"/><path d="M15 10h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    poruka: '<path d="M4 5h16v11H9l-5 4z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>'
  };
  function icon(name, cls) {
    return `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name] || ''}</svg>`;
  }

  global.ICO = icon;
})(window);
