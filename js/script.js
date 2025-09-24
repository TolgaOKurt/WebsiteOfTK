(() => {



  // BASE_PATH dinamiği: Live Server veya GH Pages uyumlu
  const BASE_PATH = window.location.hostname.includes("github.io")
                  ? "https://raw.githubusercontent.com/TolgaOKurt/WebsiteOfTK/main/images"
                  : "images"; // local


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





    if (p.icon) {a.innerHTML = ` ${p.text}<img src="${p.icon}" alt="${p.text}" style="width:16px; height:16px; vertical-align:middle; margin-right:5px;">`;}




    navEl.appendChild(a);
    return { el: a, page: p };
  });

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

      // görselleri BASE_PATH ile ayarlama
      contentEl.querySelectorAll('img[data-src]').forEach(img => {
        const filename = img.dataset.src.split('/').pop(); // sadece dosya adı
        img.src = `${BASE_PATH}/${filename}`;
      });


      const temp = document.createElement('div');
      temp.innerHTML = html;
      const h2 = temp.querySelector('h2');
      document.title = (h2 ? h2.textContent + ' — ' : '') + 'Tolga Kurt';

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
    loadPage(name);
  });



})();
