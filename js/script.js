(() => {
  const BASE_PATH = "images";
  const contentEl = document.getElementById('icerik');
  const navEl = document.getElementById('nav');
  const CACHE = new Map();

  const { getPageInfo, setActive, injectNavStyles, buildNav, pages } = window.navigation;
  const { initLangToggle, setLanguage, applyTranslations, loadLanguageForPage, getTranslation, getCurrentLang, setCurrentLang } = window.language;
  const { initThemeToggle } = window.theme;

  /**
   * Injects CSS styles into the document head to make the header title a clickable link.
   */
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

  /**
   * Converts the main header H1 element into a link that navigates to the homepage.
   */
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

  /**
   * Enhances security and user experience for external links.
   * It adds target="_blank" and rel="noopener noreferrer" to all links pointing to a different host.
   * @param {Document|Element} scope - The element to search for links within.
   */
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

  /**
   * Initializes the share button in the header.
   * Uses the Web Share API if available, otherwise falls back to copying the URL to the clipboard.
   */
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

  /**
   * Loads and displays the content for a given page name.
   * It fetches the HTML, applies translations, and handles dynamic content.
   * @param {string} name - The name of the page to load.
   */
  async function loadPage(name) {
    const pageInfo = getPageInfo(name) || getPageInfo('anasayfa');
    setActive(name);
    const currentLang = getCurrentLang();
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

  // Listen for URL hash changes to load new pages.
  window.addEventListener('hashchange', () => {
    const name = location.hash.replace('#', '') || "anasayfa";
    loadPage(name);
  });

  // Initialize the application after the DOM is fully loaded.
  document.addEventListener('DOMContentLoaded', async () => {
    injectNavStyles();
    injectHeaderStyles();
    buildNav(pages, navEl);
    initHeaderLink();

    const savedLang = localStorage.getItem('lang');
    const browserLang = navigator.language.split('-')[0];
    const supported = ['tr','en','ja','zh','es','it','fr','de','ru','el','ko'];
    const currentLang = savedLang || (supported.includes(browserLang) ? browserLang : 'tr');
    setCurrentLang(currentLang);
    document.documentElement.lang = currentLang;

    initThemeToggle();
    initLangToggle();
    initShareLink();
    strengthenExternalLinks(document);

    const name = location.hash.replace('#', '') || "anasayfa";
    await loadPage(name);
  });
})();