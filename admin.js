/*
  Simple admin tool that stores configuration in localStorage.
  Keys:
    dp_markets -> JSON array of market names
    dp_settings -> JSON object {seoTitle, seoDesc, canonical, waEnabled, waNumber, callEnabled, callNumber, seedDigits}
*/

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

function loadMarkets(){
  try {
    const raw = localStorage.getItem('dp_markets');
    if (!raw) return DEFAULT_MARKETS.slice();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return DEFAULT_MARKETS.slice();
  } catch(e){ return DEFAULT_MARKETS.slice(); }
}

function saveMarkets(markets){
  localStorage.setItem('dp_markets', JSON.stringify(markets));
  // notify other tabs/pages
  localStorage.setItem('dp_markets_last_update', String(Date.now()));
}

function loadSettings(){
  try {
    const raw = localStorage.getItem('dp_settings');
    return raw ? JSON.parse(raw) : {};
  } catch(e){ return {}; }
}

function saveSettings(obj){
  localStorage.setItem('dp_settings', JSON.stringify(obj));
  localStorage.setItem('dp_settings_last_update', String(Date.now()));
}

/* Authentication (simple client-side) */
const ADMIN_USER = 'mannu';
const ADMIN_PASS = 'raja4334@#';
const SESSION_KEY = 'dp_admin_auth'; // stores ISO expiry

// DOM elements for login
const loginOverlay = document.getElementById('loginOverlay');
const loginBtn = document.getElementById('loginBtn');
const loginUser = document.getElementById('loginUser');
const loginPass = document.getElementById('loginPass');
const loginError = document.getElementById('loginError');
const loginClose = document.getElementById('loginClose');
const adminApp = document.getElementById('adminApp');
const logoutBtn = document.getElementById('logoutBtn');

function isAuthenticated(){
  try{
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const exp = new Date(raw);
    return exp > new Date();
  }catch(e){ return false; }
}

function setSession(minutes = 30){
  const exp = new Date(Date.now() + minutes * 60e3);
  sessionStorage.setItem(SESSION_KEY, exp.toISOString());
}

function clearSession(){
  sessionStorage.removeItem(SESSION_KEY);
}

function showAdminIfAuth(){
  if (isAuthenticated()){
    if (loginOverlay) loginOverlay.style.display = 'none';
    if (adminApp) adminApp.style.display = '';
    // move the existing admin panels inside adminApp so they remain functional
    const existingWrap = document.querySelector('.admin-wrap');
    if (existingWrap && adminApp && !adminApp.contains(existingWrap)) {
      adminApp.appendChild(existingWrap);
    }
  } else {
    if (loginOverlay) loginOverlay.style.display = '';
    if (adminApp) adminApp.style.display = 'none';
  }
}

// login button behavior
if (loginBtn){
  loginBtn.addEventListener('click', () => {
    const user = (loginUser.value || '').trim();
    const pass = (loginPass.value || '').trim();
    if (user === ADMIN_USER && pass === ADMIN_PASS){
      setSession(60); // authenticated for 60 minutes
      showAdminIfAuth();
    } else {
      if (loginError) { loginError.style.display = ''; loginError.textContent = 'Invalid username or password'; }
      setTimeout(() => { if (loginError) loginError.style.display = 'none'; }, 3000);
    }
  });
}
if (loginClose){
  loginClose.addEventListener('click', () => {
    // allow closing overlay but keep admin hidden
    if (loginOverlay) loginOverlay.style.display = 'none';
  });
}
if (logoutBtn){
  logoutBtn.addEventListener('click', () => {
    clearSession();
    // reload to reset UI
    window.location.reload();
  });
}

// initial check
document.addEventListener('DOMContentLoaded', () => {
  showAdminIfAuth();
});

/* DOM helpers */
const marketsList = document.getElementById('marketsList');
const newMarketInput = document.getElementById('newMarket');
const addMarketBtn = document.getElementById('addMarket');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const jsonArea = document.getElementById('jsonArea');
const resetBtn = document.getElementById('resetBtn');
const applyBtn = document.getElementById('applyBtn');
const openHome = document.getElementById('openHome');

const seoTitle = document.getElementById('seoTitle');
const seoDesc = document.getElementById('seoDesc');
const canonical = document.getElementById('canonical');
const waNumber = document.getElementById('waNumber');
const waEnabled = document.getElementById('waEnabled');
const callNumber = document.getElementById('callNumber');
const callEnabled = document.getElementById('callEnabled');
const seedDigits = document.getElementById('seedDigits');
const saveSettingsBtn = document.getElementById('saveSettings');
const clearSettingsBtn = document.getElementById('clearSettings');

