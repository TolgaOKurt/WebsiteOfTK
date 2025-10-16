window.theme = (() => {
  // Depends on window.language.applyTranslations
  const { applyTranslations } = window.language;

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function getPreferredTheme() {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function initThemeToggle() {
    const header = document.querySelector('header');
    if (!header) return;
    let btn = document.getElementById('theme-toggle');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'theme-toggle';
      btn.type = 'button';
      btn.className = 'theme-toggle';
      header.appendChild(btn);
    }
    const currentTheme = getPreferredTheme();
    applyTheme(currentTheme);
    btn.addEventListener('click', () => {
      const next = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      applyTheme(next);
      applyTranslations(); // Update button text
    });
  }

  return {
    initThemeToggle,
  };
})();
