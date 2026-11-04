import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);
const small = () => innerWidth < 1000;
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- rolagem suave ---------- */
let lenis;
if (window.Lenis) {
  lenis = new Lenis({ lerp: 0.085 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href');
  if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis ? (lenis.start(), lenis).scrollTo(id, { offset: -70 }) : document.querySelector(id).scrollIntoView({ behavior: 'smooth' }); }
}));

/* ---------- cabeçalho ---------- */
const hd = document.querySelector('.hd');
addEventListener('scroll', () => hd.classList.toggle('sc', scrollY > 30), { passive: true });
const nv = document.getElementById('nv');
document.getElementById('hb').addEventListener('click', () => nv.classList.toggle('open'));
nv.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nv.classList.remove('open')));
document.getElementById('ano').textContent = new Date().getFullYear();

/* ---------- banner ---------- */
gsap.timeline({ delay: .1 })
  .from('.hero__img img', { scale: 1.3, duration: 2.4, ease: 'expo.out' }, 0)
  .from('.hero__h .ln > *', { yPercent: 110, rotate: 3, duration: 1.2, stagger: .12, ease: 'expo.out' }, .15)
  .to('.hero .an', { opacity: 1, y: 0, duration: 1, stagger: .1, ease: 'expo.out' }, .45);
gsap.to('.hero__img img', { yPercent: 14, scale: 1.08, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
gsap.to('.hero__in', { y: -90, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '45% top', end: 'bottom top', scrub: true } });
const term = document.querySelector('.term');
addEventListener('pointermove', e => {
  if (small()) return;
  const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
  gsap.to(term, { rotateY: -12 + x * 14, rotateX: 6 - y * 10, transformPerspective: 1200, duration: 1, ease: 'power3.out' });
});

// terminal digitando
(async function heroTerminal() {
  const pre = document.getElementById('heroTerm');
  const lines = [
    ['<span class="p">$</span> subir deploy ./minha-loja', 38],
    ['<span class="m">↑ enviando 128 arquivos (4,2 MB)…</span>', 0],
    ['<span class="g">✓</span> imagens otimizadas <span class="m">(-61%)</span>', 0],
    ['<span class="g">✓</span> distribuído em 32 países', 0],
    ['<span class="g">✓</span> certificado HTTPS emitido', 0],
    ['', 0],
    ['<span class="v">● no ar em 3,2s</span>', 0],
    ['<span class="p">→</span> https://minha-loja.subirsite.com.br', 0],
  ];
  while (true) {
    pre.innerHTML = '';
    for (const [l, typeSpeed] of lines) {
      if (typeSpeed) {
        const plain = l.replace(/<[^>]+>/g, ''), prefix = '<span class="p">$</span> ';
        for (let i = 2; i <= plain.length; i++) { pre.innerHTML = prefix + plain.slice(2, i) + '<span class="cursor"></span>'; await sleep(typeSpeed); }
        pre.innerHTML = l + '\n';
        await sleep(400);
      } else { pre.innerHTML += l + '\n'; await sleep(420); }
    }
    pre.innerHTML += '<span class="cursor"></span>';
    await sleep(4200);
  }
})();

/* ================= CANVAS DE NÓS (TESTE DE UPLOAD) ================= */
const canvas = document.getElementById('canvas');
const svg = document.getElementById('wires');
const nodeEls = [...canvas.querySelectorAll('.node')];
const NS = 'http://www.w3.org/2000/svg';
let paths = [];
function drawWires() {
  svg.innerHTML = ''; paths = [];
  const cr = canvas.getBoundingClientRect();
  for (let i = 0; i < nodeEls.length - 1; i++) {
    const a = nodeEls[i].querySelector('.port--out').getBoundingClientRect();
    const b = nodeEls[i + 1].querySelector('.port--in').getBoundingClientRect();
    const x1 = a.left + a.width / 2 - cr.left, y1 = a.top + a.height / 2 - cr.top;
    const x2 = b.left + b.width / 2 - cr.left, y2 = b.top + b.height / 2 - cr.top;
    const dx = Math.max(40, (x2 - x1) * .5);
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', `M${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
    svg.appendChild(p); paths.push(p);
  }
}
addEventListener('resize', drawWires);
addEventListener('load', drawWires);
ScrollTrigger.create({ trigger: canvas, start: 'top 90%', once: true, onEnter: () => {
  drawWires();
  gsap.from(nodeEls, { y: 40, opacity: 0, scale: .9, stagger: .1, duration: .9, ease: 'back.out(1.6)', onComplete: drawWires });
} });

function packet(path, dur = 650) {
  return new Promise(res => {
    if (!path || getComputedStyle(svg).display === 'none') return setTimeout(res, dur * .6);
    const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', 5); svg.appendChild(c);
    const L = path.getTotalLength(), o = { t: 0 };
    gsap.to(o, { t: 1, duration: dur / 1000, ease: 'power1.inOut', onUpdate: () => { const pt = path.getPointAtLength(o.t * L); c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y); }, onComplete: () => { c.remove(); path.classList.add('on'); res(); } });
  });
}
const logBody = document.getElementById('logBody');
const log = (msg, cls = '') => {
  const t = new Date().toLocaleTimeString('pt-BR');
  const p = document.createElement('p'); p.innerHTML = `<span class="ti">${t}</span> <span class="${cls}">${msg}</span>`;
  logBody.appendChild(p); logBody.parentElement.scrollTop = 1e6;
};
const slug = s => (s || 'meu-site').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'meu-site';
const fmtSize = b => b > 1e6 ? (b / 1e6).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB';

