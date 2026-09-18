const $ = (id) => document.getElementById(id);
const bridge = window.backupDesktop;

// Fictional placeholder sponsors — this is a mock ledger with no real ad network.
const SLIDES = [
  { title: 'Nimbus Snacks', body: 'Cloud-shaped crackers for your next backup break.' },
  { title: 'BrightLeaf Coffee', body: 'Brewed while your files dedupe in the background.' },
  { title: 'Pixel Garden Games', body: 'Plant a pixel, grow a garden, back up your progress.' },
  { title: 'Quiet Hours Radio', body: 'Ambient sound for focused syncing sessions.' },
];

const DURATION_MS = 8000;
const AD_ID = `mock-${Date.now().toString(36)}`;
let startedAt = 0;
let recorded = false;

function pickSlide() {
  return SLIDES[Math.floor(Math.random() * SLIDES.length)];
}

function render() {
  const slide = pickSlide();
  $('slideTitle').textContent = slide.title;
  $('slideBody').textContent = slide.body;
}

function tick() {
  const elapsed = Date.now() - startedAt;
  const pct = Math.min(100, (elapsed / DURATION_MS) * 100);
  $('bar').style.width = `${pct}%`;
  const remaining = Math.max(0, Math.ceil((DURATION_MS - elapsed) / 1000));
  $('countdown').textContent = `${remaining}s`;

  if (elapsed >= DURATION_MS) {
    $('close').disabled = false;
    $('countdown').textContent = 'Done';
    if (!recorded) finish();
    return;
  }
  requestAnimationFrame(tick);
}

async function finish() {
  recorded = true;
  try {
    const result = await bridge.recordAdView({
      ad_id: AD_ID,
      duration_seconds: Math.round(DURATION_MS / 1000),
      was_clicked: false,
    });
    $('earned').textContent = `+$${result.earnings.toFixed(2)} · total $${result.total_earnings.toFixed(2)} (mock, non-redeemable)`;
  } catch (e) {
    $('earned').textContent = `Could not record this view: ${e.message}`;
  }
}

$('close').addEventListener('click', () => bridge.closeScreensaver());

render();
startedAt = Date.now();
requestAnimationFrame(tick);
