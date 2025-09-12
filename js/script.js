(() => {
  const contentEl = document.getElementById('icerik');
  const navEl = document.getElementById('nav');
  const CACHE = new Map();

  const BASE_PATH = window.location.hostname.includes("github.io") ? "/WebsiteOfTK" : "";

  const navLinks = [
    { text: "Anasayfa", href: `${BASE_PATH}/html/anasayfa.html` },
    { text: "Hakkımızda", href: `${BASE_PATH}/html/hakkimizda.html` },
    { text: "İletişim", href: `${BASE_PATH}/html/iletisim.html` },
  ];

  const links = navLinks.map(link => {
    const a = document.createElement("a");
    a.textContent = link.text;
    a.href = link.href;
    a.className = "link";
    a.dataset.link = "";
    navEl.appendChild(a);
    return a;
  });

  function setActive(href) {
    links.forEach(a => {
      const isActive = a.href === href || a.getAttribute('href') === href;
      a.classList.toggle('active', isActive);
      if (isActive) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  async function loadPage(href, { push = true } = {}) {
    contentEl.classList.remove('show');
    contentEl.classList.add('fade');

    try {
      let html;
      if (CACHE.has(href)) html = CACHE.get(href);
      else {
        const res = await fetch(href, { cache: 'no-store' });
        if (!res.ok) throw new Error('Yükleme hatası: ' + res.status);
        html = await res.text();
        CACHE.set(href, html);
      }

      contentEl.innerHTML = html;

      // <img> ve <a> gibi içindeki yolları BASE_PATH ile düzeltebiliriz
      contentEl.querySelectorAll('img[data-src]').forEach(img => {
        img.src = `${BASE_PATH}/${img.dataset.src}`;
      });

      const temp = document.createElement('div');
      temp.innerHTML = html;
      const h2 = temp.querySelector('h2');
      document.title = (h2 ? h2.textContent + ' — ' : '') + 'MiniSite';

      contentEl.focus({ preventScroll: true });
      setActive(href);

      if (push) history.pushState({ href }, '', href);
      else history.replaceState({ href }, '', href);

      requestAnimationFrame(() => requestAnimationFrame(() => contentEl.classList.add('show')));

      bindInternalLinks(contentEl);

    } catch (err) {
      console.error(err);
      contentEl.innerHTML = `<h2>Bir şeyler ters gitti</h2><p>İçerik yüklenemedi. Hata: ${err.message}</p>`;
      setActive(null);
    }
  }

  function bindInternalLinks(root) {
    const anchors = Array.from(root.querySelectorAll('a[href$=".html"]'));
    anchors.forEach(a => {
      a.addEventListener('click', e => {
        const url = a.href;
        if (a.target === '_blank' || url.startsWith('http')) return;
        e.preventDefault();
        loadPage(url, { push: true });
      });
    });
  }

  links.forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      loadPage(a.href, { push: true });
    });

    a.addEventListener('mouseover', () => {
      const href = a.href;
      if (!CACHE.has(href)) fetch(href).then(r => r.ok ? r.text() : Promise.reject()).then(txt => CACHE.set(href, txt)).catch(()=>{});
    });
  });

  window.addEventListener('popstate', e => {
    const state = e.state;
    const href = state && state.href ? state.href : DEFAULT_PAGE;
    loadPage(href, { push: false });
  });

  // İlk yükleme: URL’den sayfa oku, yoksa default
  const path = location.pathname.replace(BASE_PATH, '');
  const initialHref = path && path !== '/' ? BASE_PATH + path : `${BASE_PATH}/html/anasayfa.html`;

  document.addEventListener('DOMContentLoaded', () => {
    loadPage(initialHref, { push: false });
  });

})();
