(() => {
  'use strict';
  const root = document.documentElement;
  const key = 'ayshh-notice-map-appearance';
  let preferences = {dark: false, contrast: false};
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    preferences = {dark: saved?.dark === true, contrast: saved?.contrast === true};
  } catch {}
  const apply = () => {
    root.dataset.theme = preferences.dark ? 'dark' : 'light';
    root.dataset.contrast = preferences.contrast ? 'high' : 'normal';
  };
  apply();
  document.addEventListener('DOMContentLoaded', () => {
    for (const setting of ['dark', 'contrast']) {
      const input = document.getElementById(`appearance-${setting}`);
      input.checked = preferences[setting];
      input.addEventListener('change', () => {
        preferences[setting] = input.checked;
        apply();
        try { localStorage.setItem(key, JSON.stringify(preferences)); } catch {}
      });
    }
    const menu = document.getElementById('menu');
    const toggle = document.getElementById('menu-toggle');
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-modal', 'true');
    const backdrop = document.createElement('button');
    backdrop.className = 'menu-backdrop';
    backdrop.type = 'button';
    backdrop.tabIndex = -1;
    backdrop.setAttribute('aria-label', '전체 메뉴 닫기');
    menu.before(backdrop);
    backdrop.addEventListener('pointerdown', event => event.preventDefault());
    const panelHeader = document.createElement('div');
    panelHeader.className = 'menu-panel-header';
    panelHeader.innerHTML = '<strong>전체 메뉴</strong><button type="button" class="menu-panel-close" aria-label="전체 메뉴 닫기"><span></span><span></span></button>';
    menu.prepend(panelHeader);
    panelHeader.querySelector('button').addEventListener('click', () => {
      close(); toggle.focus();
    });
    const close = () => {
      menu.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', '메뉴 열기');
      document.body.classList.remove('menu-open');
    };
    document.addEventListener('click', event => {
      if (!menu.hidden && !menu.contains(event.target) && !toggle.contains(event.target)) {
        close();
        if (event.target === backdrop) toggle.focus();
      }
    });
    document.addEventListener('keydown', event => {
      if (menu.hidden) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        close(); toggle.focus();
      } else if (event.key === 'Tab') {
        const controls = Array.from(menu.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),[tabindex="0"]')).filter(el => el.getClientRects().length);
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && (document.activeElement === first || !menu.contains(document.activeElement))) {event.preventDefault();last?.focus();}
        else if (!event.shiftKey && (document.activeElement === last || !menu.contains(document.activeElement))) {event.preventDefault();first?.focus();}
      }
    }, true);
    document.addEventListener('focusin', event => {
      if (!menu.hidden && !menu.contains(event.target) && !toggle.contains(event.target)) {
        close();
        if (event.target === backdrop) toggle.focus();
      }
    });
    toggle.addEventListener('click', () => {
      if (!menu.hidden) {toggle.setAttribute('aria-label', '메뉴 닫기');panelHeader.querySelector('button').focus();}
    });
  });
})();
