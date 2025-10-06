(() => {



  // BASE_PATH: GH Pages ve lokal için tek yol
  const BASE_PATH = "images";


  const contentEl = document.getElementById('icerik');
  const navEl = document.getElementById('nav');
  const CACHE = new Map();





// sayfa tanımları SAYFA EKLEDİKÇE BURAYI DA GÜNCELLE

  const pages = [
    { name: "anasayfa", text: "Anasayfa", file: "html/anasayfa.html", icon: "images/tk_16x16.png" },

    { name: "RMBiVD", text: "RMBiVD", file: "html/RMBiVD.html", icon: "images/mavitop_16x16.png" },
    { name: "PSPp", text: "PSP+", file: "html/Pspp.html", icon: "images/pulumsu_16x16.png" },
    { name: "Agac", text: "Ağaç", file: "html/Agac.html", icon: "images/agacimsi_16x16.png" },
    { name: "USD", text: "USD", file: "html/UcgenSayDong.html", icon: "images/cizgiler_16x16.png" },
    { name: "SSMT", text: "SSMT", file: "html/SSMT.html", icon: "images/tank_16x16.png" },
    { name: "MH", text: "MontyHall", file: "html/MontyHall.html", icon: "images/kapı_16x16.png" },
    { name: "FT", text: "FormulTahmin", file: "html/FormTahm.html", icon: "images/253_16x16.png" },









    { name: "iletisim", text: "İletişim", file: "html/iletisim.html", icon: "images/hi_16x16.png" }
  ];









  // nav linklerini oluştur
  const links = pages.map(p => {
    const a = document.createElement("a");
    a.textContent = p.text;
    a.href = `#${p.name}`;
    a.className = "link";

    if (p.icon) {
      const img = document.createElement('img');
      img.src = p.icon;
      img.alt = p.text;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.className = 'nav-icon';
      a.textContent = p.text + ' ';
      a.appendChild(img);
    }




    navEl.appendChild(a);
    return { el: a, page: p };
  });

  // Dış linkleri güçlendir: rel noopener noreferrer
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
          if (!a.getAttribute('target')) a.setAttribute('target','_blank');
        }
      } catch(_){}
    });
  }

  // Tema yönetimi: dark/light toggle ve kalıcılık
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
    function syncButtonLabel(theme){ btn.textContent = theme === 'dark' ? '🌙 Koyu' : '☀️ Açık'; }
    const current = getPreferredTheme();
    applyTheme(current);
    syncButtonLabel(current);
    btn.addEventListener('click', () => {
      const next = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      applyTheme(next);
      syncButtonLabel(next);
    });
  }

// aktif linki ayarla
  function setActive(name) {
    links.forEach(({ el, page }) => {
      const active = page.name === name;
      el.classList.toggle('active', active);
      if(active) el.setAttribute('aria-current','page');
      else el.removeAttribute('aria-current');
    });
  }


  // sayfa yükleme fonksiyonu

  async function loadPage(name) {
    const page = pages.find(p => p.name === name) || pages[0];
    setActive(page.name);

    contentEl.classList.remove('show');
    contentEl.classList.add('fade');




    try {
      let html;
      if(CACHE.has(page.file)) html = CACHE.get(page.file);
      else {
        const res = await fetch(page.file);
        if(!res.ok) throw new Error('Yükleme hatası: ' + res.status);
        html = await res.text();
        CACHE.set(page.file, html);
      }

      contentEl.innerHTML = html;

      // görselleri BASE_PATH ile ayarlama ve lazy/decoding ekleme
      contentEl.querySelectorAll('img[data-src]').forEach(img => {
        const filename = img.dataset.src.split('/').pop(); // sadece dosya adı
        img.src = `${BASE_PATH}/${filename}`;
        img.loading = img.getAttribute('loading') || 'lazy';
        img.decoding = img.getAttribute('decoding') || 'async';
      });

      // normal img'lere de lazy ve decoding ekle
      contentEl.querySelectorAll('img:not([loading])').forEach(img => {
        img.loading = 'lazy';
        img.decoding = 'async';
      });

      // İçerikteki dış linkleri güçlendir
      strengthenExternalLinks(contentEl);


      // Başlık fallback: önce h1, yoksa h2, yoksa sayfa adı
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const h1 = temp.querySelector('h1');
      const h2 = temp.querySelector('h2');
      const pageTitle = (h1 && h1.textContent) || (h2 && h2.textContent) || page.text;
      document.title = pageTitle + ' — ' + 'Tolga Kurt';

      // Tooltip a11y: title taşıyan .hint ve .info için aria-describedby ekle
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
    } catch(err) {
      console.error(err);
      contentEl.innerHTML = `<h2> 404 bulunamadı :( </h2><p>Hata: ${err.message}</p>`;
      setActive(null);
    }
  }






  // hash değiştiğinde sayfa yükle
  window.addEventListener('hashchange', () => {
    const name = location.hash.replace('#','');
    loadPage(name);
  });

  // nav tıklamalarını yakala
  links.forEach(({ el }) => {
    el.addEventListener('click', e => {
      e.preventDefault();
      location.hash = el.getAttribute('href');
    });
  });

  // sayfa yüklenirken hash kontrolü
  document.addEventListener('DOMContentLoaded', () => {
    const name = location.hash.replace('#','') || "anasayfa";
    // Header'a tema butonu ekle ve tema uygula
    initThemeToggle();
    // Sayfa genelinde dış linkleri güçlendir
    strengthenExternalLinks(document);
    loadPage(name);
  });



})();