let running = false;
async function runFlow(files, name) {
  if (running) return; running = true;
  const runBtn = document.getElementById('runDemo'); runBtn.disabled = true;
  document.getElementById('result').hidden = true;
  nodeEls.forEach(n => n.classList.remove('done', 'run')); paths.forEach(p => p.classList.remove('on'));
  logBody.innerHTML = '';
  const total = files.reduce((s, f) => s + (f.size || 0), 0);
  const html = files.filter(f => /\.html?$/i.test(f.name)).length;
  const imgs = files.filter(f => /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(f.name)).length;
  const site = slug(name);
  const steps = [
    () => { log(`Recebidos ${files.length} arquivo(s) · ${fmtSize(total)}`, 'in'); if (html) log(`${html} página(s) HTML encontrada(s)`); else log('Nenhum index.html encontrado — vamos gerar uma página inicial'); },
    () => { log(`Minificando HTML, CSS e JS…`); if (imgs) log(`${imgs} imagem(ns) comprimida(s) · -${30 + Math.round(Math.random() * 40)}%`, 'ok'); log('Cache configurado', 'ok'); },
    () => { log('Replicando em 32 países: São Paulo, Rio, Miami, Lisboa, Frankfurt…'); log('Propagação concluída', 'ok'); },
    () => { log(`Certificado HTTPS emitido para ${site}.subirsite.com.br`, 'ok'); },
    () => { log(`● Pronto para publicar: https://${site}.subirsite.com.br`, 'ok'); },
  ];
  document.getElementById('liveUrl').textContent = 'aguardando…';
  for (let i = 0; i < nodeEls.length; i++) {
    const n = nodeEls[i];
    n.classList.add('run');
    await sleep(i === 0 ? 500 : 750);
    steps[i]();
    n.classList.remove('run'); n.classList.add('done');
    if (i < paths.length) await packet(paths[i]);
  }
  document.getElementById('liveUrl').textContent = `${site}.subirsite.com.br`;
  document.getElementById('resUrl').textContent = `${site}.subirsite.com.br`;
  const res = document.getElementById('result'); res.hidden = false;
  gsap.from(res, { y: 20, opacity: 0, duration: .6, ease: 'expo.out' });
  runBtn.disabled = false; running = false;
}

