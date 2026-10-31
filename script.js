/* =====================================================================
   EDIT HERE: your files. Put images in assets/images/, clips in assets/videos/
   Use MP4 (H.264). If a file is missing, a labelled placeholder is shown.
   Optional music: put assets/song12.mp3
   ===================================================================== */
const MEDIA = {
  p1: { src: 'assets/images/photo-1.jpg', alt: 'A memory with Didi at the office' },
  p2: { src: 'assets/images/photo-2.jpg', alt: 'A memory with Didi' },
  p3: { src: 'assets/images/photo-3.jpg', alt: 'A memory with Didi' },
  p4: { src: 'assets/images/photo-4.jpg', alt: 'An office memory' },
  p5: { src: 'assets/images/photo-5.jpg', alt: 'A pencil sketch of us' },
  p6: { src: 'assets/images/photo-6.jpg', alt: 'A coloured sketch of us together' },
  v1: { src: 'assets/videos/clip-1.mp4' },
  v2: { src: 'assets/videos/clip-2.mp4' },
  v3: { src: 'assets/videos/clip-3.mp4' },
  v4: { src: 'assets/videos/clip-4.mp4' },
  v5: { src: 'assets/videos/clip-5.mp4' },
  v6: { src: 'assets/videos/clip-6.mp4' },
  v7: { src: 'assets/videos/clip-7.mp4' },                                   // NEW clip
};
// To add more clips: copy a <figure class="film" data-slot="v8"> in index.html and add v8 above.

const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---- Build photo / video slots (lazy: only loaded when near viewport) ---- */
function placeholder(label, file) {
  const d = document.createElement('div');
  d.className = 'ph';
  d.innerHTML = `<span>${label}<b>${file}</b></span>`;
  return d;
}
function fill(el) {
  const m = MEDIA[el.dataset.slot]; if (!m || el.dataset.done) return;
  el.dataset.done = 1;
  if (el.classList.contains('photo')) {
    const img = new Image(); img.alt = m.alt || ''; img.loading = 'lazy'; img.decoding = 'async';
    img.onerror = () => img.replaceWith(placeholder('Photo goes here', m.src));
    img.src = m.src; el.appendChild(img);
  } else {
    const v = document.createElement('video');
    v.controls = true; v.playsInline = true; v.preload = 'metadata'; v.setAttribute('playsinline', '');
    v.muted = true; v.defaultMuted = true; v.setAttribute('muted', '');                 // clips stay MUTED (music plays instead)
    v.addEventListener('volumechange', () => { if (!v.muted) v.muted = true; });        // even if someone taps unmute
    v.setAttribute('aria-label', 'A short memory clip');
    v.onerror = () => v.replaceWith(placeholder('Your clip goes here', m.src));
    v.addEventListener('loadedmetadata', () => { if (v.videoWidth) el.style.aspectRatio = v.videoWidth + ' / ' + v.videoHeight; }); // keeps real proportions
    v.src = m.src; el.appendChild(v);
    v.loop = true;
    // AUTOPLAY (always muted, so browsers allow it): plays when the clip is on screen, pauses when scrolled away
    new IntersectionObserver(es => { const e = es[0]; if (e.isIntersecting && e.intersectionRatio >= .5) v.play().catch(() => {}); else v.pause(); }, { threshold: [0, .5] }).observe(el);
  }
}
const lazy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { fill(e.target); lazy.unobserve(e.target); } }), { rootMargin: '600px' });
document.querySelectorAll('[data-slot]').forEach(el => lazy.observe(el));


/* ---- REVEAL TRANSITIONS: each photo / clip enters in a different way as you scroll to it.
   Photo styles: drop, slideL, zoom, slideR, swing.  Clip styles: iris, wipe, frame, curtain.
   Change the order or remove names here; they repeat in a cycle. ---- */
const PHOTO_FX = ['drop', 'slideL', 'zoom', 'slideR', 'swing'];
const VIDEO_FX = ['iris', 'wipe', 'frame', 'curtain'];
document.querySelectorAll('.photo[data-slot]').forEach((el, i) => el.dataset.fx = PHOTO_FX[i % PHOTO_FX.length]);
document.querySelectorAll('.film[data-slot]').forEach((el, i) => el.dataset.fx = VIDEO_FX[i % VIDEO_FX.length]);

/* ---- Gentle reveal on scroll ---- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); if (e.target.closest('#closing')) $('#closing').classList.add('lit'); }
}), { threshold: .18, rootMargin: '0px 0px -8% 0px' });
function startReveal() { document.querySelectorAll('.r').forEach(el => io.observe(el)); }

/* ---- OPENING SEQUENCE ---- */
/* ---- PHOTO ORBIT: on opening, photos fly out, circle once around the screen, then fall into the letter.
   It uses your photos (photo-1..6 from MEDIA); any photo that is missing is simply skipped. ---- */
