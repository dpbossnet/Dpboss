const menuToggle = document.getElementById('menuToggle');
const navList = document.getElementById('navList');

if (menuToggle && navList) {
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    navList.classList.toggle('show');
  });

  // close nav when clicking outside on small screens
  document.addEventListener('click', (e) => {
    if (!navList.classList.contains('show')) return;
    const path = e.composedPath ? e.composedPath() : (e.path || []);
    if (!path.includes(navList) && !path.includes(menuToggle)) {
      navList.classList.remove('show');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// Lucky digits generation
function generateLuckyDigits() {
  const container = document.getElementById('luckyDigits');
  const dateEl = document.getElementById('luckyDate');
  if (!container || !dateEl) return;

  // if admin provided seed, use it once
  const settingsRaw = localStorage.getItem('dp_settings');
  let seed = '';
  try {
    const settings = settingsRaw ? JSON.parse(settingsRaw) : {};
    seed = (settings && settings.seedDigits) ? String(settings.seedDigits) : '';
  } catch (e) { seed = ''; }

  // generate 4 single digits (0-9). If seed provided and length >=4, use first 4 chars.
  let digits;
  if (seed && seed.length >= 4) {
    digits = seed.slice(0,4).split('').map(ch => (/\d/.test(ch) ? Number(ch) : Math.floor(Math.random()*10)));
  } else {
    digits = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10));
  }

  const spans = container.querySelectorAll('.digit');
  spans.forEach((span, i) => {
    span.textContent = digits[i];
    span.setAttribute('aria-label', `Digit ${i + 1}: ${digits[i]}`);
  });

  // set today's date in a compact human form
  const today = new Date();
  const iso = today.toISOString().slice(0, 10);
  dateEl.setAttribute('datetime', iso);
  dateEl.textContent = today.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

 // Live results markets - loadable from localStorage
const DEFAULT_MARKETS = [
  'Sridevi',
  'Time Bazar',
  'Madhur Day',
  'Milan Day',
  'Rajdhani Day',
  'Kalyan',
  'Sridevi Night',
  'Madhur Night',
  'Milan Night',
  'Kalyan Night',
  'Rajdhani Night',
  'Main Bazar'
];

function loadMarketsFromStorage(){
  try {
    const raw = localStorage.getItem('dp_markets');
    if (!raw) return DEFAULT_MARKETS.slice();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed;
    return DEFAULT_MARKETS.slice();
  } catch(e){
    return DEFAULT_MARKETS.slice();
  }
}

// initialize MARKETS from storage (admin can update localStorage and other tabs will pick up)
let MARKETS = loadMarketsFromStorage();

function formatTime(d) {
  return d.toLocaleTimeString();
}

 // create simple mock result (for now): format 111-11-111 and time
function mockResult() {
  // helper to make n-digit random number with leading zeros allowed
  const rnd = (n) => String(Math.floor(Math.random() * Math.pow(10, n))).padStart(n, '0');
  const part1 = rnd(3);
  const part2 = rnd(2);
  const part3 = rnd(3);
  return { pair: `${part1}-${part2}-${part3}`, time: new Date() };
}

function clearGrid(gridSelector, itemClass){
  const grid = document.querySelector(gridSelector);
  if (!grid) return;
  // remove existing cards so we can rebuild when markets change
  grid.querySelectorAll(`.${itemClass}`).forEach(n => n.remove());
}

function renderMarkets() {
  const grid = document.getElementById('resultsGrid');
  const updatedEl = document.getElementById('resultsUpdated');
  if (!grid) return;

  // if markets changed, rebuild cards
  if (grid.querySelectorAll('.market-card').length !== MARKETS.length) {
    grid.innerHTML = '';
    MARKETS.forEach((m) => {
      const card = document.createElement('article');
      card.className = 'market-card';
      card.setAttribute('role', 'listitem');
      card.innerHTML = `
        <div class="market-name">${m}</div>
        <div class="market-result" aria-live="polite">--</div>
        <div class="market-time">--</div>
      `;
      grid.appendChild(card);
    });
  }

  // update values
  const now = new Date();
  const cards = grid.querySelectorAll('.market-card');
  cards.forEach((card, i) => {
    const res = mockResult();
    const resultEl = card.querySelector('.market-result');
    const timeEl = card.querySelector('.market-time');
    if (resultEl) {
      resultEl.textContent = res.pair;
      resultEl.setAttribute('aria-label', `${MARKETS[i] || 'Market'} result ${res.pair}`);
    }
    if (timeEl) timeEl.textContent = formatTime(res.time);
  });

  if (updatedEl) updatedEl.textContent = `Updated: ${formatTime(now)}`;
}

 // run on load and refresh every 30s
document.addEventListener('DOMContentLoaded', () => {
  generateLuckyDigits();
  renderMarkets();
  renderGuesses();
  renderOpenGuesses();
  renderPanelGuesses();

  // periodic refresh
  setInterval(renderMarkets, 30000);
  setInterval(renderGuesses, 45000); // refresh jodi guesses periodically
  setInterval(renderOpenGuesses, 45000);
  setInterval(renderPanelGuesses, 45000);

  // notice close behavior
  const closeBtn = document.getElementById('closeNotice');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const notice = document.querySelector('.notice');
      if (notice) notice.style.display = 'none';
    });
  }

  // refresh button behavior (manual refresh)
  const refreshBtn = document.getElementById('refreshResults');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      // visual feedback
      refreshBtn.disabled = true;
      refreshBtn.classList.add('active');
      renderMarkets();
      renderGuesses();
      renderOpenGuesses();
      renderPanelGuesses();
      setTimeout(() => {
        refreshBtn.classList.remove('active');
        refreshBtn.disabled = false;
      }, 600);
    });
  }

  // respond to storage updates so admin changes reflect automatically
  window.addEventListener('storage', (e) => {
    if (e.key === 'dp_markets' || e.key === 'dp_markets_last_update') {
      MARKETS = loadMarketsFromStorage();
      // clear existing cards so render will rebuild
      const grid = document.getElementById('resultsGrid');
      if (grid) grid.innerHTML = '';
      const guessing = document.getElementById('guessingGrid');
      if (guessing) guessing.innerHTML = '';
      const openG = document.getElementById('openGrid');
      if (openG) openG.innerHTML = '';
      const panelG = document.getElementById('panelGrid');
      if (panelG) panelG.innerHTML = '';
      renderMarkets();
      renderGuesses();
      renderOpenGuesses();
      renderPanelGuesses();
    }
    if (e.key === 'dp_settings' || e.key === 'dp_settings_last_update') {
      // regenerate lucky digits and any UI that depends on settings
      generateLuckyDigits();
      // could also update contact buttons in future
    }
  });
});

