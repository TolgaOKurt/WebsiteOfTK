window.language = (() => {
  let currentLang = 'tr';
  const translations = {}; // Cache for loaded translation files: { "en_anasayfa": { ... } }
  const translationCache = new Map(); // Cache for fetch promises
  const flagSrc = {
    tr: 'images/flags/4x3/tr.svg', en: 'images/flags/4x3/gb.svg', ja: 'images/flags/4x3/jp.svg',
    zh: 'images/flags/4x3/cn.svg', es: 'images/flags/4x3/es.svg', it: 'images/flags/4x3/it.svg',
    fr: 'images/flags/4x3/fr.svg', de: 'images/flags/4x3/de.svg', ru: 'images/flags/4x3/ru.svg',
    el: 'images/flags/4x3/gr.svg', ko: 'images/flags/4x3/kr.svg'
  };

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

  function getTranslationPageName(pageName) {
    const pageInfo = window.navigation.getPageInfo(pageName);
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

    window.navigation.links.forEach(({ el, page }) => {
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
    setHintExplanationSuffix();
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

      const langTitle = { tr: 'Türkçe', en: 'English', ja: '日本語', zh: '中文', es: 'Español', it: 'Italiano', fr: 'Français', de: 'Deutsch', ru: 'Русский', el: 'Ελληνικά', ko: '한국어' };
      Object.keys(flagSrc).forEach(lang => {
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
  
  function getCurrentLang() {
    return currentLang;
  }
  
  function setCurrentLang(lang) {
    currentLang = lang;
  }

  return {
    initLangToggle,
    setLanguage,
    applyTranslations,
    loadLanguageForPage,
    getTranslation,
    getCurrentLang,
    setCurrentLang
  };
})();