// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');

if (toggle && links) {
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
}

// Footer year
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

// Design-notes toggle: swaps every image in the section that has a
// data-noted version between its clean and annotated file.
document.querySelectorAll('.notes-toggle').forEach((btn) => {
  btn.addEventListener('click', () => {
    const on = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', on);
    btn.closest('section').querySelectorAll('img[data-noted]').forEach((img) => {
      if (!img.dataset.clean) img.dataset.clean = img.getAttribute('src');
      img.src = on ? img.dataset.noted : img.dataset.clean;
    });
  });
});

// Finished work / Process switch. The URL hash (#process) keeps the
// chosen view linkable.
const tabs = [...document.querySelectorAll('.view-tabs [role="tab"]')];

if (tabs.length) {
  const select = (view, updateHash) => {
    tabs.forEach((t) => {
      const on = t.dataset.view === view;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    document.querySelectorAll('[data-hint]').forEach((h) => { h.hidden = h.dataset.hint !== view; });
    if (updateHash) history.replaceState(null, '', view === 'process' ? '#process' : location.pathname);
  };

  // Where the switch bar sits before it sticks (just below the hero).
  const hero = document.querySelector('.project-hero');
  const navHeight = document.querySelector('.site-nav')?.offsetHeight || 0;

  tabs.forEach((t) => t.addEventListener('click', () => {
    const barTop = hero.offsetTop + hero.offsetHeight - navHeight;
    const scrolledPast = window.scrollY > barTop;
    select(t.dataset.view, true);
    // Only if the reader is already below the bar: jump back so the new
    // view starts right under it. Otherwise leave the scroll alone.
    if (scrolledPast) window.scrollTo({ top: barTop, behavior: 'instant' });
  }));
  select(location.hash === '#process' ? 'process' : 'final', false);
}

// Lightbox for gallery images. Uses data-full on the <img> when present
// (a larger original), otherwise the image's current src. Only images in
// the visible view are stepped through.
const allZooms = [...document.querySelectorAll('.zoom')];
let zooms = allZooms;

if (allZooms.length) {
  const box = document.createElement('dialog');
  box.className = 'lightbox';
  box.innerHTML = `
    <img alt="">
    <p class="lightbox-caption"></p>
    <button class="lb-close" aria-label="Close">✕</button>
    <button class="lb-prev" aria-label="Previous image">←</button>
    <button class="lb-next" aria-label="Next image">→</button>`;
  document.body.append(box);

  const boxImg = box.querySelector('img');
  const boxCap = box.querySelector('.lightbox-caption');
  let index = 0;

  const show = (i) => {
    index = (i + zooms.length) % zooms.length;
    const img = zooms[index].querySelector('img');
    const noted = img.dataset.noted && img.src.endsWith(img.dataset.noted);
    boxImg.src = (!noted && img.dataset.full) || img.src;
    boxImg.alt = img.alt;
    const cap = zooms[index].closest('figure')?.querySelector('figcaption');
    boxCap.textContent = cap ? cap.textContent : '';
  };

  allZooms.forEach((z) => z.addEventListener('click', () => {
    zooms = allZooms.filter((el) => el.offsetParent !== null);
    box.querySelectorAll('.lb-prev, .lb-next').forEach((btn) => { btn.hidden = zooms.length < 2; });
    show(zooms.indexOf(z));
    box.showModal();
  }));
  box.querySelector('.lb-close').addEventListener('click', () => box.close());
  box.querySelector('.lb-prev').addEventListener('click', () => show(index - 1));
  box.querySelector('.lb-next').addEventListener('click', () => show(index + 1));
  box.addEventListener('click', (e) => { if (e.target === box) box.close(); });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });

}

// Process videos on the Art page. data-video is "youtube:ID" or "drive:ID".
const videoBtns = document.querySelectorAll('[data-video]');

if (videoBtns.length) {
  const vbox = document.createElement('dialog');
  vbox.className = 'video-box';
  vbox.innerHTML = `
    <div class="video-frame"></div>
    <div class="video-bar"><span class="vb-title"></span><button class="vb-close">Close ✕</button></div>`;
  document.body.append(vbox);
  const frame = vbox.querySelector('.video-frame');

  const close = () => { vbox.close(); };
  vbox.addEventListener('close', () => { frame.innerHTML = ''; });
  vbox.querySelector('.vb-close').addEventListener('click', close);
  vbox.addEventListener('click', (e) => { if (e.target === vbox) close(); });

  videoBtns.forEach((btn) => btn.addEventListener('click', () => {
    const [host, id] = btn.dataset.video.split(':');
    const src = host === 'youtube'
      ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`
      : `https://drive.google.com/file/d/${id}/preview`;
    const title = btn.dataset.title || 'Process video';
    frame.innerHTML = `<iframe src="${src}" title="${title}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    vbox.querySelector('.vb-title').textContent = title;
    vbox.showModal();
  }));
}

// Art masonry: deal pieces left to right into the shortest column so the
// newest-first order reads across rows. Heights come from each image's
// width/height attributes, so this works before the images load.
const artGrid = document.querySelector('.art-grid');

if (artGrid) {
  const pieces = [...artGrid.querySelectorAll('.art-piece')];
  let current = 0;

  const layout = () => {
    const width = artGrid.clientWidth;
    const count = width >= 900 ? 3 : width >= 560 ? 2 : 1;
    if (count === current) return;
    current = count;

    const cols = Array.from({ length: count }, () => {
      const col = document.createElement('div');
      col.className = 'art-col';
      return col;
    });
    const heights = new Array(count).fill(0);

    pieces.forEach((piece) => {
      const img = piece.querySelector('img');
      const ratio = img.getAttribute('height') / img.getAttribute('width');
      const i = heights.indexOf(Math.min(...heights));
      cols[i].append(piece);
      heights[i] += ratio + 0.15; // + caption allowance
    });

    artGrid.replaceChildren(...cols);
    artGrid.classList.add('is-masonry');
  };

  layout();
  window.addEventListener('resize', layout);
}