// coleta só nomes e tamanhos — nada é enviado
async function readEntries(items) {
  const out = []; let root = '';
  const walk = async (entry, depth) => {
    if (out.length > 800) return;
    if (entry.isFile) { await new Promise(r => entry.file(f => { out.push({ name: f.name, size: f.size }); r(); }, r)); }
    else if (entry.isDirectory && depth < 8) {
      const reader = entry.createReader();
      let batch;
      do { batch = await new Promise(r => reader.readEntries(r, () => r([]))); for (const e of batch) await walk(e, depth + 1); } while (batch.length);
    }
  };
  for (const it of items) {
    const e = it.webkitGetAsEntry && it.webkitGetAsEntry();
    if (e) { if (!root) root = e.name; await walk(e, 0); }
  }
  return { files: out, root };
}
const drop = document.getElementById('dropNode');
['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove('over')));
drop.addEventListener('drop', async e => {
  e.preventDefault();
  let files = [], root = '';
  if (e.dataTransfer.items && e.dataTransfer.items[0]?.webkitGetAsEntry) ({ files, root } = await readEntries([...e.dataTransfer.items]));
  if (!files.length) { files = [...e.dataTransfer.files].map(f => ({ name: f.name, size: f.size })); root = files[0]?.name; }
  if (files.length) { document.getElementById('dropTxt').innerHTML = `${files.length} arquivo(s)<br/>${fmtSize(files.reduce((s, f) => s + f.size, 0))}`; runFlow(files, root); }
});
const fileIn = document.getElementById('fileIn');
fileIn.addEventListener('change', () => {
  const list = [...fileIn.files]; if (!list.length) return;
  const root = (list[0].webkitRelativePath || list[0].name).split('/')[0];
  const files = list.map(f => ({ name: f.name, size: f.size }));
  document.getElementById('dropTxt').innerHTML = `${files.length} arquivo(s)<br/>${fmtSize(files.reduce((s, f) => s + f.size, 0))}`;
  runFlow(files, root); fileIn.value = '';
});
document.getElementById('runDemo').addEventListener('click', () => runFlow([
  { name: 'index.html', size: 18200 }, { name: 'sobre.html', size: 9100 }, { name: 'style.css', size: 24000 }, { name: 'app.js', size: 61000 },
  { name: 'logo.svg', size: 3000 }, { name: 'banner.jpg', size: 840000 }, { name: 'produto-1.jpg', size: 420000 }, { name: 'produto-2.jpg', size: 390000 },
], 'minha-loja'));

/* ================= FLUXO 3D COM ROLAGEM ================= */
(function flow3d() {
  const cv = document.getElementById('flow3d');
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0d0d14, 14, 46);
  const camera = new THREE.PerspectiveCamera(45, 1, .1, 200);

  // grade de pontos (estilo canvas do n8n)
  const gp = [];
  for (let x = -40; x <= 40; x += 1) for (let z = -30; z <= 30; z += 1) gp.push(x, -2.2, z);
  const gGeo = new THREE.BufferGeometry(); gGeo.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3));
  scene.add(new THREE.Points(gGeo, new THREE.PointsMaterial({ color: 0x4a4a66, size: .06 })));

  scene.add(new THREE.HemisphereLight(0xbfb8ff, 0x0d0d14, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(5, 10, 8); scene.add(key);

  const labelTex = (title, sub, color) => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d');
    g.fillStyle = color; g.globalAlpha = .18; roundRect(g, 176, 70, 160, 160, 34); g.fill(); g.globalAlpha = 1;
    g.strokeStyle = color; g.lineWidth = 6; roundRect(g, 176, 70, 160, 160, 34); g.stroke();
    g.fillStyle = color; g.font = '700 92px Geist, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(sub.icon, 256, 152);
    g.fillStyle = '#eeeef5'; g.font = '700 64px Geist, sans-serif'; g.fillText(title, 256, 318);
    g.fillStyle = '#8d8da6'; g.font = '500 38px Geist, sans-serif'; g.fillText(sub.text, 256, 392);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  };
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  const defs = [
    { p: [0, 0, 0], t: 'Upload', s: { icon: '↑', text: 'seus arquivos' }, c: '#ff6d5a' },
    { p: [7, .8, -4], t: 'Otimizar', s: { icon: '≡', text: 'minifica e comprime' }, c: '#7b61ff' },
    { p: [14, 0, -9], t: 'CDN global', s: { icon: '◎', text: '32 países' }, c: '#29b6f6' },
    { p: [21, .6, -4], t: 'HTTPS', s: { icon: '🔒', text: 'certificado grátis' }, c: '#20c997' },
    { p: [28, 0, 0], t: 'No ar', s: { icon: '✓', text: 'seusite.com.br' }, c: '#ffb020' },
  ];
  const side = [
    { p: [9, -1.4, 3.5], c: '#7b61ff', from: 1 }, { p: [16, 2.4, -14], c: '#29b6f6', from: 2 }, { p: [12, 2.8, -15], c: '#29b6f6', from: 2 }, { p: [24, -1.2, 4], c: '#20c997', from: 3 },
  ];
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x23232f, roughness: .35, metalness: .2, clearcoat: 1, clearcoatRoughness: .25 });
  const nodes = [];
  const geo = new RoundedBoxGeometry(3, 3, .7, 6, .3);
  const mkNode = (d, i) => {
    const g = new THREE.Group(); g.position.set(...d.p);
    const body = new THREE.Mesh(geo, bodyMat); g.add(body);
    const rim = new THREE.Mesh(new RoundedBoxGeometry(3.08, 3.08, .62, 6, .32), new THREE.MeshBasicMaterial({ color: d.c, transparent: true, opacity: .55 })); rim.position.z = -.06; g.add(rim);
    if (d.t) {
      const face = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 2.7), new THREE.MeshBasicMaterial({ map: labelTex(d.t, d.s, d.c), transparent: true }));
      face.position.z = .36; g.add(face);
    }
    [-1.55, 1.55].forEach(x => { const port = new THREE.Mesh(new THREE.SphereGeometry(.14, 16, 16), new THREE.MeshBasicMaterial({ color: 0x8d8da6 })); port.position.set(x, 0, 0); g.add(port); });
    g.userData = { base: g.position.clone(), i, rim };
    scene.add(g); return g;
  };
  defs.forEach((d, i) => nodes.push(mkNode(d, i)));
  const sideNodes = side.map((d, i) => { const n = mkNode(d, 10 + i); n.scale.setScalar(.55); return n; });

  // cabos + pacotes
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x4a4a63 });
  const curves = [], GREEN = new THREE.Color(0x20c997), GRAY = new THREE.Color(0x4a4a63);
  const link = (a, b, main) => {
    const p1 = a.position.clone().add(new THREE.Vector3(1.55 * a.scale.x, 0, 0)), p2 = b.position.clone().add(new THREE.Vector3(-1.55 * b.scale.x, 0, 0));
    const dx = Math.max(1.2, (p2.x - p1.x) * .5);
    const curve = new THREE.CubicBezierCurve3(p1, p1.clone().add(new THREE.Vector3(dx, 0, 0)), p2.clone().add(new THREE.Vector3(-dx, 0, 0)), p2);
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 60, main ? .05 : .03, 8), main ? wireMat.clone() : wireMat); scene.add(mesh);
    curves.push({ curve, main, mesh });
  };
  for (let i = 0; i < nodes.length - 1; i++) link(nodes[i], nodes[i + 1], true);
  sideNodes.forEach((s, i) => link(nodes[side[i].from], s, false));
  const packets = [];
  curves.forEach((c, i) => {
    const n = c.main ? 3 : 1;
    for (let k = 0; k < n; k++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(c.main ? .13 : .08, 16, 16), new THREE.MeshBasicMaterial({ color: c.main ? 0xff6d5a : 0x7b61ff }));
      const halo = new THREE.Mesh(new THREE.SphereGeometry(c.main ? .32 : .2, 16, 16), new THREE.MeshBasicMaterial({ color: c.main ? 0xff6d5a : 0x7b61ff, transparent: true, opacity: .25, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.add(halo); scene.add(m);
      packets.push({ m, c, off: k / n, speed: .25 + Math.random() * .1 });
    }
  });

  const st = { p: 0 };
  const steps = document.querySelectorAll('.ts'), bar = document.getElementById('triBar');
  ScrollTrigger.create({
    trigger: '.tri', start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate: s => {
      gsap.to(st, { p: s.progress, duration: .9, ease: 'power2.out', overwrite: true });
      const idx = Math.min(3, Math.floor(s.progress * 4));
      steps.forEach((el, i) => el.classList.toggle('on', i === idx));
      bar.style.height = (s.progress * 100) + '%';
    }
  });

  const mouse = { x: 0, y: 0 };
  addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth - .5; mouse.y = e.clientY / innerHeight - .5; });
  function resize() {
    const w = cv.clientWidth, h = cv.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < h ? 68 : 45; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  // trajetória da câmera ao longo dos nós
  const camPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-7, 6, 16), new THREE.Vector3(2, 4.5, 13), new THREE.Vector3(9, 5.5, 10), new THREE.Vector3(16, 4, 8), new THREE.Vector3(23, 4.5, 12), new THREE.Vector3(31, 6.5, 17),
  ]);
  const lookPath = new THREE.CatmullRomCurve3(defs.map(d => new THREE.Vector3(...d.p)));
  const cPos = new THREE.Vector3(), cLook = new THREE.Vector3(), v = new THREE.Vector3();

  let vis = false;
  new IntersectionObserver(([e]) => vis = e.isIntersecting).observe(cv);
  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    if (!vis) return;
    const t = clock.getElapsedTime(), p = st.p;
    camPath.getPointAt(Math.min(.999, p), cPos);
    lookPath.getPointAt(Math.min(.999, p * 1.02), cLook);
    camera.position.set(cPos.x + mouse.x * 1.5, cPos.y - mouse.y * 1, cPos.z);
    camera.lookAt(cLook.x - (small() ? 0 : 3.4), cLook.y + (small() ? -1.6 : .3), cLook.z);
    const active = Math.min(4, Math.round(p * 4));
    nodes.forEach((n, i) => {
      const d = n.userData;
      n.position.y = d.base.y + Math.sin(t * 1.2 + i) * .15;
      n.rotation.y = Math.sin(t * .6 + i) * .12 + (cPos.x - n.position.x) * .02;
      const on = i <= active;
      d.rim.material.opacity += ((on ? .9 : .25) - d.rim.material.opacity) * .08;
      const s = i === active ? 1.12 : 1; n.scale.lerp(v.set(s, s, s), .08);
    });
    sideNodes.forEach((n, i) => { n.position.y = n.userData.base.y + Math.sin(t + i * 2) * .2; n.rotation.y = t * .3 + i; });
    curves.forEach((c, i) => { if (c.main) c.mesh.material.color.lerp(i < active ? GREEN : GRAY, .1); });
    packets.forEach(pk => { const u = (pk.off + t * pk.speed) % 1; pk.c.curve.getPointAt(u, pk.m.position); });
    renderer.render(scene, camera);
  })();
})();

