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

// Lightbox for gallery images. Uses data-full on the <img> when present
// (a larger original), otherwise the image's current src.
const zooms = [...document.querySelectorAll('.zoom')];

if (zooms.length) {
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

  zooms.forEach((z, i) => z.addEventListener('click', () => { show(i); box.showModal(); }));
  box.querySelector('.lb-close').addEventListener('click', () => box.close());
  box.querySelector('.lb-prev').addEventListener('click', () => show(index - 1));
  box.querySelector('.lb-next').addEventListener('click', () => show(index + 1));
  box.addEventListener('click', (e) => { if (e.target === box) box.close(); });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });

  // Hide arrows when there's only one image
  if (zooms.length < 2) box.querySelectorAll('.lb-prev, .lb-next').forEach((b) => b.hidden = true);
}