new Image().src = 'assets/images/cover.jpg';                    // preload the cover
const ORBIT_KEYS = ['p1','p4','p2','p3','p5','p6'];            // order the photos appear (max 6)
const orbitImgs = {};
ORBIT_KEYS.forEach(k => { const i = new Image(); i.onload = () => { orbitImgs[k] = i; }; i.src = MEDIA[k].src; });
function orbit() {
  return new Promise(done => {
    const items = ORBIT_KEYS.filter(k => orbitImgs[k]).map(k => orbitImgs[k]);
    if (!items.length) return setTimeout(done, 700);
    const box = document.createElement('div'); box.className = 'orbit';
    box.innerHTML = '<div class="glow"></div><div class="orbit-heart">❤</div>';
    const ths = items.map((im, i) => { const t = document.createElement('div'); t.className = 'th';
      const c = new Image(); c.src = im.src; c.alt = ''; t.appendChild(c); box.appendChild(t); return { t, tilt: (i % 2 ? 1 : -1) * (4 + i * 2) }; });
    document.body.appendChild(box);
    const n = ths.length, R = Math.min(innerWidth * .34, 165);
    const SPIN_START = 500, SPIN_LEN = 1400, FEAT_START = 1900, STEP = 330, FEAT_LEN = 520;   // timings (ms)
    const T = FEAT_START + (n - 1) * STEP + FEAT_LEN + 100, END = T - 500;
    const RING = .54, ZOOM = 1.15;                                  // ring size / zoomed-in size
    const eo = p => 1 - Math.pow(1 - p, 3), eio = p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2, cl = p => Math.max(0, Math.min(1, p));
    const heart = box.querySelector('.orbit-heart'), glow = box.querySelector('.glow');
    let t0 = null, finished = false;
    function frame(ts) {
      if (t0 === null) t0 = ts; const t = ts - t0;
      const out = cl(t / 800), spin = eio(cl((t - SPIN_START) / SPIN_LEN));
      ths.forEach((o, i) => {
        const a = i * 2 * Math.PI / n - Math.PI / 2 + spin * 2 * Math.PI;
        let x = Math.cos(a) * R * eo(out), y = Math.sin(a) * R * eo(out) * .9, sc = RING * (.2 + .8 * out), op = Math.min(out * 1.5, 1), rot = o.tilt + spin * 40, z = 1;
        const f = (t - (FEAT_START + i * STEP)) / FEAT_LEN;           // one photo at a time steps forward and zooms in
        if (f > 0) {
          const m = eo(cl(f / .5)), fade = cl((f - .65) / .35);
          x *= 1 - m; y *= 1 - m; sc = RING + (ZOOM - RING) * m + .1 * fade; rot *= 1 - m; op = 1 - fade; z = 5;
        }
        o.t.style.zIndex = z;
        o.t.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px) rotate(${rot}deg) scale(${sc})`;
        o.t.style.opacity = op;
      });
      const k = Math.sin(Math.PI * cl(t / T));
      heart.style.opacity = k; heart.style.transform = `translate(-50%,-50%) scale(${.6 + .6 * k})`; glow.style.opacity = k;
      if (t >= END && !finished) { finished = true; done(); }          // letter starts opening as the last photo leaves
      if (t < T) requestAnimationFrame(frame); else box.remove();
    }
    requestAnimationFrame(frame);
  });
}

let busy = false;
async function openCard() {
  if (busy) return; busy = true;
  const env = $('#env'), flap = $('#flap');
  $('#hint').style.visibility = 'hidden';
  if (reduce) return finish();
  env.classList.add('press');                 // Stage 1: tactile press
  await wait(160); env.classList.remove('press');
  $('#cap').classList.add('gone');
  $('#cardcover').classList.add('open');      // Stage 1b: the collage cover swings open like a card
  await wait(1500);                           //   ...revealing the sealed envelope underneath
  $('#seal').classList.add('gone');           // seal breaks
  $('.cover').classList.add('gone');
  await wait(250);
  flap.classList.add('open');                 // Stage 2: flap rotates open in 3D
  await wait(480); flap.classList.add('behind'); // flap passes vertical -> goes behind the letter
  await wait(550);
  env.classList.add('rise');                  // Stage 3: letter slides out
  await wait(1350);
  env.classList.add('away');                  // Stage 4: envelope slips away...
  await orbit();                              //   ...and her photos swirl round once (see orbit() below)
  finish();                                   // Stage 5: letter unfolds, text reveals
}
function finish() {
  document.body.classList.replace('closed', 'opened');
  $('#scene').style.display = 'none';
  scrollTo(0, 0);
  startReveal();
  const m = $('#music'); m.hidden = false;
  startAutoScroll();
}
$('#env').addEventListener('click', openCard);   // click, touch and keyboard (Enter/Space on the button)

/* ---- Closing: close the card again ---- */
$('#close-card').addEventListener('click', () => location.reload());

/* ---- Background music (never autoplays; starts only when she taps the button) ----
   1) If you add assets/song12.mp3 it plays that.
   2) Otherwise a soft, original piano-like loop is generated right in the browser (no file needed). */
const bgm = $('#bgm'), mb = $('#music'); bgm.volume = .35;
let synth = null, mode = null;
function makeSynth() {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  const ctx = new AC(), master = ctx.createGain(); master.gain.value = .5;
  const wet = ctx.createGain(); wet.gain.value = .55;
  const conv = ctx.createConvolver(), len = ctx.sampleRate * 3, ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5); }
  conv.buffer = ir; master.connect(ctx.destination); master.connect(conv); conv.connect(wet); wet.connect(ctx.destination);
  const f = m => 440 * Math.pow(2, (m - 69) / 12);
  const chords = [[48,55,60,64,67,72],[45,52,57,60,64,69],[41,48,57,60,65,69],[43,50,55,59,62,67]]; // C Am F G
  const pat = [0,2,3,4,5,4,3,2], beat = .42;
  function note(m, t, dur, vol, type) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f(m);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05);
  }
  let step = 0, next = 0, timer = null;
  function tick() {
    while (next < ctx.currentTime + .6) {
      const ch = chords[Math.floor(step / 8) % 4], i = step % 8;
      if (i === 0) [0, 2, 4].forEach(k => note(ch[k] - 12, next, beat * 8, .05, 'sine')); // soft pad
      note(ch[pat[i]] + 12, next, 1.6, .09, 'triangle');                                // melody-like arpeggio
      if (i % 4 === 0) note(ch[0], next, 1.2, .08, 'sine');                              // bass
      next += beat; step++;
    }
  }
  return { start() { ctx.resume(); next = ctx.currentTime + .1; timer = setInterval(tick, 200); tick(); },
           stop() { clearInterval(timer); ctx.suspend(); } };
}
function setOn(on) { mb.classList.toggle('on', on); mb.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); }
async function startMusic() {                       // plays your file; if it is missing, the built-in loop
  if (mode) return;
  try { await bgm.play(); mode = 'file'; }
  catch (e) { synth = synth || makeSynth(); if (!synth) return; synth.start(); mode = 'synth'; }
  setOn(true);
}
mb.addEventListener('click', () => {                 // the round button still pauses / resumes
  if (mode) { (mode === 'file' ? bgm.pause() : synth.stop()); mode = null; return setOn(false); }
  startMusic();
});

/* AUTO-START: music tries to start the moment the page loads.
   Browsers (Chrome, Safari, phones) block sound until the person touches the page once, so if the
   automatic start is blocked, the music starts on the FIRST tap / click / key press, which is her tap
   on the envelope. */
bgm.play().then(() => { mode = 'file'; setOn(true); }).catch(() => {});
const firstTouch = e => {
  if (e.target.closest && e.target.closest('#music')) return;   // the music button handles itself
  ['pointerdown', 'touchstart', 'keydown'].forEach(t => removeEventListener(t, firstTouch, true));
  startMusic();
};
['pointerdown', 'touchstart', 'keydown'].forEach(t => addEventListener(t, firstTouch, true));


/* ---- AUTO SCROLL: the letter drifts down by itself, slowly, like a film.
   Touch / wheel / key = it pauses and resumes ~3.5s later. The round ↓ button switches it off/on. ---- */
const AS_SPEED = 42;                                  // pixels per second (lower = slower)
const asBtn = $('#autoscroll');
let asOn = true, asPaused = false, asY = 0, asLast = 0, asTimer = null, asStarted = false;
function asSync() { asBtn.classList.toggle('on', asOn); asBtn.setAttribute('aria-label', asOn ? 'Pause auto scroll' : 'Start auto scroll'); asBtn.textContent = asOn ? '↓' : '▶'; }
function asFrame(ts) {
  requestAnimationFrame(asFrame);
  const dt = Math.min(ts - asLast, 64); asLast = ts;
  if (!asOn || asPaused) return;
  asY += AS_SPEED * dt / 1000;
  const max = document.documentElement.scrollHeight - innerHeight;
  if (asY >= max) { scrollTo(0, max); asOn = false; asSync(); return; }   // reached the end
  scrollTo(0, asY);
}
function startAutoScroll() {
  if (reduce || asStarted) return; asStarted = true;
  setTimeout(() => { asY = scrollY; asLast = performance.now(); asBtn.hidden = false; asSync(); requestAnimationFrame(asFrame); }, 2800);
}
function holdAS() { asPaused = true; clearTimeout(asTimer); asTimer = setTimeout(() => { asY = scrollY; asPaused = false; }, 3500); }
['wheel', 'touchstart', 'touchmove', 'keydown', 'pointerdown'].forEach(t => addEventListener(t, e => {
  if (!document.body.classList.contains('opened') || (e.target.closest && e.target.closest('#autoscroll'))) return; holdAS();
}, { passive: true }));
asBtn.addEventListener('click', () => { asOn = !asOn; asPaused = false; asY = scrollY; asSync(); });