/* ---------- reveals ---------- */
gsap.utils.toArray('.sh').forEach(h => gsap.from(h.children, { y: 40, opacity: 0, stagger: .1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 86%' } }));
gsap.utils.toArray('.bx').forEach((b, i) => gsap.from(b, { y: 70, opacity: 0, rotateX: -14, transformPerspective: 900, transformOrigin: '50% 0', duration: 1.1, delay: (i % 3) * .08, ease: 'expo.out', scrollTrigger: { trigger: b, start: 'top 90%' } }));
gsap.from('.num', { y: 60, opacity: 0, stagger: .1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.glob__in', start: 'top 85%' } });
gsap.fromTo('.glob__bg img', { scale: 1.3 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.glob', start: 'top bottom', end: 'bottom top', scrub: true } });
gsap.from('.pc', { y: 80, opacity: 0, rotateY: i => i ? -16 : 16, transformPerspective: 1000, stagger: .12, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.plans', start: 'top 85%' } });
gsap.fromTo('.testi__img img', { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.testi', start: 'top bottom', end: 'bottom top', scrub: true } });
gsap.from('.testi__txt > *', { x: 40, opacity: 0, stagger: .1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.testi', start: 'top 75%' } });
gsap.from('.fq details', { y: 30, opacity: 0, stagger: .08, duration: .8, ease: 'expo.out', scrollTrigger: { trigger: '.fq', start: 'top 80%' } });
document.querySelectorAll('[data-c]').forEach(el => {
  const end = +el.dataset.c, d = +(el.dataset.d || 0), suf = el.dataset.s || '', pre = el.dataset.p || '', o = { v: 0 };
  if (!end) return;
  ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 2.2, ease: 'power3.out', onUpdate: () => el.textContent = pre + (d ? o.v.toFixed(d).replace('.', ',') : Math.round(o.v).toLocaleString('pt-BR')) + suf }) });
});

/* ---------- cadastro ---------- */
const mask = v => {
  v = v.replace(/\D/g, '').slice(0, 11);
  if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  if (v.length > 6) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  if (v.length > 2) return v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
  return v;
};
const tel = document.getElementById('s-tel');
tel.addEventListener('input', () => tel.value = mask(tel.value));
const form = document.getElementById('signupForm');
form.addEventListener('submit', e => {
  e.preventDefault();
  const f = form.elements, err = document.getElementById('signupError');
  form.querySelectorAll('input').forEach(i => i.classList.remove('bad'));
  const fail = (i, m) => { i.classList.add('bad'); i.focus(); err.textContent = m; gsap.fromTo(form, { x: -10 }, { x: 0, duration: .6, ease: 'elastic.out(1,.3)' }); };
  if (f.nome.value.trim().length < 3) return fail(f.nome, 'Informe seu nome completo.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim())) return fail(f.email, 'Informe um e-mail válido.');
  if (f.telefone.value.replace(/\D/g, '').length < 10) return fail(f.telefone, 'Informe um telefone válido com DDD.');
  if (f.senha.value.length < 6) return fail(f.senha, 'A senha deve ter pelo menos 6 caracteres.');
  if (f.senha.value !== f.senha2.value) return fail(f.senha2, 'As senhas não coincidem.');
  err.textContent = '';
  const btn = form.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'Enviando…';
  setTimeout(() => { form.reset(); form.querySelector('.fm__body').hidden = true; form.querySelector('.fm__done').hidden = false; }, 1200);
});

/* ---------- popup login ---------- */
const md = document.getElementById('loginModal');
const open = () => { md.classList.add('on'); md.setAttribute('aria-hidden', 'false'); lenis && lenis.stop(); setTimeout(() => document.getElementById('l-user').focus(), 350); };
const close = () => { md.classList.remove('on'); md.setAttribute('aria-hidden', 'true'); lenis && lenis.start(); };
document.querySelectorAll('[data-open-login]').forEach(b => b.addEventListener('click', open));
md.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
addEventListener('keydown', e => e.key === 'Escape' && close());
const login = document.getElementById('loginForm');
login.addEventListener('submit', e => {
  e.preventDefault();
  const u = document.getElementById('l-user'), p = document.getElementById('l-pass'), err = document.getElementById('loginError');
  if (!u.value.trim() || !p.value) { err.textContent = 'Preencha login e senha.'; return; }
  const btn = login.querySelector('button'); btn.disabled = true; btn.textContent = 'Verificando…'; err.textContent = '';
  setTimeout(() => {
    btn.disabled = false; btn.textContent = 'Entrar'; p.value = '';
    err.textContent = 'Login ou senha incorretos.';
    gsap.fromTo('.md__box', { x: -10 }, { x: 0, duration: .6, ease: 'elastic.out(1,.3)' });
  }, 1300);
});

addEventListener('load', () => { ScrollTrigger.refresh(); drawWires(); });
