const waURL = t => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
const $ = id => document.getElementById(id);

const grid = $('grid'), filters = $('filters'), sel = $('prodSel');

function draw(cat){
  grid.innerHTML = PRODUCTS.filter(p => cat === 'todos' || p.c === cat).map((p,i) => `
    <article class="p" style="animation-delay:${i*55}ms">
      <div class="img">${p.b ? `<b>${p.b}</b>` : ''}${p.img ? `<img src="${p.img}" alt="${p.n}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">` : ICONS[p.c]}<i>REF ${String(PRODUCTS.indexOf(p)+1).padStart(2,'0')}</i></div>
      <div class="bd"><h3>${p.n}</h3><p>${p.d}</p><span class="go">Consultar <span>→</span></span></div>
      <a class="ov" href="${waURL('Hola! Quiero consultar por: ' + p.n)}" target="_blank" rel="noopener" aria-label="Consultar ${p.n}"></a>
    </article>`).join('');
}

filters.innerHTML = Object.entries(CATS).map(([k,v]) => `<button data-k="${k}" class="${k==='todos'?'on':''}">${v}</button>`).join('');
filters.onclick = e => {
  const k = e.target.dataset.k; if (!k) return;
  [...filters.children].forEach(b => b.classList.toggle('on', b === e.target));
  draw(k);
};
draw('todos');

sel.innerHTML = PRODUCTS.map(p => `<option>${p.n}</option>`).join('') + '<option>Otro / no estoy seguro</option>';
['waLink','waFab'].forEach(id => $(id).href = waURL('Hola! Vi la web de ML Equipamiento y quiero hacer una consulta.'));

$('f').onsubmit = e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  window.open(waURL(`Hola! Soy ${d.n}. Tengo un ${d.m} ${d.mo||''}. Quiero equipar: ${d.p}. ${d.msg||''} ${d.t?'Tel: '+d.t:''}`), '_blank');
};

// cinta de marcas
const brands = ["Volkswagen","✦","Toyota","✦","Ford","✦","Chevrolet","✦","Todas las marcas","✦"];
$('mq').innerHTML = [...brands,...brands,...brands,...brands].map(x => `<span>${x}</span>`).join('');

// header, menú, reveal, preloader
const hd = $('hd');
addEventListener('scroll', () => hd.classList.toggle('sc', scrollY > 40), {passive:true});
const menu = $('menu');
$('bg').onclick = () => menu.classList.toggle('open');
menu.onclick = () => menu.classList.remove('open');
const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting){ x.target.classList.add('in'); io.unobserve(x.target); } }), {threshold:.12});
document.querySelectorAll('.rv').forEach(el => io.observe(el));
addEventListener('load', () => setTimeout(() => $('pre').classList.add('off'), 600));
