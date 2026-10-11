(function () {
  const key = 'studytask-theme';
  const root = document.documentElement;
  const saved = localStorage.getItem(key);

  function apply(theme) {
    const next = theme === 'pixel' ? 'pixel' : 'cyber';
    root.classList.toggle('theme-pixel', next === 'pixel');
    root.dataset.theme = next;
    localStorage.setItem(key, next);
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.textContent = next === 'pixel' ? '[ cyber ui ]' : '[ pixel ui ]';
      button.setAttribute('aria-label', next === 'pixel' ? 'Ganti ke tema Cyber Terminal' : 'Ganti ke tema Pixel');
    });
  }

  apply(saved || 'cyber');
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-theme-toggle]');
    if (button) apply(root.dataset.theme === 'pixel' ? 'cyber' : 'pixel');
  });
  document.addEventListener('DOMContentLoaded', () => apply(root.dataset.theme || 'cyber'));
})();
