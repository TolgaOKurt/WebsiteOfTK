(() => {
  const BASE_PATH = "images";
  const contentEl = document.getElementById('icerik');
  const navEl = document.getElementById('nav');
  const CACHE = new Map();

  // i18n
  let currentLang = 'tr';
  const translations = {}; // Cache for loaded translation files: { "en_anasayfa": { ... } }
  const translationCache = new Map(); // Cache for fetch promises

  const pages = [
    { name: "anasayfa", textKey: "nav_anasayfa", file: "html/anasayfa.html", icon: "images/tk_16x16.png" },
    {
      name: "matematik-ve-kod",
      textKey: "Matematik_ve_Kodlama",
      icon: "images/matevekod_16x16.png",
      children: [
        { name: "RMBiVD", textKey: "nav_RMBiVD", file: "html/RMBiVD.html", icon: "images/mavitop_16x16.png" },
        { name: "PSPp", text: "WIP PSP+", file: "html/Pspp.html", icon: "images/pulumsu_16x16.png" },
        { name: "Agac", text: "WIP Ağaç", file: "html/Agac.html", icon: "images/agacimsi_16x16.png" },
        { name: "USD", text: "WIP USD", file: "html/UcgenSayDong.html", icon: "images/cizgiler_16x16.png" },
        { name: "SSMT", text: "WIP SSMT", file: "html/SSMT.html", icon: "images/tank_16x16.png" },
        { name: "MH", text: "WIP MontyHall", file: "html/MontyHall.html", icon: "images/kapı_16x16.png" },
        { name: "FT", text: "WIP FormulTahmin", file: "html/FormTahm.html", icon: "images/253_16x16.png" },
      ]
    },
    { name: "iletisim", textKey: "nav_iletisim", file: "html/iletisim.html", icon: "images/hi_16x16.png" }
  ];

  async function fetchTranslationFile(path) {
    if (translationCache.has(path)) {
      return translationCache.get(path);
    }
    try {
      const res = await fetch(path);
      if (!res.ok) {
        translationCache.set(path, null);
        return null;
      }
      const data = await res.json();
      translationCache.set(path, data);
      return data;
    } catch (err) {
      console.error(`Failed to fetch translation file: ${path}`, err);
      translationCache.set(path, null);
      return null;
    }
  }

  function getPageInfo(pageName) {
    function find(p, name) {
      for (const item of p) {
        if (item.name === name) return item;
        if (item.children) {
          const found = find(item.children, name);
          if (found) return found;
        }
      }
      return null;
    }
    return find(pages, pageName);
  }

  function getTranslationPageName(pageName) {
    const pageInfo = getPageInfo(pageName);
    if (!pageInfo || pageInfo.children) {
        return pageName;
    }
    return pageInfo.file.split('/')[1].replace('.html', '');
  }

  async function loadLanguageForPage(lang, pageName) {
    const translationPageName = getTranslationPageName(pageName);
    const langKey = `${lang}_${translationPageName}`;
    if (translations[langKey]) return;

    const sharedTr = await fetchTranslationFile(`lang/shared/${lang}.json`) || {};
    const pageTr = await fetchTranslationFile(`lang/${translationPageName}/${lang}.json`) || {};
    
    translations[langKey] = { ...sharedTr, ...pageTr };
  }

  function getTranslation(key) {
    const pageName = location.hash.replace('#', '') || "anasayfa";
    const translationPageName = getTranslationPageName(pageName);

    const currentLangKey = `${currentLang}_${translationPageName}`;
    const enKey = `en_${translationPageName}`;
    const trKey = `tr_${translationPageName}`;

    return (translations[currentLangKey] && translations[currentLangKey][key])
      || (translations[enKey] && translations[enKey][key])
      || (translations[trKey] && translations[trKey][key])
      || key;
  }

  let links = [];

  function applyTranslations(scope = document) {
    scope.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const translation = getTranslation(key);
      if (el.hasAttribute('data-i18n-allow-html')) {
        el.innerHTML = translation;
        applyTranslations(el);
      } else {
        el.textContent = translation;
      }
    });
    scope.querySelectorAll('[data-i18n-title]').forEach(el => el.title = getTranslation(el.dataset.i18nTitle));
    scope.querySelectorAll('[data-i18n-alt]').forEach(el => el.alt = getTranslation(el.dataset.i18nAlt));
    scope.querySelectorAll('[data-i18n-aria-label]').forEach(el => el.setAttribute('aria-label', getTranslation(el.dataset.i18nAriaLabel)));
    scope.querySelectorAll('[data-i18n-content]').forEach(el => el.content = getTranslation(el.dataset.i18nContent));

    links.forEach(({ el, page }) => {
        const text = page.textKey ? getTranslation(page.textKey) : page.text;
        const icon = el.querySelector('.nav-icon');
        const textContainer = el.matches('.nav-folder-toggle') ? el.querySelector('span') : el;
        if (textContainer) {
            textContainer.textContent = text + ' ';
            if (icon) textContainer.appendChild(icon);
        }
    });

    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      const theme = document.documentElement.getAttribute('data-theme') || 'light';
      themeBtn.textContent = getTranslation(theme === 'dark' ? 'theme_dark' : 'theme_light');
    }

    const flagSrc = {
      tr: 'images/flags/4x3/tr.svg', en: 'images/flags/4x3/gb.svg', ja: 'images/flags/4x3/jp.svg', zh: 'images/flags/4x3/cn.svg', es: 'images/flags/4x3/es.svg', it: 'images/flags/4x3/it.svg', fr: 'images/flags/4x3/fr.svg', de: 'images/flags/4x3/de.svg', ru: 'images/flags/4x3/ru.svg', el: 'images/flags/4x3/gr.svg', ko: 'images/flags/4x3/kr.svg'
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
    currentLang = lang;
    const name = location.hash.replace('#', '') || "anasayfa";
    
    await loadLanguageForPage(currentLang, name);
    if (currentLang !== 'en') await loadLanguageForPage('en', name);
    if (currentLang !== 'tr') await loadLanguageForPage('tr', name);

    localStorage.setItem('lang', currentLang);
    document.documentElement.lang = currentLang;
    
    applyTranslations(document);
  }

  function initLangToggle() {
    const header = document.querySelector('header');
    if (!header) return;
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
        tr: 'images/flags/4x3/tr.svg', en: 'images/flags/4x3/gb.svg', ja: 'images/flags/4x3/jp.svg', zh: 'images/flags/4x3/cn.svg', es: 'images/flags/4x3/es.svg', it: 'images/flags/4x3/it.svg', fr: 'images/flags/4x3/fr.svg', de: 'images/flags/4x3/de.svg', ru: 'images/flags/4x3/ru.svg', el: 'images/flags/4x3/gr.svg', ko: 'images/flags/4x3/kr.svg'
      };
      const langTitle = { tr: 'Türkçe', en: 'English', ja: '日本語', zh: '中文', es: 'Español', it: 'Italiano', fr: 'Français', de: 'Deutsch', ru: 'Русский', el: 'Ελληνικά', ko: '한국어' };
      ['tr','en','ja','zh','es','it','fr','de','ru','el','ko'].forEach(lang => {
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

      function openMenu() { menu.hidden = false; trigger.setAttribute('aria-expanded', 'true'); document.addEventListener('click', onDocClick, { capture: true }); document.addEventListener('keydown', onKeyDown); }
      function closeMenu() { menu.hidden = true; trigger.setAttribute('aria-expanded', 'false'); document.removeEventListener('click', onDocClick, { capture: true }); document.removeEventListener('keydown', onKeyDown); }
      function onDocClick(e) { if (!dd.contains(e.target)) closeMenu(); }
      function onKeyDown(e) { if (e.key === 'Escape') { closeMenu(); trigger.focus(); } }
      trigger.addEventListener('click', () => { if (menu.hidden) openMenu(); else closeMenu(); });
    }
    let note = document.getElementById('ai-translation-note');
    if (!note) {
      note = document.createElement('span');
      note.id = 'ai-translation-note';
      note.className = 'ai-note';
      note.style.display = 'none';
      header.appendChild(note);
    }
  }

  function buildNav(pages, container) {
    pages.forEach(p => {
      if (p.children) {
        const folder = document.createElement('div');
        folder.className = 'nav-folder';

        const toggle = document.createElement('button');
        toggle.className = 'nav-folder-toggle link';
        toggle.setAttribute('aria-expanded', 'false');
        
        const toggleText = document.createElement('span');
        toggle.appendChild(toggleText);

        if (p.icon) {
          const img = document.createElement('img');
          img.src = p.icon;
          img.alt = "";
          img.loading = 'lazy';
          img.decoding = 'async';
          img.className = 'nav-icon';
          toggle.appendChild(img);
        }

        const content = document.createElement('div');
        content.className = 'nav-folder-content';
        content.hidden = true;

        toggle.addEventListener('click', () => {
            const isExpanded = content.hidden = !content.hidden;
            toggle.setAttribute('aria-expanded', !isExpanded);
        });

        folder.appendChild(toggle);
        folder.appendChild(content);
        container.appendChild(folder);
        links.push({ el: toggle, page: p, isFolder: true, contentEl: content });
        buildNav(p.children, content);
      } else {
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
        a.addEventListener('click', e => { e.preventDefault(); location.hash = a.getAttribute('href'); });
        container.appendChild(a);
        links.push({ el: a, page: p });
      }
    });
  }

  function injectNavStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .nav-folder-content {
            padding-left: 20px;
            overflow: hidden;
            max-height: 1000px; /* Set a large max-height for transition */
            transition: max-height 0.3s ease-in-out, visibility 0.3s ease-in-out;
        }
        .nav-folder-content[hidden] {
            max-height: 0;
        }
        .nav-folder-toggle {
            background: none; 
            border: none; 
            padding: 0; 
            font: inherit; 
            cursor: pointer; 
            text-align: left; 
            width: 100%;
        }
        .nav-folder-toggle::after {
            content: ' ▼';
            font-size: 0.8em;
            display: inline-block;
            transition: transform 0.2s;
        }
        .nav-folder-toggle[aria-expanded="true"]::after {
            transform: rotate(180deg);
        }
    `;
    document.head.appendChild(style);
  }

  function injectHeaderStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .header-title-link {
            color: inherit;
            text-decoration: none;
            font-weight: inherit;
            cursor: pointer;
        }
        .header-title-link:hover {
            color: inherit;
            text-decoration: none;
        }
    `;
    document.head.appendChild(style);
  }

  function initHeaderLink() {
    const h1 = document.querySelector('header h1');
    if (h1 && h1.textContent === 'Tolga Kurt') {
        h1.innerHTML = ''; // Clear the h1
        const link = document.createElement('a');
        link.href = '#anasayfa';
        link.textContent = 'Tolga Kurt';
        link.className = 'header-title-link';
        link.addEventListener('click', e => {
            e.preventDefault();
            location.hash = link.getAttribute('href');
        });
        h1.appendChild(link);
    }
  }

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
        if (navigator.share) {
          try { await navigator.share({ title: 'WebsiteOfTK', text: 'WebsiteOfTK', url: shareUrl }); } catch (_) { try { await navigator.clipboard.writeText(shareUrl); } catch (_) {} }
        } else {
          try {
            await navigator.clipboard.writeText(shareUrl);
            const prev = link.textContent;
            link.textContent = 'Copied';
            setTimeout(() => { link.textContent = prev; }, 1200);
          } catch (_) { window.open(shareUrl, '_blank', 'noopener,noreferrer'); }
        }
      });
      header.appendChild(link);
    }
  }

  function setActive(name) {
    links.forEach(({ el, page, isFolder, contentEl }) => {
        if (isFolder) {
            const isChildActive = page.children.some(child => child.name === name);
            if (isChildActive) {
                contentEl.hidden = false;
                el.setAttribute('aria-expanded', 'true');
            }
            el.classList.remove('active');
        } else {
            const isActive = page.name === name;
            el.classList.toggle('active', isActive);
            if (isActive) {
                el.setAttribute('aria-current', 'page');
            } else {
                el.removeAttribute('aria-current');
            }
        }
    });
  }

  async function loadPage(name) {
    const pageInfo = getPageInfo(name) || getPageInfo('anasayfa');
    setActive(name);

    await loadLanguageForPage(currentLang, name);
    if (currentLang !== 'en') await loadLanguageForPage('en', name);
    if (currentLang !== 'tr') await loadLanguageForPage('tr', name);
    
    contentEl.classList.remove('show');
    contentEl.classList.add('fade');
    try {
      let html;
      if (CACHE.has(pageInfo.file)) {
        html = CACHE.get(pageInfo.file);
      } else {
        const res = await fetch(pageInfo.file);
        if (!res.ok) throw new Error('Yükleme hatası: ' + res.status);
        html = await res.text();
        CACHE.set(pageInfo.file, html);
      }
      contentEl.innerHTML = html;

      applyTranslations(document);

      contentEl.querySelectorAll('img[data-src]').forEach(img => {
        const filename = img.dataset.src.split('/').pop();
        img.src = `${BASE_PATH}/${filename}`;
        img.loading = img.getAttribute('loading') || 'lazy';
        img.decoding = img.getAttribute('decoding') || 'async';
      });
      contentEl.querySelectorAll('img:not([loading])').forEach(img => { img.loading = 'lazy'; img.decoding = 'async'; });
      strengthenExternalLinks(contentEl);
      const pageTitle = pageInfo.textKey ? getTranslation(pageInfo.textKey) : pageInfo.text;
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
    const name = location.hash.replace('#', '') || "anasayfa";
    loadPage(name);
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
    injectNavStyles();
    injectHeaderStyles();
    buildNav(pages, navEl);
    initHeaderLink();

    const savedLang = localStorage.getItem('lang');
    const browserLang = navigator.language.split('-')[0];
    const supported = ['tr','en','ja','zh','es','it','fr','de','ru','el','ko'];
    currentLang = savedLang || (supported.includes(browserLang) ? browserLang : 'tr');
    document.documentElement.lang = currentLang;

    initThemeToggle();
    initLangToggle();
    initShareLink();
    strengthenExternalLinks(document);

    const name = location.hash.replace('#', '') || "anasayfa";
    await loadPage(name);
  });
})();