/* Free guessing zone logic */

// markets for guessing reuse MARKETS list
function mockGuess() {
  // create a Jodi: two digits concatenated (00-99) displayed as XY
  const a = String(Math.floor(Math.random() * 10));
  const b = String(Math.floor(Math.random() * 10));
  const jodi = `${a}${b}`;
  // create a simple small panel display value (e.g., pair like 11-22)
  const panel = `${String(Math.floor(Math.random() * 100)).padStart(2,'0')}-${String(Math.floor(Math.random() * 100)).padStart(2,'0')}`;
  return { jodi, panel, time: new Date() };
}

function renderGuesses() {
  const grid = document.getElementById('guessingGrid');
  if (!grid) return;

  // initialize cards if empty or count mismatch
  if (grid.querySelectorAll('.guess-card').length !== MARKETS.length) {
    grid.innerHTML = '';
    MARKETS.forEach((m) => {
      const card = document.createElement('article');
      card.className = 'guess-card';
      card.setAttribute('role', 'listitem');
      card.innerHTML = `
        <div class="guess-market">${m}</div>
        <div class="guess-jodi" aria-live="polite">--</div>
        <div class="guess-panel">--</div>
      `;
      grid.appendChild(card);
    });
  }

  // update guessed values
  const cards = grid.querySelectorAll('.guess-card');
  cards.forEach((card, i) => {
    const g = mockGuess();
    const jodiEl = card.querySelector('.guess-jodi');
    const panelEl = card.querySelector('.guess-panel');
    if (jodiEl) {
      jodiEl.textContent = g.jodi;
      jodiEl.setAttribute('aria-label', `${MARKETS[i]} guessed jodi ${g.jodi}`);
    }
    if (panelEl) panelEl.textContent = g.panel;
  });
}

/* Open and Panel guessing (new) */

function mockOpenGuess() {
  // Open guess — a single 3-digit open number
  const num = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return { open: num, time: new Date() };
}

function mockPanelOnly() {
  // Panel guess — a small panel like 12-34 but distinct from jodi panel
  const p1 = String(Math.floor(Math.random() * 100)).padStart(2, '0');
  const p2 = String(Math.floor(Math.random() * 100)).padStart(2, '0');
  return { panel: `${p1}-${p2}`, time: new Date() };
}

function renderOpenGuesses() {
  const grid = document.getElementById('openGrid');
  if (!grid) return;

  if (grid.querySelectorAll('.open-card').length !== MARKETS.length) {
    grid.innerHTML = '';
    MARKETS.forEach((m) => {
      const card = document.createElement('article');
      card.className = 'open-card guess-card';
      card.setAttribute('role', 'listitem');
      card.innerHTML = `
        <div class="guess-market">${m}</div>
        <div class="open-value" aria-live="polite">--</div>
        <div class="guess-time">--</div>
      `;
      grid.appendChild(card);
    });
  }

  const cards = grid.querySelectorAll('.open-card');
  cards.forEach((card, i) => {
    const g = mockOpenGuess();
    const valEl = card.querySelector('.open-value');
    const timeEl = card.querySelector('.guess-time');
    if (valEl) {
      valEl.textContent = g.open;
      valEl.setAttribute('aria-label', `${MARKETS[i]} open guess ${g.open}`);
      valEl.classList.add('guess-jodi');
    }
    if (timeEl) timeEl.textContent = formatTime(g.time);
  });
}

function renderPanelGuesses() {
  const grid = document.getElementById('panelGrid');
  if (!grid) return;

  if (grid.querySelectorAll('.panel-card').length !== MARKETS.length) {
    grid.innerHTML = '';
    MARKETS.forEach((m) => {
      const card = document.createElement('article');
      card.className = 'panel-card guess-card';
      card.setAttribute('role', 'listitem');
      card.innerHTML = `
        <div class="guess-market">${m}</div>
        <div class="panel-value" aria-live="polite">--</div>
        <div class="guess-time">--</div>
      `;
      grid.appendChild(card);
    });
  }

  const cards = grid.querySelectorAll('.panel-card');
  cards.forEach((card, i) => {
    const g = mockPanelOnly();
    const valEl = card.querySelector('.panel-value');
    const timeEl = card.querySelector('.guess-time');
    if (valEl) {
      valEl.textContent = g.panel;
      valEl.setAttribute('aria-label', `${MARKETS[i]} panel guess ${g.panel}`);
      valEl.classList.add('guess-panel');
    }
    if (timeEl) timeEl.textContent = formatTime(g.time);
  });
}