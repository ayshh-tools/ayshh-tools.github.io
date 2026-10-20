(() => {
  'use strict';
  const card = document.querySelector('.pwa-card');
  if (!card) return;
  const button = document.getElementById('pwa-install');
  const status = document.getElementById('pwa-status');
  let pending;
  const report = message => { status.textContent = message; status.hidden = false; };
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); pending = event;
    if (!standalone) button.hidden = false;
  });
  button.addEventListener('click', async () => {
    if (!pending) return;
    const prompt = pending; pending = null; button.hidden = true;
    try { await prompt.prompt(); await prompt.userChoice; }
    catch { report('브라우저 메뉴에서 홈 화면에 추가를 선택하세요.'); }
  });
  window.addEventListener('appinstalled', () => { pending = null; button.hidden = true; report('설치가 완료됐어요.'); });
})();
