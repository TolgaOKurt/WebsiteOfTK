(() => {
  const BASE_PATH = "images";
  const contentEl = document.getElementById('icerik');
  const navEl = document.getElementById('nav');
  const CACHE = new Map();

  // i18n
  const TRANSLATABLE_PAGES = ['anasayfa', 'iletisim', 'RMBiVD'];
  let currentLang = 'tr';
  let translations = {};

  const pages = [
    { name: "anasayfa", textKey: "nav_anasayfa", file: "html/anasayfa.html", icon: "images/tk_16x16.png" },
    { name: "RMBiVD", textKey: "nav_RMBiVD", file: "html/RMBiVD.html", icon: "images/mavitop_16x16.png" },
    { name: "PSPp", text: "PSP+", file: "html/Pspp.html", icon: "images/pulumsu_16x16.png" },
    { name: "Agac", text: "Ağaç", file: "html/Agac.html", icon: "images/agacimsi_16x16.png" },
    { name: "USD", text: "USD", file: "html/UcgenSayDong.html", icon: "images/cizgiler_16x16.png" },
    { name: "SSMT", text: "SSMT", file: "html/SSMT.html", icon: "images/tank_16x16.png" },
    { name: "MH", text: "MontyHall", file: "html/MontyHall.html", icon: "images/kapı_16x16.png" },
    { name: "FT", text: "FormulTahmin", file: "html/FormTahm.html", icon: "images/253_16x16.png" },
    { name: "iletisim", textKey: "nav_iletisim", file: "html/iletisim.html", icon: "images/hi_16x16.png" }
  ];

  async function loadLanguage(lang) {
    if (translations[lang]) return;
    try {
      const res = await fetch(`lang/${lang}.json`);
      if (!res.ok) throw new Error(`Language file for ${lang} not found`);
      translations[lang] = await res.json();
    } catch (err) {
      console.error(err);
      if (lang !== 'tr') await loadLanguage('tr');
    }
  }

  function getTranslation(key, lang = currentLang) {
    return translations[lang]?.[key] || key;
  }

  function applyTranslations(scope = document) {
    scope.querySelectorAll('[data-i18n]:not([data-i18n-processed])').forEach(el => {
      const key = el.dataset.i18n;
      const translation = getTranslation(key);
      if (el.hasAttribute('data-i18n-allow-html')) {
        el.innerHTML = translation;
        applyTranslations(el);
      } else {
        el.textContent = translation;
      }
      el.setAttribute('data-i18n-processed', 'true');
    });
    scope.querySelectorAll('[data-i18n-processed]').forEach(el => el.removeAttribute('data-i18n-processed'));
    scope.querySelectorAll('[data-i18n-title]').forEach(el => el.title = getTranslation(el.dataset.i18nTitle));
    scope.querySelectorAll('[data-i18n-alt]').forEach(el => el.alt = getTranslation(el.dataset.i18nAlt));
    scope.querySelectorAll('[data-i18n-aria-label]').forEach(el => el.setAttribute('aria-label', getTranslation(el.dataset.i18nAriaLabel)));
    scope.querySelectorAll('[data-i18n-content]').forEach(el => el.content = getTranslation(el.dataset.i18nContent));

    links.forEach(({ el, page }) => {
      const text = page.textKey ? getTranslation(page.textKey) : page.text;
      const icon = el.querySelector('.nav-icon');
      el.textContent = text + ' ';
      if (icon) el.appendChild(icon);
    });

    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      const theme = document.documentElement.getAttribute('data-theme') || 'light';
      themeBtn.textContent = getTranslation(theme === 'dark' ? 'theme_dark' : 'theme_light');
    }

    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
        langBtn.textContent = currentLang === 'tr' ? 'EN' : 'TR';
    }
  }

  async function setLanguage(lang) {
    await loadLanguage(lang);
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    applyTranslations(document);
    const name = location.hash.replace('#', '') || "anasayfa";
    await loadPage(name);
  }

  function initLangToggle() {
    const header = document.querySelector('header');
    if (!header) return;
    let btn = document.getElementById('lang-toggle');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'lang-toggle';
      btn.type = 'button';
      btn.className = 'lang-toggle';
      header.appendChild(btn);
    }
    btn.addEventListener('click', async () => {
      const nextLang = currentLang === 'tr' ? 'en' : 'tr';
      await setLanguage(nextLang);
    });
  }

  const links = pages.map(p => {
    const a = document.createElement("a");
    a.href = `#${p.name}`;
    a.className = "link";
    if (p.icon) {
      const img = document.createElement('img');
      img.src = p.icon;
      img.alt = "";
      img.loading = 'lazy';
      img.decoding = 'async';
      img.className = 'nav-icon';
      a.appendChild(img);
    }
    navEl.appendChild(a);
    return { el: a, page: p };
  });

  function strengthenExternalLinks(scope = document) {
    const currentHost = location.host;
    scope.querySelectorAll('a[href^="http"]').forEach(a => {
      try {
        const url = new URL(a.href);
        if (url.host !== currentHost) {
          const rel = (a.getAttribute('rel') || '').split(/\s+/);
          if (!rel.includes('noopener')) rel.push('noopener');
          if (!rel.includes('noreferrer')) rel.push('noreferrer');
          a.setAttribute('rel', rel.filter(Boolean).join(' ').trim());
          if (!a.getAttribute('target')) a.setAttribute('target', '_blank');
        }
      } catch (_) {}
    });
  }

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
      applyTranslations();
    });
  }

  function setActive(name) {
    links.forEach(({ el, page }) => {
      const active = page.name === name;
      el.classList.toggle('active', active);
      if (active) el.setAttribute('aria-current', 'page');
      else el.removeAttribute('aria-current');
    });
  }

  async function loadPage(name) {
    const page = pages.find(p => p.name === name) || pages[0];
    setActive(page.name);
    contentEl.classList.remove('show');
    contentEl.classList.add('fade');
    try {
      let html;
      if (CACHE.has(page.file)) {
        html = CACHE.get(page.file);
      } else {
        const res = await fetch(page.file);
        if (!res.ok) throw new Error('Yükleme hatası: ' + res.status);
        html = await res.text();
        CACHE.set(page.file, html);
      }
      contentEl.innerHTML = html;

      if (TRANSLATABLE_PAGES.includes(page.name)) {
        applyTranslations(contentEl);
      }

      contentEl.querySelectorAll('img[data-src]').forEach(img => {
        const filename = img.dataset.src.split('/').pop();
        img.src = `${BASE_PATH}/${filename}`;
        img.loading = img.getAttribute('loading') || 'lazy';
        img.decoding = img.getAttribute('decoding') || 'async';
      });
      contentEl.querySelectorAll('img:not([loading])').forEach(img => {
        img.loading = 'lazy';
        img.decoding = 'async';
      });
      strengthenExternalLinks(contentEl);
      const pageTitle = page.textKey ? getTranslation(page.textKey) : page.text;
      document.title = pageTitle + ' — Tolga Kurt';
      contentEl.querySelectorAll('.hint[title], .info[title]').forEach((el, idx) => {
        const text = el.getAttribute('title');
        if (!text) return;
        const id = `tt-${Date.now()}-${idx}`;
        const sr = document.createElement('span');
        sr.id = id;
        sr.className = 'visually-hidden';
        sr.textContent = ` (${text})`;
        el.setAttribute('aria-describedby', id);
        el.appendChild(sr);
      });
      contentEl.focus({ preventScroll: true });
      requestAnimationFrame(() => requestAnimationFrame(() => contentEl.classList.add('show')));
    } catch (err) {
      console.error(err);
      contentEl.innerHTML = `<h2> 404 bulunamadı :( </h2><p>Hata: ${err.message}</p>`;
      setActive(null);
    }
  }

  window.addEventListener('hashchange', () => {
    const name = location.hash.replace('#', '');
    loadPage(name);
  });

  links.forEach(({ el }) => {
    el.addEventListener('click', e => {
      e.preventDefault();
      location.hash = el.getAttribute('href');
    });
  });

  document.addEventListener('DOMContentLoaded', async () => {
    const savedLang = localStorage.getItem('lang');
    const browserLang = navigator.language.split('-')[0];
    currentLang = savedLang || (['tr', 'en'].includes(browserLang) ? browserLang : 'tr');

    await loadLanguage('tr');
    if (currentLang !== 'tr') {
        await loadLanguage(currentLang);
    }

    document.documentElement.lang = currentLang;
    initThemeToggle();
    initLangToggle();
    strengthenExternalLinks(document);
    applyTranslations(document);

    const name = location.hash.replace('#', '') || "anasayfa";
    loadPage(name);
  });
})();