// Basit SPA davranışı: nav linklerine tıklanınca fetch ile içerik yükle, history.pushState kullan.
(() => {
  const contentEl = document.getElementById('icerik');
  const nav = document.getElementById('nav');
  const links = Array.from(nav.querySelectorAll('a[data-link]'));
  const CACHE = new Map();

  // Hangi dosya varsayılan:
  const DEFAULT_PAGE = 'html/anasayfa.html';

  // Yardımcı: linkleri active yap
  function setActive(href) {
    links.forEach(a => {
      const isActive = a.getAttribute('href') === href;
      a.classList.toggle('active', isActive);
      if (isActive) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  // İçerik yükleme
  async function loadPage(href, { push = true } = {}) {
    // temizleyip yükleme animasyonu
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

      // içerik atama
      contentEl.innerHTML = html;
      // başlık güncelle (eğer içerikte <title> yoksa fallback)
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const h2 = temp.querySelector('h2');
      document.title = (h2 ? h2.textContent + ' — ' : '') + 'MiniSite';

      // erişilebilirlik: main elementine odak ver
      contentEl.focus({ preventScroll: true });

      // active link
      setActive(href);

      // history
      if (push) {
        history.pushState({ href }, '', href);
      } else {
        // replaceState ile sayfa doğrudan geldiğinde url'yi düzelt
        history.replaceState({ href }, '', href);
      }

      // animasyonu tetikle (küçük gecikme ile)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          contentEl.classList.add('show');
        });
      });

      // içerdeki dahili linkleri yakala (örn. içerik içinde başka html linkleri varsa)
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

  // içerik içindeki <a href="*.html"> linklerini yakala
 function bindInternalLinks(root) {
  // sadece "html/" klasöründeki linkleri yakala
  const anchors = Array.from(root.querySelectorAll('a[href^="html/*.html"]'));
  anchors.forEach(a => {
    a.addEventListener('click', (e) => {
      const url = a.getAttribute('href');
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
      const href = a.getAttribute('href');
      loadPage(href, { push: true });
    });
  });

  // popstate (geri/ileri)
  window.addEventListener('popstate', (e) => {
    const state = e.state;
    const href = state && state.href ? state.href : DEFAULT_PAGE;
    loadPage(href, { push: false });
  });

  // İlk yükleme: eğer URL doğrudan bir .html gösteriyorsa onu yükle, aksi halde DEFAULT_PAGE
  const initialHref = (() => {
    const path = location.pathname.split('/').pop() || '';
    // Eğer doğrudan index.html açıldıysa ya da boş path varsa DEFAULT_PAGE
    if (!path || path === 'index.html') return DEFAULT_PAGE;
    return path;
  })();

  // Başlat
  document.addEventListener('DOMContentLoaded', () => {
    loadPage(initialHref, { push: false });

    // Fare üstünde link önbellekleme (isteğe bağlı ama hız veriyor)
    links.forEach(a => {
      a.addEventListener('mouseover', () => {
        const href = a.getAttribute('href');
        if (!CACHE.has(href)) {
          fetch(href).then(r => r.ok ? r.text() : Promise.reject()).then(txt => CACHE.set(href, txt)).catch(()=>{});
        }
      });
    });
  });
})();