let markets = loadMarkets();
let settings = loadSettings();

function renderMarketsList(){
  marketsList.innerHTML = '';
  markets.forEach((m, idx) => {
    const el = document.createElement('div');
    el.className = 'market-item';
    el.innerHTML = `
      <div class="name">${m}</div>
      <div style="display:flex;gap:6px">
        <button class="btn ghost edit" data-idx="${idx}">Edit</button>
        <button class="btn" style="background:#ff5a5a;color:#fff" data-idx="${idx}">Remove</button>
      </div>
    `;
    marketsList.appendChild(el);
  });
}

function bindListActions(){
  marketsList.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const idx = Number(btn.getAttribute('data-idx'));
    if (btn.classList.contains('edit')){
      const newName = prompt('Edit market name', markets[idx]);
      if (newName && newName.trim()){
        markets[idx] = newName.trim();
        renderMarketsList();
      }
    } else {
      // remove
      if (confirm(`Remove market "${markets[idx]}"?`)){
        markets.splice(idx,1);
        renderMarketsList();
      }
    }
  });
}

addMarketBtn.addEventListener('click', () => {
  const val = (newMarketInput.value || '').trim();
  if (!val) return alert('Enter a market name');
  markets.push(val);
  newMarketInput.value = '';
  renderMarketsList();
});

exportBtn.addEventListener('click', () => {
  const payload = { markets, settings: loadSettings() };
  jsonArea.value = JSON.stringify(payload, null, 2);
  alert('Exported JSON to text area. Copy or save externally.');
});

importBtn.addEventListener('click', () => {
  const raw = jsonArea.value.trim();
  if (!raw) return alert('Paste JSON into the textarea first');
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.markets)) markets = parsed.markets.slice();
    else if (Array.isArray(parsed)) markets = parsed.slice();
    if (parsed.settings) saveSettings(parsed.settings);
    renderMarketsList();
    alert('Imported successfully (preview). Click Apply & Save to persist.');
  } catch(e){
    alert('Invalid JSON: ' + e.message);
  }
});

resetBtn.addEventListener('click', () => {
  if (!confirm('Reset markets to defaults?')) return;
  markets = DEFAULT_MARKETS.slice();
  renderMarketsList();
});

applyBtn.addEventListener('click', () => {
  saveMarkets(markets);
  // also re-save settings from fields
  const cur = {
    seoTitle: seoTitle.value || '',
    seoDesc: seoDesc.value || '',
    canonical: canonical.value || '',
    waNumber: waNumber.value || '',
    waEnabled: !!waEnabled.checked,
    callNumber: callNumber.value || '',
    callEnabled: !!callEnabled.checked,
    seedDigits: seedDigits.value || ''
  };
  saveSettings(cur);
  alert('Saved. Changes will be picked up by the site (reload home to apply).');
});

openHome.addEventListener('click', () => {
  window.open('/', '_blank');
});

saveSettingsBtn.addEventListener('click', () => {
  const cur = {
    seoTitle: seoTitle.value || '',
    seoDesc: seoDesc.value || '',
    canonical: canonical.value || '',
    waNumber: waNumber.value || '',
    waEnabled: !!waEnabled.checked,
    callNumber: callNumber.value || '',
    callEnabled: !!callEnabled.checked,
    seedDigits: seedDigits.value || ''
  };
  saveSettings(cur);
  alert('Settings saved.');
});

clearSettingsBtn.addEventListener('click', () => {
  if (!confirm('Clear all saved settings?')) return;
  localStorage.removeItem('dp_settings');
  settings = {};
  fillSettings();
  alert('Settings cleared.');
});

function fillSettings(){
  settings = loadSettings();
  seoTitle.value = settings.seoTitle || '';
  seoDesc.value = settings.seoDesc || '';
  canonical.value = settings.canonical || '';
  waNumber.value = settings.waNumber || '';
  waEnabled.checked = !!settings.waEnabled;
  callNumber.value = settings.callNumber || '';
  callEnabled.checked = !!settings.callEnabled;
  seedDigits.value = settings.seedDigits || '';
}

function init(){
  renderMarketsList();
  bindListActions();
  fillSettings();
}

init();