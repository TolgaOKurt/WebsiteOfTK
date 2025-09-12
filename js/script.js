(() => {
  const contentEl = document.getElementById('icerik');
  const navEl = document.getElementById('nav');
  const CACHE = new Map();

  // BASE_PATH dinamiği: GH Pages /WebsiteOfTK, local /
  const BASE_PATH = window.location.hostname.includes("github.io") ? "/WebsiteOfTK" : "";

  // Sayfa linkleri ve başlıkları
  const navLinks = [
    { text: "Anasayfa", href: `${BASE_PATH}/html/anasayfa.html` },
    { text: "Hakkımızda", href: `${BASE_PATH}/html/hakkimizda.html` },
    { text: "İletişim", href: `${BASE_PATH}/html/iletisim.html` },
  ];

  // NAV linklerini DOM'a ekle
  const links = navLinks.map(link => {
    const a = document.createElement("a");
    a.textContent = link.text;
    a.href = link.href;
    a.className = "link";
    a.dataset.link = "";
    navEl.appendChild(a);
    return a;
  });

  // hangi dosya varsayılan
  const DEFAULT_PAGE = `${BASE_PATH}/html/anasayfa.html`;

  // active link ayarla
  function setActive(href) {
    links.forEach(a => {
      const isActive = a.href === href || a.getAttribute('href') === href;
      a.classList.toggle('active', isActive);
      if (isActive) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  // içerik yükleme
  async function loadPage(href, { push = true } = {}) {
    contentEl.classList.remove('show');
    contentEl.classList.add('fade');

    try {
      let html;
      if (CACHE.has(href)) {
        html = CACHE.get(href);
      } else {
        const res = await fetch(href, { cache: 'no-store' });
        if (!res.ok) throw new Error('Yükleme hatası: ' + res.status);
        html = await res.text();
        CACHE.set(href, html);
      }

      contentEl.innerHTML = html;

      // başlık güncelle
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const h2 = temp.querySelector('h2');
      document.title = (h2 ? h2.textContent + ' — ' : '') + 'MiniSite';

      contentEl.focus({ preventScroll: true });
      setActive(href);

      if (push) {
        history.pushState({ href }, '', href);
      } else {
        history.replaceState({ href }, '', href);
      }

      // fade animasyonu
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          contentEl.classList.add('show');
        });
      });

      bindInternalLinks(contentEl);

    } catch (err) {
      console.error(err);
      contentEl.innerHTML = `
        <h2>Bir şeyler ters gitti</h2>
        <p>İçerik yüklenemedi. Hata: ${err.message}</p>
      `;
      setActive(null);
    }
  }

  // içerik içindeki dahili linkleri yakala
  function bindInternalLinks(root) {
    const anchors = Array.from(root.querySelectorAll('a[href$=".html"]'));
    anchors.forEach(a => {
      a.addEventListener('click', (e) => {
        const url = a.href;
        if (a.target === '_blank' || url.startsWith('http')) return;
        e.preventDefault();
        loadPage(url, { push: true });
      });
    });
  }

  // nav linklerine event ekle
  links.forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      loadPage(a.href, { push: true });
    });

    // fare hover ile önbelleğe alma
    a.addEventListener('mouseover', () => {
      const href = a.href;
      if (!CACHE.has(href)) {
        fetch(href)
          .then(r => r.ok ? r.text() : Promise.reject())
          .then(txt => CACHE.set(href, txt))
          .catch(()=>{});
      }
    });
  });

  // popstate (geri/ileri)
  window.addEventListener('popstate', (e) => {
    const state = e.state;
    const href = state && state.href ? state.href : DEFAULT_PAGE;
    loadPage(href, { push: false });
  });

  // ilk yükleme
  document.addEventListener('DOMContentLoaded', () => {
    loadPage(DEFAULT_PAGE, { push: false });
  });

})();
