const SECTIONS = {
  anasayfa: `<h2>Merhaba — Ben Tolga</h2>
            <p>CV , ilgi alanları, iletişim vs.</p>
            <pre>
            <br>
            <br>
            <br>
            <br>ŞUANDA YAPIM AŞAMASINDA<pre>`,


  matematik: `<h2>Matematik</h2>
            <p>Notlar, görselleştirmeler ve kısa açıklamalar.</p>
            <img class="res" src="images/Pillars_of_Creation_jr.png" alt="Matematik görsel">`,


  c: `<h2>C Programlama</h2>
      <p>Projeler: p1, performans odaklı işler.</p>
      <pre>bura ne</pre>`,


  python: `<h2>Python</h2><p>zamazingo</p>`,



  
  konu0: `<h2>Konu0</h2>
          <p>İDK.</p>
          <div id="yazi"></div>`
          ,






  konu1: `<h2>Konu1</h2><p>idk2.</p>`,


  fotograf: `<h2>Fotoğraflar</h2><p>Fotoğraflar yani.</p>`,



  konu2: `<h2>Konu2</h2><p>idk3</p>`
};

const contentEl = document.getElementById('icerik');
const navEl = document.getElementById('nav');

function show(id){
  const html = SECTIONS[id] || SECTIONS.anasayfa;
  contentEl.innerHTML = `<div class="fade" id="section-inner">${html}</div>`;
  requestAnimationFrame(()=> {
    const inner = document.getElementById('section-inner');
    inner.classList.add('show');
  });
  [...navEl.querySelectorAll('.link')].forEach(a=>{
    a.classList.toggle('active', a.dataset.id === id);
  });
}











function handleHash(){
  const id = (location.hash || '#anasayfa').slice(1);
  show(id);
}

window.addEventListener('DOMContentLoaded', handleHash);
window.addEventListener('hashchange', handleHash);







