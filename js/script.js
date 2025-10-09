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
    if (translations[lang]) return true;
    try {
      const res = await fetch(`lang/${lang}.json`);
      if (!res.ok) throw new Error(`Language file for ${lang} not found`);
      translations[lang] = await res.json();
      return true;
    } catch (err) {
      console.error(err);
      if (lang !== 'tr') await loadLanguage('tr');
      return false;
    }
  }

  function getTranslation(key, lang = currentLang) {
    // Try current language, then English, then Turkish, then key
    return (translations[lang] && translations[lang][key])
      || (translations['en'] && translations['en'][key])
      || (translations['tr'] && translations['tr'][key])
      || key;
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

    // Update language dropdown active state and trigger label
    const flagSrc = {
      tr: 'images/flags/4x3/tr.svg',
      en: 'images/flags/4x3/gb.svg',
      ja: 'images/flags/4x3/jp.svg',
      zh: 'images/flags/4x3/cn.svg',
      es: 'images/flags/4x3/es.svg',
      it: 'images/flags/4x3/it.svg',
      fr: 'images/flags/4x3/fr.svg',
      de: 'images/flags/4x3/de.svg',
      ru: 'images/flags/4x3/ru.svg',
      el: 'images/flags/4x3/gr.svg'
    };
    const trigger = document.getElementById('lang-trigger');
    if (trigger) {
      trigger.textContent = '';
      const img = document.createElement('img');
      img.src = flagSrc[currentLang] || '';
      img.alt = '';
      img.className = 'flag-icon';
      img.loading = 'lazy';
      img.decoding = 'async';
      trigger.appendChild(img);
    }
    const menu = document.getElementById('lang-menu');
    if (menu) {
      menu.querySelectorAll('button[data-lang]').forEach(btn => {
        const isActive = btn.getAttribute('data-lang') === currentLang;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-current', isActive ? 'true' : 'false');
      });
    }

    // Show a tiny note next to the language button when non-TR is active
    const aiNote = document.getElementById('ai-translation-note');
    if (aiNote) {
      if (currentLang !== 'tr') {
        aiNote.textContent = getTranslation('ai_note');
        aiNote.style.display = '';
      } else {
        aiNote.textContent = '';
        aiNote.style.display = 'none';
      }
    }
  }

  async function setLanguage(lang) {
    const ok = await loadLanguage(lang);
    if (!ok && lang !== 'tr') {
      // keep current language if requested one is unavailable yet
      return;
    }
    currentLang = ok ? lang : 'tr';
    localStorage.setItem('lang', currentLang);
    document.documentElement.lang = currentLang;
    applyTranslations(document);
    const name = location.hash.replace('#', '') || "anasayfa";
    await loadPage(name);
  }

  function initLangToggle() {
    const header = document.querySelector('header');
    if (!header) return;
    // Remove old group if exists
    const oldGroup = document.getElementById('lang-toggle-group');
    if (oldGroup) oldGroup.remove();

    // Create dropdown container
    let dd = document.getElementById('lang-dropdown');
    if (!dd) {
      dd = document.createElement('div');
      dd.id = 'lang-dropdown';
      dd.className = 'lang-dropdown';
      header.appendChild(dd);

      const trigger = document.createElement('button');
      trigger.id = 'lang-trigger';
      trigger.type = 'button';
      trigger.className = 'lang-trigger';
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      dd.appendChild(trigger);

      const menu = document.createElement('div');
      menu.id = 'lang-menu';
      menu.className = 'lang-menu';
      menu.setAttribute('role', 'menu');
      menu.hidden = true;
      dd.appendChild(menu);

      const flagSrc = {
        tr: 'images/flags/4x3/tr.svg',
        en: 'images/flags/4x3/gb.svg',
        ja: 'images/flags/4x3/jp.svg',
        zh: 'images/flags/4x3/cn.svg',
        es: 'images/flags/4x3/es.svg',
        it: 'images/flags/4x3/it.svg',
        fr: 'images/flags/4x3/fr.svg',
        de: 'images/flags/4x3/de.svg',
        ru: 'images/flags/4x3/ru.svg',
        el: 'images/flags/4x3/gr.svg'
      };
      const langTitle = { tr: 'Türkçe', en: 'English', ja: '日本語', zh: '中文', es: 'Español', it: 'Italiano', fr: 'Français', de: 'Deutsch', ru: 'Русский', el: 'Ελληνικά' };
      ['tr','en','ja','zh','es','it','fr','de','ru','el'].forEach(lang => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'lang-option';
        item.setAttribute('data-lang', lang);
        item.setAttribute('role', 'menuitemradio');
        item.setAttribute('aria-checked', 'false');
        const img = document.createElement('img');
        img.src = flagSrc[lang];
        img.alt = '';
        img.className = 'flag-icon';
        img.loading = 'lazy';
        img.decoding = 'async';
        item.appendChild(img);
        const span = document.createElement('span');
        span.textContent = langTitle[lang];
        item.appendChild(span);
        item.title = langTitle[lang] || lang.toUpperCase();
        item.addEventListener('click', async () => {
          await setLanguage(lang);
          closeMenu();
        });
        menu.appendChild(item);
      });

      function openMenu() {
        menu.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        document.addEventListener('click', onDocClick, { capture: true });
        document.addEventListener('keydown', onKeyDown);
      }
      function closeMenu() {
        menu.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
        document.removeEventListener('click', onDocClick, { capture: true });
        document.removeEventListener('keydown', onKeyDown);
      }
      function onDocClick(e) {
        if (!dd.contains(e.target)) closeMenu();
      }
      function onKeyDown(e) {
        if (e.key === 'Escape') {
          closeMenu();
          trigger.focus();
        }
      }
      trigger.addEventListener('click', () => {
        if (menu.hidden) openMenu(); else closeMenu();
      });
    }
    // Ensure the AI translation note exists next to the group
    let note = document.getElementById('ai-translation-note');
    if (!note) {
      note = document.createElement('span');
      note.id = 'ai-translation-note';
      note.className = 'ai-note';
      note.style.display = 'none';
      header.appendChild(note);
    }
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

  function initShareLink() {
    const header = document.querySelector('header');
    if (!header) return;
    let link = document.getElementById('share-link');
    if (!link) {
      link = document.createElement('a');
      link.id = 'share-link';
      link.className = 'theme-toggle';
      const shareUrl = 'https://tolgaokurt.github.io/WebsiteOfTK/';
      link.href = shareUrl;
      link.title = 'Share website';
      link.textContent = 'Share';
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        // Prefer native share on supported (typically mobile) browsers
        if (navigator.share) {
          try {
            await navigator.share({ title: 'WebsiteOfTK', text: 'WebsiteOfTK', url: shareUrl });
          } catch (_) {
            // user cancelled or share failed -> fall back to copy
            try { await navigator.clipboard.writeText(shareUrl); } catch (_) {}
          }
          return;
        }
        // Desktop fallback: copy to clipboard
        try {
          await navigator.clipboard.writeText(shareUrl);
          const prev = link.textContent;
          link.textContent = 'Copied';
          setTimeout(() => { link.textContent = prev; }, 1200);
        } catch (_) {
          // As a last resort, open the URL
          window.open(shareUrl, '_blank', 'noopener,noreferrer');
        }
      });
      header.appendChild(link);
    }
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

  function setHintExplanationSuffix() {
    const suffix = getTranslation('hint_suffix');
    const styleId = 'hint-after-lang-style';
    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = `.hint::after { content: '${suffix}'; }`;
  }

  const origApplyTranslations = applyTranslations;
  applyTranslations = function(...args) {
    origApplyTranslations.apply(this, args);
    setHintExplanationSuffix();
  };

  const origSetLanguage = setLanguage;
  setLanguage = async function(lang, ...args) {
    await origSetLanguage.apply(this, [lang, ...args]);
    setHintExplanationSuffix();
  };

  document.addEventListener('DOMContentLoaded', async () => {
    const savedLang = localStorage.getItem('lang');
    const browserLang = navigator.language.split('-')[0];
    const supported = ['tr','en','ja','zh','es','it','fr','de','ru','el'];
    currentLang = savedLang || (supported.includes(browserLang) ? browserLang : 'tr');

    await loadLanguage('tr');
    await loadLanguage('en');
    // Try to load preferred language if different
    if (!['tr','en'].includes(currentLang)) {
      await loadLanguage(currentLang);
    }

    document.documentElement.lang = currentLang;
    initThemeToggle();
    initLangToggle();
    initShareLink();
    strengthenExternalLinks(document);
    applyTranslations(document);
    setHintExplanationSuffix();

    const name = location.hash.replace('#', '') || "anasayfa";
    loadPage(name);
  });
})();