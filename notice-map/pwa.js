(() => {
  'use strict';
  const offline = document.getElementById('offline-status');
  const cachedShell = document.documentElement.hasAttribute('data-cached-shell');
  const syncConnection = () => {
    if (!offline) return;
    const disconnected = navigator.onLine === false;
    offline.hidden = !disconnected && !cachedShell;
    offline.textContent = cachedShell
      ? `${disconnected ? '오프라인 · ' : ''}저장된 공고 정보입니다. 최신 정보는 연결 후 새로고침해 확인하세요.`
      : '오프라인 · 사진·지도는 연결이 필요합니다.';
  };
  window.addEventListener('online', syncConnection);
  window.addEventListener('offline', syncConnection);
  window.addEventListener('pageshow', syncConnection);
  syncConnection();
  const card = document.querySelector('.pwa-card');
  if (!card) return;
  const button = document.getElementById('pwa-install');
  const status = document.getElementById('pwa-status');
  let pending;
  const report = message => { status.textContent = message; status.hidden = false; };
  const displayMode = matchMedia('(display-mode: standalone)');
  const syncInstallCard = () => {
    card.hidden = displayMode.matches || navigator.standalone === true;
    if (card.hidden) button.hidden = true;
  };
  syncInstallCard();
  displayMode.addEventListener('change', syncInstallCard);
  window.addEventListener('pageshow', syncInstallCard);
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); pending = event;
    if (!card.hidden) button.hidden = false;
  });
  button.addEventListener('click', async () => {
    if (!pending) return;
    const prompt = pending; pending = null; button.hidden = true;
    try { await prompt.prompt(); await prompt.userChoice; }
    catch { report('브라우저 메뉴에서 홈 화면에 추가를 선택하세요.'); }
  });
  window.addEventListener('appinstalled', () => { pending = null; button.hidden = true; card.hidden = true; });
})();
