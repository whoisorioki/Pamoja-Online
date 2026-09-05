// Nguvu Pamoja — Anonymous Pseudonym Token & Space Management

const WORD_POOL = [
  'anchor', 'apex', 'aspen', 'auburn', 'aurora', 'awe',
  'balance', 'balsam', 'banner', 'beacon', 'bear', 'birch', 'blossom',
  'blue', 'bold', 'bounty', 'brave', 'breeze', 'brook', 'calm', 'canyon', 'cedar',
  'champion', 'cherish', 'cinder', 'clarity', 'clover', 'coast', 'compass', 'coral',
  'courage', 'covenant', 'crane', 'crest', 'cypress', 'dahlia', 'dawn', 'daybreak',
  'deep', 'diamond', 'dove', 'dream', 'drift', 'eagle', 'echo', 'elm', 'ember',
  'endure', 'eternal', 'faith', 'falcon', 'fern', 'fidelity', 'fir', 'firefly',
  'fleet', 'forest', 'fortress', 'freedom', 'gentle', 'gleam', 'glory', 'gold',
  'grace', 'grape', 'guardian', 'gull', 'harbor', 'harmony', 'haven', 'healing',
  'heron', 'holly', 'hope', 'humble', 'hymn', 'icicle', 'infinity', 'innocent',
  'island', 'ivory', 'ivy', 'jasmine', 'journey', 'joy', 'juniper', 'kindness',
  'lamb', 'lantern', 'lark', 'laurel', 'lilac', 'lily', 'light', 'lodge', 'lotus',
  'loyal', 'luminous', 'magnolia', 'maple', 'marigold', 'meadow', 'mercy', 'mist',
  'moon', 'mountain', 'myrtle', 'noble', 'north', 'oak', 'ocean', 'olive', 'orbit',
  'orchid', 'oyster', 'palm', 'pastor', 'path', 'peace', 'pearl', 'pebble', 'pine',
  'placid', 'prairie', 'promise', 'quiet', 'quill', 'radiant', 'rapture', 'repose',
  'resilient', 'ridge', 'river', 'rose', 'rue', 'sage', 'salvation', 'sanctuary',
  'sapphire', 'seabreeze', 'serene', 'shale', 'shepherd', 'shelter', 'shield',
  'shimmer', 'sky', 'snow', 'solace', 'sparrow', 'spring', 'stone', 'stream',
  'summit', 'sunrise', 'surge', 'swallow', 'temple', 'thistle', 'timber', 'tranquil',
  'trust', 'uplift', 'valley', 'valor', 'verity', 'violet', 'vital', 'wander',
  'waterfall', 'willow', 'windsong', 'wisdom', 'zenith'
].filter((w, i, a) => a.indexOf(w) === i);

const TOKEN_WORD_COUNT = 3;

function generateThreeWordToken() {
  const selected = [];
  while (selected.length < TOKEN_WORD_COUNT) {
    const randomWord = WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)];
    if (!selected.includes(randomWord)) {
      selected.push(randomWord);
    }
  }
  return selected.join('-');
}

function getStoredToken() {
  return localStorage.getItem('nguvu_token') || null;
}

function setStoredToken(token) {
  if (!token) return;
  const cleanToken = token.trim().toLowerCase();
  localStorage.setItem('nguvu_token', cleanToken);
  updateTokenUI();
}

function clearStoredToken() {
  localStorage.removeItem('nguvu_token');
  updateTokenUI();
}

function getStoredSpace() {
  return localStorage.getItem('nguvu_space') || null;
}

function setStoredSpace(space) {
  if (space === 'mens' || space === 'womens') {
    localStorage.setItem('nguvu_space', space);
  }
}

function getStoredNickname() {
  return localStorage.getItem('nguvu_nickname') || '';
}

function setStoredNickname(nickname) {
  if (nickname && nickname.trim()) {
    localStorage.setItem('nguvu_nickname', nickname.trim());
  }
}

function getStoredPassphrase(spaceKey) {
  if (!spaceKey) return '';
  return localStorage.getItem('nguvu_passphrase_' + spaceKey) || '';
}

function setStoredPassphrase(spaceKey, passphrase) {
  if (spaceKey && passphrase) {
    localStorage.setItem('nguvu_passphrase_' + spaceKey, passphrase.trim());
  }
}

function clearStoredPassphrase(spaceKey) {
  if (spaceKey) {
    localStorage.removeItem('nguvu_passphrase_' + spaceKey);
  }
}

function updateTokenUI() {
  const token = getStoredToken();
  const badgeEl = document.getElementById('user-token-badge');
  if (badgeEl) {
    if (token) {
      badgeEl.innerHTML = `<span class="badge" title="Your anonymous token">🔑 ${token}</span> <button onclick="clearStoredToken()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.75rem;text-decoration:underline;">Change</button>`;
    } else {
      badgeEl.innerHTML = `<a href="/#token-setup" class="badge" style="text-decoration:none;background:var(--border-color);color:var(--text-primary);">🔑 Set Anonymous Token</a>`;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateTokenUI();
});
